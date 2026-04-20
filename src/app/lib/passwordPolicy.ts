/** Must match server Identity password options in Program.cs */
export const PASSWORD_MIN_LENGTH = 6;

/** Shown in change-password UI */
export const PASSWORD_REQUIREMENTS_SUMMARY =
  `At least ${PASSWORD_MIN_LENGTH} characters, with at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. ! @ # $).`;

/** One line for compact forms (create user, etc.) */
export const PASSWORD_HINT_SHORT = `Min ${PASSWORD_MIN_LENGTH} chars — upper & lower case, number, special character.`;

/**
 * Returns validation issues for a new password (same rules as the API).
 */
export function getNewPasswordValidationErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`);
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number (0–9).');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter (a–z).');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A–Z).');
  }
  // Align with ASP.NET Identity: at least one character that is not a Unicode letter or digit
  if (!/[^\p{L}\p{N}]/u.test(password)) {
    errors.push('Password must contain at least one special character (for example !, @, #, or $).');
  }
  return errors;
}
