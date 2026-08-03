// Shared helpers for consuming the portal's public API.

export const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3001";

/**
 * Images uploaded through the portal admin are stored as portal-relative
 * "/api/uploads/…" paths. The website runs on a different origin, so those
 * paths must be made absolute against the portal URL before rendering.
 * Static website assets ("/images/…") pass through unchanged.
 */
export function resolveProjectImages<T extends { images: string[] }>(
  project: T,
): T {
  return {
    ...project,
    images: project.images.map(resolvePortalImage),
  };
}

/** Single-URL form of the above, for records with one optional image. */
export function resolvePortalImage(src: string): string;
export function resolvePortalImage(src: string | null | undefined): string | null;
export function resolvePortalImage(src: string | null | undefined): string | null {
  if (!src) return null;
  return src.startsWith("/api/uploads/") ? `${PORTAL_URL}${src}` : src;
}
