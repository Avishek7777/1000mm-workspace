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
    images: project.images.map((src) =>
      src.startsWith("/api/uploads/") ? `${PORTAL_URL}${src}` : src,
    ),
  };
}
