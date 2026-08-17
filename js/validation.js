/* ==========================================================================
   validation.js
   A small, dependency-free validation engine.

   Design: each field is described by a config object { pattern, message,
   test } and validated on both 'input' (as the student types) and 'blur'
   (when they leave the field) — this satisfies the "real-time state
   toggling" requirement without being noisy on the very first keystroke
   (we only show an error on blur the first time, then live-update after).
   ========================================================================== */

// ---------------------------------------------------------------------------
// REGEX LIBRARY
// ---------------------------------------------------------------------------
const REGEX = {
  // Full name: letters (incl. accented), spaces, hyphens, apostrophes only —
  // explicitly excludes digits and most special characters as required.
  fullName: /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/,

  // Institutional student email OR a standard email address.
  // e.g. john.doe@bse.ac.mu  OR  jane@example.com
  studentEmail: /^[a-z]{1}\.[a-zA-Z0-9]+@alustudent\.com$/,

  // Student ID: 10 digits, e.g. 1276830987
  studentId: /^\d{10}$/,

  // Mauritius-style or generic international phone number:
  // optional +country code, then 7-15 digits, spaces/dashes allowed.
  phone:/^\+(?=(?:[ -]?\d){7,15}$)(\d{1,4}[ -]?)+$/
,

  // Generic short text (subject line): letters, numbers, basic punctuation.
  subject: /^[\w .,'!?()-]{3,80}$/,
};

// ---------------------------------------------------------------------------
// CORE ENGINE
// ---------------------------------------------------------------------------

/**
 * Wires up a single field for real-time inline validation.
 * @param {HTMLElement} inputEl   the <input>/<textarea> element
 * @param {HTMLElement} errorEl   the element that receives the message text
 * @param {(value:string) => {valid:boolean, message:string}} validator
 */
function wireField(inputEl, errorEl, validator) {
  const fieldEl = inputEl.closest('.field');
  let touched = false;

  function run() {
    const { valid, message } = validator(inputEl.value.trim());
    fieldEl.classList.toggle('is-valid', valid);
    fieldEl.classList.toggle('is-invalid', !valid);
    errorEl.textContent = message;
    inputEl.setAttribute('aria-invalid', String(!valid));
    return valid;
  }

  // First feedback appears on blur (don't scold the user before they've
  // finished typing), then re-validates live on every keystroke after that.
  inputEl.addEventListener('blur', () => { touched = true; run(); });
  inputEl.addEventListener('input', () => { if (touched) run(); });

  return run; // expose so the parent <form> can force-validate on submit
}

/** Builds a validator function from a regex + messages. */
function regexValidator(regex, { empty, invalid }) {
  return (value) => {
    if (!value) return { valid: false, message: empty };
    if (!regex.test(value)) return { valid: false, message: invalid };
    return { valid: true, message: 'Looks good' };
  };
}

/** Validator for free-text messages with a minimum length. */
function minLengthValidator(min, { empty, invalid }) {
  return (value) => {
    if (!value) return { valid: false, message: empty };
    if (value.length < min) return { valid: false, message: invalid };
    return { valid: true, message: 'Looks good' };
  };
}

// Exposed globally (no bundler / module system per the "no frameworks" brief)
window.ValidationEngine = { REGEX, wireField, regexValidator, minLengthValidator };
