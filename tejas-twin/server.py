#!/usr/bin/env python3
"""
Tejas AI — 3D Digital Twin server (pure Python, standard library only).
=======================================================================
Serves the 3D digital-twin web app and hosts the chat-based AI "brain".

The brain is *context-aware*: every request carries the live state of the twin,
so the AI answers AND acts based on the actual circumstances of the hall

(weather, IT load, PUE, hottest rack, open maintenance alerts, savings...).

Brain priority (first available wins):
    1. OpenAI          — if  OPENAI_API_KEY  is set   (richest understanding)
    2. Ollama (local)  — if  reachable                (offline / sovereign)
    3. Local parser    — always (built into the browser; demo never dies)

Run:
    export OPENAI_API_KEY=sk-...        # optional, but recommended
    python3 server.py                  # -> http://localhost:7878

No pip installs. No third-party packages. Python 3.8+.
"""

import json
import os
import socket
import ssl
import subprocess
import threading
import time
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

PUBLIC = Path(__file__).parent / "public"
PORT = int(os.environ.get("PORT", "7878"))


def _load_secret(name):
    """Resolve a secret from (1) the environment, or (2) a local, git-ignored
    `.tejas-secret` file (KEY=VALUE lines). Keeps real keys out of source so the
    repo is safe to share, while the demo still 'just works' locally."""
    val = os.environ.get(name)
    if val:
        return val.strip()
    secret_file = Path(__file__).parent / ".tejas-secret"
    try:
        for line in secret_file.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            if k.strip() == name:
                return v.strip().strip("'\"")
    except Exception:
        pass
    return ""


OPENAI_KEY = _load_secret("OPENAI_API_KEY")
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
# A vision-capable OpenAI model for the camera "scan & identify" feature.
OPENAI_VISION_MODEL = os.environ.get("OPENAI_VISION_MODEL", "gpt-4o-mini")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("TEJAS_MODEL", "qwen2.5:7b-instruct")
# A light local vision model (e.g. `ollama pull llava:7b`) for offline scanning.
OLLAMA_VISION_MODEL = os.environ.get("TEJAS_VISION_MODEL", "llava:7b")

# ---- in-memory twin registry (shared across desktop + phone) --------------
# So a twin created by a phone scan instantly appears on the desktop admin.
TWINS = []          # list of dicts: {id, name, type, method, status, created}
TWINS_LOCK = threading.Lock()
_TWIN_SEQ = [0]

# Per-component lifecycle status (the inspect-&-fix red→blue state).
# key: f"{twinId}:{id}" -> {id, twinId, status, corrected, ts}
# In-memory + thread-locked, exactly like TWINS. Lets a "corrected" unit stay
# blue across reloads and sync desktop ↔ phone via polling.
COMPONENTS = {}
COMPONENTS_LOCK = threading.Lock()


def upsert_component(cid, twin_id, status, corrected):
    with COMPONENTS_LOCK:
        rec = {
            "id": cid,
            "twinId": twin_id or "default",
            "status": status or "healthy",
            "corrected": bool(corrected),
            "ts": int(time.time()),
        }
        COMPONENTS[f"{rec['twinId']}:{cid}"] = rec
        return rec


def list_components(twin_id=None):
    with COMPONENTS_LOCK:
        vals = list(COMPONENTS.values())
    if twin_id:
        vals = [v for v in vals if v["twinId"] == twin_id]
    return vals


def add_twin(name, ttype, method, components=None, bounds=None):
    with TWINS_LOCK:
        _TWIN_SEQ[0] += 1
        twin = {
            "id": _TWIN_SEQ[0],
            "name": name or f"Factory Twin {_TWIN_SEQ[0]}",
            "type": ttype or "factory",
            "method": method or "manual",
            "components": components or [],
            "bounds": bounds or None,
            "status": "ready",
            "created": int(time.time()),
        }
        TWINS.append(twin)
        return twin


MIME = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml", ".ico": "image/x-icon",
}

