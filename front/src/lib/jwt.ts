
// DecodeToken => Decodifica el token del navegador


// JWT tiene tres partes separadas : header.payload.signature . Solo queremos payload.


import type { Role } from "../types/user";

export interface JwtPayload {
  sub: number;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;

    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 <= Date.now();
}