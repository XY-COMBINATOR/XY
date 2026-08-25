import { vercelApiApp } from "../../server/vercelApp";
import type { Request, Response } from "express";

/** Forward every nested tRPC procedure through the shared secure API app. */
export default function handler(request: Request, response: Response) {
  return vercelApiApp(request, response);
}
