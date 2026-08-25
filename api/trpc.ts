import vercelTrpcHandler from "../server/vercelTrpc.js";

/** Keep the exact tRPC root path available to Vercel’s filesystem router. */
export default vercelTrpcHandler;