# ---------------------------------------------------------------------------
# The brain's brief: it is the autonomous operator of the cooling twin.
# It must return strict JSON: a short spoken reply + a list of actions.
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are "Tejas AI", the autonomous operator of an AI data-center cooling digital twin.
You optimise cooling energy (PUE) while keeping every server rack's inlet air inside the ASHRAE safe band,
AND you watch the hall for maintenance issues (a rack running hotter than its load explains = likely service needed).

You will be given the LIVE STATE of the twin (ambient weather, IT load, PUE for the AI vs the baseline controller,
the hottest rack, any open alerts, current savings, mode). Use it to answer in context — be specific and concrete,
referencing the actual numbers. Speak like a sharp, calm operations engineer. Keep replies to 1-3 short sentences.

Return ONLY valid JSON (no markdown, no prose outside the JSON) of the form:
{ "reply": "<short spoken answer, in the user's language>", "actions": [ <action>, ... ] }

Action types (include only those needed to satisfy the request):
- {"type":"setWeather","tempC":<28..50>}            change the outdoor temperature (heat wave)
- {"type":"setLoad","pct":<30..110>}                change overall IT load (% utilisation)
- {"type":"setMode","mode":"ai"|"baseline"}         hand control to Tejas AI, or back to the dumb baseline
- {"type":"show","panels":[...]}                     reveal panels: "savings","power","efficiency","racks","alerts","fleet","service","autonomy","oneline"
- {"type":"focusRack","name":"<rack name e.g. GPU-16>"}  highlight a specific rack in the 3D twin
- {"type":"setFleet","count":<1..500>}              facilities for the fleet projection

"service" = the predictive-maintenance work order + drafted email for the degrading machine.
"autonomy" = the live autonomous-control + learning view (what the AI is doing and why).
"oneline" = the electrical single-line diagram (grid -> transformer -> switchgear -> UPS -> PDU -> NVIDIA GPU racks) with live kW/amps. Use it when asked about wiring, electrical, power distribution, switchgear/UPS/PDU, or "single-line".

Examples:
User: what's happening right now?
{"reply":"I'm in autonomous control. Outside is hot so I'm running supply air warm to protect chiller COP, holding every rack in the band at PUE around the value shown.","actions":[{"type":"show","panels":["autonomy","efficiency"]}]}

User: how much electricity are we using?
{"reply":"Total facility draw is the figure on the power panel; cooling is running well under the baseline controller right now.","actions":[{"type":"show","panels":["power"]}]}

User: is any machine going down / underperforming?
{"reply":"Yes - GPU-16 has been degrading for over a year from a restricted-airflow fault. I've drafted the service email with the exact parts so the technician can fix it in minutes.","actions":[{"type":"show","panels":["service","alerts"]},{"type":"focusRack","name":"GPU-16"}]}

User: it's a heat wave, push outside to 47
{"reply":"Ramping ambient to 47C. Watch the baseline burn power while I hold PUE by running the supply air warmer.","actions":[{"type":"setWeather","tempC":47},{"type":"show","panels":["power","efficiency"]}]}

