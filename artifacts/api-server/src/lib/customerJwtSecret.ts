import crypto from "node:crypto";

// Production must always provide an operator-managed customer JWT secret.
// Development workflows may not have access to the private secret store, so
// use one process-consistent ephemeral value there instead of preventing the
// API from booting. Restarting a development process intentionally invalidates
// its customer tokens.
const developmentSecret =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

export const customerJwtSecret =
  process.env.JWT_SECRET ??
  (process.env.NODE_ENV === "development" ? developmentSecret : "");

if (!customerJwtSecret) {
  throw new Error(
    "JWT_SECRET environment variable is required. Auth cannot start without a configured secret.",
  );
}