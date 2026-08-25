import vercelTrpcHandler from "../server/vercelTrpc.js";

/** Vercel filesystem fallback for API paths not matched by a more specific entry. */
export default vercelTrpcHandler;
