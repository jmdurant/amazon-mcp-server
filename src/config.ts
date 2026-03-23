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

function isPlaceholder(value: string): boolean {
  return /^(YOUR_|your_|C:\/path\/|\/path\/)/i.test(value);
}

export function getConfigErrors(): ConfigError[] {
  return REQUIRED_ENV_VARS.filter(({ key }) => {
    const val = process.env[key];
    return !val || isPlaceholder(val);
  });
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
