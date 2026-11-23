/** Derive the Socket.IO HTTP(S) origin from NEXT_PUBLIC_API_BASE_URL (no secrets). */
export function socketOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!configured) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  let base: URL;
  try {
    base = new URL(configured);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL.");
  }
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL without credentials.");
  }
  if (process.env.NODE_ENV === "production" && (base.protocol !== "https:" || /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i.test(base.hostname))) {
    throw new Error("Production socket configuration must use a public HTTPS API origin.");
  }
  return base.origin;
}
