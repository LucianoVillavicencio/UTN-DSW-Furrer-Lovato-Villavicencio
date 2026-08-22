// The API is served under /api/v1 but uploaded files come from the server root,
// so the origin has to be recovered from the same variable. This is the only
// place that knows about that split.
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const mediaOrigin = (apiBaseUrl: string): string =>
  apiBaseUrl.replace(/\/api\/v\d+\/?$/, '');

export const resolveMediaUrl = (path?: string | null): string | null => {
  if (!path) {
    return null;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${mediaOrigin(API_BASE_URL)}${suffix}`;
};
