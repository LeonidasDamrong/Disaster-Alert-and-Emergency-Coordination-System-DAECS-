import { getNewPasswordValidationErrors } from './passwordPolicy';

/** Basic email pattern — not exhaustive but blocks obvious mistakes. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type AdminUserFieldKey = 'name' | 'email' | 'phone' | 'password';

export type AdminUserFieldErrors = Partial<Record<Exclude<AdminUserFieldKey, 'password'>, string>> & {
  password?: string;
  passwordList?: string[];
};

export function validateAdminUserName(name: string): string[] {
  const t = name.trim();
  if (!t) return ['Full name is required.'];
  if (t.length < 2) return ['Full name must be at least 2 characters.'];
  if (t.length > 120) return ['Full name must be at most 120 characters.'];
  if (!/^[\p{L}\p{M}0-9\s'.-]+$/u.test(t)) {
    return ['Use letters, numbers, spaces, and common punctuation only (e.g. hyphen, apostrophe).'];
  }
  return [];
}

export function validateAdminEmail(email: string): string[] {
  const t = email.trim();
  if (!t) return ['Email is required.'];
  if (t.length > 254) return ['Email is too long.'];
  if (!EMAIL_RE.test(t)) {
    return ['Enter a valid email address (e.g. name@organization.gov.my).'];
  }
  return [];
}

/** Malaysia: +60 followed by subscriber digits (mobile / landline range). */
export function validateAdminPhoneMY(phone: string): string[] {
  const t = phone.trim();
  if (!t) return ['Phone is required.'];
  if (!t.startsWith('+60')) {
    return ['Phone must start with +60 (Malaysia country code).'];
  }
  const rest = t.slice(3);
  if (!/^\d+$/.test(rest)) {
    return ['After +60, use digits only (no spaces or dashes).'];
  }
  if (rest.length < 8 || rest.length > 11) {
    return ['Enter +60 followed by 8–11 digits (e.g. +60123456789).'];
  }
  return [];
}

export function validateCreateUserInput(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): AdminUserFieldErrors {
  const out: AdminUserFieldErrors = {};

  const nameErrs = validateAdminUserName(input.name);
  if (nameErrs.length) out.name = nameErrs[0];

  const emailErrs = validateAdminEmail(input.email);
  if (emailErrs.length) out.email = emailErrs[0];

  const phoneErrs = validateAdminPhoneMY(input.phone);
  if (phoneErrs.length) out.phone = phoneErrs[0];

  if (!input.password) {
    out.password = 'Password is required.';
  } else {
    const pwErrs = getNewPasswordValidationErrors(input.password);
    if (pwErrs.length) {
      out.passwordList = pwErrs;
      out.password = pwErrs[0];
    }
  }

  return out;
}

export function validateEditUserInput(input: {
  name: string;
  email: string;
  phone: string;
}): AdminUserFieldErrors {
  const out: AdminUserFieldErrors = {};

  const nameErrs = validateAdminUserName(input.name);
  if (nameErrs.length) out.name = nameErrs[0];

  const emailErrs = validateAdminEmail(input.email);
  if (emailErrs.length) out.email = emailErrs[0];

  const phoneErrs = validateAdminPhoneMY(input.phone);
  if (phoneErrs.length) out.phone = phoneErrs[0];

  return out;
}

export function hasAdminUserFieldErrors(errors: AdminUserFieldErrors): boolean {
  return Boolean(errors.name || errors.email || errors.phone || errors.password);
}
