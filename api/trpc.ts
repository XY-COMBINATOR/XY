import { vercelApiApp } from "../server/vercelApp";
import type { Request, Response } from "express";

/** Keep the exact tRPC root path available to Vercel’s filesystem router. */
export default function handler(request: Request, response: Response) {
  return vercelApiApp(request, response);
}
