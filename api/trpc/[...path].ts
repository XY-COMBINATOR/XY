import vercelTrpcHandler from "../../server/vercelTrpc.js";

/** Forward every nested tRPC procedure through the native Node tRPC handler. */
export default vercelTrpcHandler;
