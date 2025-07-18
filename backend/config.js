import { Scopes } from "@aps_sdk/authentication";
import dotenv from "dotenv";

dotenv.config();

let {
  APS_CLIENT_ID,
  APS_CLIENT_SECRET,
  APS_CALLBACK_URL,
  SERVER_SESSION_SECRET,
  PORT,
  APS_BUCKET,
} = process.env;
if (
  !APS_CLIENT_ID ||
  !APS_CLIENT_SECRET ||
  !APS_CALLBACK_URL ||
  !SERVER_SESSION_SECRET
) {
  console.warn("Missing some of the environment variables.");
  process.exit(1);
}
const INTERNAL_TOKEN_SCOPES = [
  Scopes.DataRead,
  Scopes.DataCreate,
  Scopes.BucketCreate,
  Scopes.BucketRead,
  Scopes.BucketDelete,
  Scopes.ViewablesRead,
];
const PUBLIC_TOKEN_SCOPES = [Scopes.ViewablesRead];
PORT = PORT || 8080;
APS_BUCKET = APS_BUCKET || "aps-simple-viewer-bucket";

export {
  APS_CLIENT_ID,
  APS_CLIENT_SECRET,
  APS_CALLBACK_URL,
  SERVER_SESSION_SECRET,
  INTERNAL_TOKEN_SCOPES,
  PUBLIC_TOKEN_SCOPES,
  PORT,
  APS_BUCKET,
};