User: take control / optimise it
{"reply":"Taking control. I'll run the hall as warm and with as little airflow as the safe band allows.","actions":[{"type":"setMode","mode":"ai"},{"type":"show","panels":["autonomy","savings"]}]}"""


def context_block(ctx):
    if not ctx:
        return "No live state provided."
    alerts = ctx.get("alerts") or []
    block = (
        "LIVE STATE:\n"
        f"- mode: {ctx.get('mode')}\n"
        f"- outdoor ambient: {ctx.get('Tamb')}C ; IT load: {ctx.get('loadPct')}%\n"
        f"- PUE: Tejas {ctx.get('aiPUE')} vs baseline {ctx.get('basePUE')}\n"
        f"- total facility power now: {ctx.get('aiTotal')} kW (baseline would draw {ctx.get('baseTotal')} kW)\n"
        f"- cooling energy now: Tejas {ctx.get('aiCool')} kW vs baseline {ctx.get('baseCool')} kW ({ctx.get('coolPct')}% leaner)\n"
        f"- autonomy: {ctx.get('autonomy')}\n"
        f"- savings: Rs {ctx.get('rupeesDay')}/day, Rs {ctx.get('rupeesYear')}/yr, {ctx.get('co2Year')} t CO2/yr\n"
        f"- hottest rack: {ctx.get('hottest')} at {ctx.get('hottestTemp')}C (safe <= 27C recommended)\n"
        f"- open alerts: {' | '.join(alerts) if alerts else 'none'}"
    )
    # Optional free-text facility spec (size, racks, GPU models, cooling topology,
    # the flagged service issue…) so the assistant can answer detail questions.
    spec = ctx.get("spec") or ctx.get("notes")
    if spec:
        block += f"\n\nFACILITY SPEC (use these concrete facts when asked about size/specs/details):\n{str(spec)[:1800]}"
    return block


def _post_json(url, payload, headers, timeout=20):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("content-type", "application/json")
    for k, v in headers.items():
        req.add_header(k, v)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def ask_openai(message, ctx):
    payload = {
        "model": OPENAI_MODEL,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{context_block(ctx)}\n\nOperator: {message}"},
        ],
    }
    out = _post_json(
        "https://api.openai.com/v1/chat/completions",
        payload,
        {"authorization": f"Bearer {OPENAI_KEY}"},
    )
    return json.loads(out["choices"][0]["message"]["content"])


def ask_ollama(message, ctx):
    payload = {
        "model": OLLAMA_MODEL, "stream": False, "format": "json",
        "options": {"temperature": 0.2, "num_predict": 320},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{context_block(ctx)}\n\nOperator: {message}"},
        ],
    }
    out = _post_json(f"{OLLAMA_URL}/api/chat", payload, {})
    return json.loads(out["message"]["content"])


def lan_ips():
    """Best-effort list of this machine's LAN IPs, for the phone QR code."""
    ips = []
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.append(s.getsockname()[0])
        s.close()
    except Exception:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None):
            ip = info[4][0]
            if "." in ip and not ip.startswith("127.") and ip not in ips:
                ips.append(ip)
    except Exception:
        pass
    return ips


DESIGN_PROMPT = """You are a digital-twin layout designer. Given a facility description, return a
realistic component list for its digital twin. Output ONLY JSON:
{ "name": "<short twin name>", "components": [ { "type": "<type>", "count": <int> }, ... ] }

Use ONLY these component types:
 land, room, rack, crac, chiller, compressor, cooler, fan, ac, motor, pump, cnc, conveyor,
 temp, vib, flow, hum, door

Rules:
- Always include exactly one "land".
- Choose realistic counts for the facility (a "highly advanced data center" => many racks (8-16),
  several crac units, 1-2 chillers, temp + hum sensors; a cold storage => compressors, evaporator
  coolers, temp/hum; a factory line => motors, pumps, conveyors, vibration sensors).
- Keep total components <= 40.

Example: "highly advanced data center"
{"name":"Advanced Data Center","components":[{"type":"land","count":1},{"type":"room","count":1},{"type":"rack","count":12},{"type":"crac","count":4},{"type":"chiller","count":2},{"type":"temp","count":4},{"type":"hum","count":2}]}"""


def design_layout(prompt):
    user = f"Facility: {prompt}\nReturn the JSON layout."
    if OPENAI_KEY:
        out = _post_json("https://api.openai.com/v1/chat/completions", {
            "model": OPENAI_MODEL, "temperature": 0.3,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": DESIGN_PROMPT}, {"role": "user", "content": user}],
        }, {"authorization": f"Bearer {OPENAI_KEY}"})
        return json.loads(out["choices"][0]["message"]["content"])
    out = _post_json(f"{OLLAMA_URL}/api/chat", {
        "model": OLLAMA_MODEL, "stream": False, "format": "json",
        "options": {"temperature": 0.2, "num_predict": 400},
        "messages": [{"role": "system", "content": DESIGN_PROMPT}, {"role": "user", "content": user}],
    }, {})
    return json.loads(out["message"]["content"])


