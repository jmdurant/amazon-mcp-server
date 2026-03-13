export interface Config {
  clientId: string;
  clientSecret: string;
}

const REQUIRED_ENV_VARS: { key: string; label: string }[] = [
  { key: 'AMAZON_CLIENT_ID', label: 'Amazon Client ID' },
  { key: 'AMAZON_CLIENT_SECRET', label: 'Amazon Client Secret' },
];

export interface ConfigError {
  key: string;
  label: string;
}

export function getConfigErrors(): ConfigError[] {
  return REQUIRED_ENV_VARS.filter(({ key }) => !process.env[key]);
}

export function loadConfig(): Config | null {
  const errors = getConfigErrors();
  if (errors.length > 0) {
    return null;
  }

  return {
    clientId: process.env.AMAZON_CLIENT_ID!,
    clientSecret: process.env.AMAZON_CLIENT_SECRET!,
  };
}
