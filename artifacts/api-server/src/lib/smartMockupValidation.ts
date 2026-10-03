/**
 * Pure Smart Mockup validation gate.
 *
 * Keep this independent of the API route and database imports so it can be
 * tested in CI without configuring a database connection.
 */
export function validationPassed(validation: Record<string, unknown>): boolean {
  return Object.entries(validation).every(([key, value]) => {
    if (key === "rendererAvailable") {
      return Boolean(
        value
        && typeof value === "object"
        && "available" in value
        && (value as { available?: unknown }).available === true,
      );
    }
    return Boolean(
      value
      && typeof value === "object"
      && "pass" in value
      && (value as { pass?: unknown }).pass === true,
    );
  });
}