INGEST_PROMPT = """You are commissioning an enterprise data-center DIGITAL TWIN for closed-loop
cooling control (mixed air + liquid). You are given a DRAFT SPEC auto-discovered from the site's
BMS/DCIM (with gaps and unknowns). Produce the most important CLARIFICATION QUESTIONS a controls
engineer must answer before we can safely build and control the twin — prioritized by impact on
ENERGY and SAFETY. Ask only what materially changes the model. Max 6 questions.

Return ONLY JSON:
{ "questions": [ { "q": "<question>", "why": "<one line: why it matters>", "default": "<a sensible assumed answer>" } ] }

Focus on: rack power density / GPU SKU, air-vs-liquid heat split, ASHRAE inlet limits, chiller/CDU
setpoint ranges, redundancy (N/N+1/2N), which points are writable, free-cooling/economizer, and any
open cooling loop or capacity mismatch in the draft."""


def ingest_questions(spec):
    user = "DRAFT SPEC (discovered):\n" + json.dumps(spec)[:2000] + "\n\nReturn the clarification questions JSON."
    if OPENAI_KEY:
        out = _post_json("https://api.openai.com/v1/chat/completions", {
            "model": OPENAI_MODEL, "temperature": 0.3,
            "response_format": {"type": "json_object"},
            "messages": [{"role": "system", "content": INGEST_PROMPT}, {"role": "user", "content": user}],
        }, {"authorization": f"Bearer {OPENAI_KEY}"})
        return json.loads(out["choices"][0]["message"]["content"])
    out = _post_json(f"{OLLAMA_URL}/api/chat", {
        "model": OLLAMA_MODEL, "stream": False, "format": "json",
        "options": {"temperature": 0.2, "num_predict": 500},
        "messages": [{"role": "system", "content": INGEST_PROMPT}, {"role": "user", "content": user}],
    }, {})
    return json.loads(out["message"]["content"])


# ---------------------------------------------------------------------------
# VISION — "point the phone at any object and build its twin".
# The model looks at a real camera frame and returns what it is, the parts it
# can see, the sensors a twin of it would carry, AND concrete operating /
# maintenance steps (e.g. a bottle -> "twist the cap anti-clockwise from the
# top"). This is what makes the scan feel real instead of canned.
# ---------------------------------------------------------------------------
VISION_PROMPT = """You are "Tejas AI" building a live DIGITAL TWIN of whatever object is in the photo.
Look at the image and identify the single most prominent object (it may be a real machine, or an everyday
stand-in like a water bottle, mug or fan used for a demo — treat it seriously either way).

Return ONLY valid JSON (no markdown):
{
  "name": "<specific object name, e.g. 'Water Bottle' or 'Induction Motor'>",
  "model": "<short plausible model code, e.g. 'AQ-750' or 'BL-280'>",
  "category": "<one of: bottle, motor, pump, fan, appliance, electronics, container, machine, other>",
  "confidence": <0..1>,
  "summary": "<one sentence describing the object and its state>",
  "parts": ["<visible part>", "<visible part>", "<visible part>"],
  "sensors": [ {"label":"<sensor>","unit":"<unit or empty>"}, ... 3 to 5 items ],
  "steps": [ "<imperative how-to step>", ... 3 to 5 short steps ]
}

Rules:
- "steps" must be REAL, specific instructions for THIS object. For a bottle: how to open it
  ("Hold the base, twist the cap anti-clockwise from the top"), refill and reseal it.
  For a machine: how to safely start/inspect/service it.
- "sensors" are what a digital twin of this object would monitor (temperature, level, vibration,
  RPM, pressure, weight, charge...). Pick ones that fit the object.
- Be concrete and confident. Keep every string short."""


def _vision_messages(hint):
    instr = VISION_PROMPT
    if hint:
        instr += f"\n\nOperator hint about the object: {hint}"
    return instr


def vision_openai(data_url, hint=""):
    payload = {
        "model": OPENAI_VISION_MODEL,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _vision_messages(hint)},
            {"role": "user", "content": [
                {"type": "text", "text": "Identify this object and build its twin. Return the JSON."},
                {"type": "image_url", "image_url": {"url": data_url, "detail": "low"}},
            ]},
        ],
    }
    out = _post_json(
        "https://api.openai.com/v1/chat/completions",
        payload,
        {"authorization": f"Bearer {OPENAI_KEY}"},
        timeout=40,
    )
    return json.loads(out["choices"][0]["message"]["content"])


