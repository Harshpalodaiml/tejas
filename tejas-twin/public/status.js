// Tejas AI — single source of truth for component lifecycle status + colour.
// Imported by every scene + the UI so the red→blue story never drifts.

export const STATUS = {
  HEALTHY:   'healthy',
  WARN:      'warn',
  FAULT:     'fault',
  FIXING:    'fixing',
  CORRECTED: 'corrected',
  SELECTED:  'selected',
};

export const STATUS_COLOR = {
  healthy:   '#2ee6a6',  // green  — nominal
  warn:      '#ffd34d',  // amber  — drifting
  fault:     '#ff3344',  // red    — needs correction
  fixing:    '#ff7a33',  // orange — being corrected
  corrected: '#19c6ff',  // BLUE   — fixed by the operator  ← the red→blue transition
  selected:  '#ffffff',  // white  — ring while picked
};

export function statusColor(s) { return STATUS_COLOR[s] || STATUS_COLOR.healthy; }

// Human label for badges / context menus.
export const STATUS_LABEL = {
  healthy:   'Healthy',
  warn:      'Drifting',
  fault:     'Fault',
  fixing:    'Correcting…',
  corrected: 'Corrected',
};
export function statusLabel(s) { return STATUS_LABEL[s] || 'Healthy'; }

// True when an explicit lifecycle status should OVERRIDE the live-temperature tint.
export function overridesTemp(s) {
  return s === STATUS.FAULT || s === STATUS.FIXING || s === STATUS.CORRECTED;
}
