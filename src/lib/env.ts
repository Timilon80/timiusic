const isProduction = process.env.NODE_ENV === "production";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function parseBoolean(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  switch (value.toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "off":
      return false;
    default:
      return undefined;
  }
}

export function getSessionSecret() {
  const secret = readEnv("APP_SECRET");

  if (secret) {
    return secret;
  }

  if (isProduction) {
    throw new Error("APP_SECRET is required in production.");
  }

  return "timiusic-dev-secret";
}

export function getAdminSeedPassword() {
  const password = readEnv("ADMIN_DEFAULT_PASSWORD");

  if (password) {
    return password;
  }

  if (isProduction) {
    throw new Error("ADMIN_DEFAULT_PASSWORD is required in production.");
  }

  return "admin123";
}

export function isPublicRegistrationEnabled() {
  const value = parseBoolean(readEnv("ALLOW_PUBLIC_REGISTRATION"));
  return value ?? !isProduction;
}