def vision_ollama(data_url, hint=""):
    # Ollama wants the raw base64 (no data: prefix) in an `images` array.
    b64 = data_url.split(",", 1)[-1]
    payload = {
        "model": OLLAMA_VISION_MODEL, "stream": False, "format": "json",
        "options": {"temperature": 0.2, "num_predict": 500},
        "messages": [
            {"role": "system", "content": _vision_messages(hint)},
            {"role": "user",
             "content": "Identify this object and build its twin. Return the JSON.",
             "images": [b64]},
        ],
    }
    out = _post_json(f"{OLLAMA_URL}/api/chat", payload, {}, timeout=60)
    return json.loads(out["message"]["content"])


def vision_identify(data_url, hint=""):
    """Best brain first; the caller handles the offline fallback."""
    if OPENAI_KEY:
        return vision_openai(data_url, hint), "openai"
    return vision_ollama(data_url, hint), "ollama"


def health():
    if OPENAI_KEY:
        return {"ok": True, "brain": "openai", "model": OPENAI_MODEL, "vision": True}
    try:
        with urllib.request.urlopen(f"{OLLAMA_URL}/api/tags", timeout=1.2) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            present = any(m.get("name") == OLLAMA_MODEL for m in data.get("models", []))
            return {"ok": True, "brain": "ollama", "model": OLLAMA_MODEL, "present": present}
    except Exception:
        return {"ok": True, "brain": "fallback"}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):  # quiet console
        pass

    def _json(self, code, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("content-type", "application/json; charset=utf-8")
        self.send_header("content-length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/health"):
            return self._json(200, health())
        if self.path.startswith("/api/info"):
            return self._json(200, {"ips": lan_ips(), "port": PORT})
        if self.path.startswith("/api/twins"):
            with TWINS_LOCK:
                return self._json(200, {"twins": list(TWINS)})
        if self.path.startswith("/api/components"):
            q = urllib.parse.urlparse(self.path).query
            twin_id = urllib.parse.parse_qs(q).get("twinId", [None])[0]
            return self._json(200, {"components": list_components(twin_id)})
        self._serve_static()

    def do_POST(self):
        if self.path.startswith("/api/twins"):
            length = int(self.headers.get("content-length", "0"))
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                return self._json(400, {"error": "bad json"})
            twin = add_twin(body.get("name"), body.get("type", "factory"), body.get("method"),
                            body.get("components"), body.get("bounds"))
            return self._json(200, {"ok": True, "twin": twin})
        if self.path.startswith("/api/components"):
            length = int(self.headers.get("content-length", "0"))
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                return self._json(400, {"error": "bad json"})
            if body.get("id") is None:
                return self._json(400, {"error": "missing id"})
            rec = upsert_component(body.get("id"), body.get("twinId"),
                                   body.get("status"), body.get("corrected"))
            return self._json(200, {"ok": True, "component": rec})
        if self.path.startswith("/api/design"):
            length = int(self.headers.get("content-length", "0"))
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                return self._json(400, {"error": "bad json"})
            prompt = str(body.get("prompt", ""))[:600]
            try:
                out = design_layout(prompt)
                return self._json(200, {"ok": True, **out})
            except Exception as e:
                return self._json(200, {"ok": False, "fallback": True, "error": str(e)})
        if self.path.startswith("/api/ingest/questions"):
            length = int(self.headers.get("content-length", "0"))
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                return self._json(400, {"error": "bad json"})
            try:
                out = ingest_questions(body.get("spec") or {})
                return self._json(200, {"ok": True, **out})
            except Exception as e:
                return self._json(200, {"ok": False, "fallback": True, "error": str(e)})
        if self.path.startswith("/api/vision"):
            # camera frames are large — allow a bigger body
            length = int(self.headers.get("content-length", "0"))
            if length > 12_000_000:
                return self._json(413, {"error": "image too large"})
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                return self._json(400, {"error": "bad json"})
            data_url = str(body.get("image", ""))
            hint = str(body.get("hint", ""))[:200]
            if not data_url.startswith("data:image"):
                return self._json(400, {"error": "no image"})
            try:
                out, brain = vision_identify(data_url, hint)
                return self._json(200, {"ok": True, "brain": brain, **out})
            except Exception as e:
                # client falls back to its built-in heuristic so the demo never dies
                return self._json(200, {"ok": False, "fallback": True, "error": str(e)})
        if self.path.startswith("/api/chat"):
            length = int(self.headers.get("content-length", "0"))
            try:
                body = json.loads(self.rfile.read(length) or b"{}")
            except Exception:
                return self._json(400, {"error": "bad json"})
            message = str(body.get("message", ""))[:600]
            ctx = body.get("context")
            if not message:
                return self._json(400, {"error": "empty message"})
            try:
                if OPENAI_KEY:
                    out, brain = ask_openai(message, ctx), "openai"
                else:
                    out, brain = ask_ollama(message, ctx), "ollama"
                return self._json(200, {
                    "ok": True, "brain": brain,
                    "reply": out.get("reply", ""), "actions": out.get("actions", []),
                })
            except Exception as e:
                # tell the client to use its built-in fallback parser
                return self._json(200, {"ok": False, "fallback": True, "error": str(e)})
        self._json(404, {"error": "not found"})

    def _serve_static(self):
        rel = self.path.split("?", 1)[0]
        routes = {
            "/": "/admin.html", "/admin": "/admin.html",
            "/datacenter": "/datacenter.html",
            "/twin": "/twinpro.html",
            "/factory": "/factory.html",
            "/build": "/builder.html", "/studio": "/builder.html",
            "/ingest": "/ingest.html",
            "/scan": "/scan.html",
            "/ar": "/ar.html", "/ar/": "/ar.html",
            "/vr": "/vr.html", "/vr/": "/vr.html", "/walk": "/vr.html",
        }
        if rel in routes:
            rel = routes[rel]
        path = (PUBLIC / rel.lstrip("/")).resolve()
        if not str(path).startswith(str(PUBLIC.resolve())) or not path.is_file():
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"not found")
            return
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("content-type", MIME.get(path.suffix, "application/octet-stream"))
        self.send_header("content-length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def ensure_cert():
    """Generate a self-signed cert (with the LAN IPs in SAN) so phone browsers
    will allow the camera. Needs the `openssl` CLI. Returns (cert, key) or None."""
    cdir = Path(__file__).parent
    cert, key = cdir / ".tejas-cert.pem", cdir / ".tejas-key.pem"
    if cert.exists() and key.exists():
        return (str(cert), str(key))
    san = "subjectAltName=DNS:localhost,IP:127.0.0.1" + "".join(f",IP:{ip}" for ip in lan_ips())
    try:
        subprocess.run(
            ["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
             "-keyout", str(key), "-out", str(cert), "-days", "365",
             "-subj", "/CN=Tejas AI", "-addext", san],
            check=True, capture_output=True, timeout=30)
        return (str(cert), str(key))
    except Exception as e:
        print("  ⚠ HTTPS cert generation failed (%s). Serving HTTP — phone camera will use the simulated view." % e)
        return None


def main():
    brain = f"OpenAI ({OPENAI_MODEL})" if OPENAI_KEY else f"Ollama ({OLLAMA_MODEL}) or local fallback"
    httpd = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)

    scheme = "http"
    if os.environ.get("TEJAS_HTTP") not in ("1", "true"):
        cert = ensure_cert()
        if cert:
            ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            ctx.load_cert_chain(cert[0], cert[1])
            httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
            scheme = "https"

    print("\n  ⚡ Tejas AI · Digital Twin Platform")
    print("  🖥  on this machine:  %s://localhost:%d" % (scheme, PORT))
    for ip in lan_ips():
        print("  📱 on your phone:    %s://%s:%d   (same Wi-Fi)" % (scheme, ip, PORT))
    print("  🧠 AI brain: %s" % brain)
    if scheme == "https":
        print("  🔒 HTTPS on (self-signed) — the live camera works on phones.")
        print("     First visit shows a certificate warning → tap Advanced → Proceed. (set TEJAS_HTTP=1 for plain http)")
    if not OPENAI_KEY:
        print("  (set OPENAI_API_KEY to use OpenAI; otherwise it tries local Ollama, then a built-in parser.)")
    print("")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
