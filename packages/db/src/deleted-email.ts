/**
 * Users are soft-deleted (`deletedAt` is set, the row stays) so their
 * applications, audit logs and reports keep pointing at a real record. But
 * `User.email` is `@unique`, so a soft-deleted row kept its address reserved
 * forever: recreating a user with the same email failed with "already in use",
 * and so did self-registration and changing another account's email to it.
 *
 * Deleting therefore rewrites the address to a tombstone. The account keeps
 * its history, the original address is still readable for audit purposes, and
 * the real address is free to use again. Tombstoned values never match a
 * login lookup — those filter on `deletedAt: null` anyway.
 */

export const DELETED_EMAIL_PREFIX = "deleted.";

/**
 * `someone@example.com` → `deleted.1754160000000.someone@example.com`
 *
 * The timestamp keeps it unique when the same address is created and deleted
 * more than once. Already-tombstoned values are returned unchanged, so this is
 * safe to apply twice.
 */
export function tombstoneEmail(email: string, now: Date = new Date()): string {
  if (email.startsWith(DELETED_EMAIL_PREFIX)) return email;
  return `${DELETED_EMAIL_PREFIX}${now.getTime()}.${email}`;
}

/** Recovers the original address from a tombstone, for display in audit views. */
export function originalEmail(email: string): string {
  if (!email.startsWith(DELETED_EMAIL_PREFIX)) return email;
  const withoutPrefix = email.slice(DELETED_EMAIL_PREFIX.length);
  const dot = withoutPrefix.indexOf(".");
  return dot === -1 ? withoutPrefix : withoutPrefix.slice(dot + 1);
}
