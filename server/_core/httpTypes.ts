export type HeaderValue = string | string[] | undefined;

export type SessionRequest = {
  headers: Record<string, HeaderValue>;
  protocol?: string;
  ip?: string;
  socket?: { remoteAddress?: string };
};

export type SessionCookieOptions = {
  domain?: string;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
};

export type SessionResponse = {
  clearCookie(name: string, options?: SessionCookieOptions): SessionResponse;
};

export type ContextOptions = {
  req: SessionRequest;
  res: SessionResponse;
};
