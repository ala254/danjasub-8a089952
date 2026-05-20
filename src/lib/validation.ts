// Shared input validation helpers for Danjasub auth flows.

export const isValidEmail = (e: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/**
 * Nigerian mobile number validation.
 * Accepts: 11-digit local format starting with 070/080/081/090/091
 *          (e.g. 08012345678) — also normalises +234 / 234 prefixes.
 */
export const normalizeNgPhone = (raw: string): string => {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('234')) p = '0' + p.slice(3);
  return p;
};

export const isValidNgPhone = (raw: string): boolean => {
  const p = normalizeNgPhone(raw);
  return /^0(70|80|81|90|91)\d{8}$/.test(p);
};

export const isValidFullName = (n: string) =>
  n.trim().length >= 3 && /\s/.test(n.trim());
