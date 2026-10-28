/** Build an API URL from NEXT_PUBLIC_API_BASE_URL without duplicating /api/v1. */
export function apiUrl(path: string): string {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!configured) throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");

  let base: URL;
  try {
    base = new URL(configured);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL.");
  }
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP(S) URL without credentials, query, or fragment.");
  }
  if (process.env.NODE_ENV === "production" && (base.protocol !== "https:" || /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])$/i.test(base.hostname))) {
    throw new Error("Production API configuration must use a public HTTPS origin.");
  }

  const prefix = "/api/v1";
  const pathname = base.pathname.replace(/\/+$/, "");
  if (pathname && pathname !== prefix) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an API origin or end exactly in /api/v1.");
  }
  base.pathname = prefix;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const endpoint = normalizedPath === prefix ? "" : normalizedPath.startsWith(`${prefix}/`) ? normalizedPath.slice(prefix.length) : normalizedPath;
  return `${base.origin}${prefix}${endpoint}`;
}
