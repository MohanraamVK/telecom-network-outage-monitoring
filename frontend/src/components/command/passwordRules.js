export const MIN_PASSWORD_LENGTH = 10;
const MIN_LENGTH = MIN_PASSWORD_LENGTH;

export function validatePasswordChange({ current, next, confirm }) {
  const errors = {};
  if (!current) errors.current = "Enter your current password.";
  if (next.length < MIN_LENGTH) errors.next = `Use at least ${MIN_LENGTH} characters.`;
  else if (next.length > 100) errors.next = "Use 100 characters or fewer.";
  else if (next === current) errors.next = "Choose a password different from the current one.";
  if (!errors.next && confirm !== next) errors.confirm = "The passwords don't match.";
  return errors;
}
