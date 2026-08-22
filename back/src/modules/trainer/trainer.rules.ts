// Admins paste whatever they copied: a handle, an @handle, or the full profile
// URL with Instagram's tracking query. Only the handle is stored, so the card
// can build the link itself.
export const normalizeInstagramHandle = (raw: string): string =>
  raw
    .trim()
    .split('?')[0]
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '');

// Returns the value untouched when it is not an array, so @IsArray reports the
// real problem instead of this helper hiding it behind an empty list.
export const normalizeCertifications = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    return value;
  }
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};
