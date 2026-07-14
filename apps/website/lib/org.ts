/** The year 1000 Missionary Movement Bangladesh was founded. */
export const FOUNDING_YEAR = 1997;

/** Current calendar year. */
export function currentYear(): number {
  return new Date().getFullYear();
}

/** Years the movement has been active, e.g. 2026 - 1997 = 29. */
export function yearsActive(): number {
  return currentYear() - FOUNDING_YEAR;
}
