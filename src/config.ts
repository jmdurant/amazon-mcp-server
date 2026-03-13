export interface Config {
  clientId: string;
  clientSecret: string;
}

export function loadConfig(): Config {
  const clientId = process.env.AMAZON_CLIENT_ID;
  const clientSecret = process.env.AMAZON_CLIENT_SECRET;

  if (!clientId) throw new Error('AMAZON_CLIENT_ID environment variable is required');
  if (!clientSecret) throw new Error('AMAZON_CLIENT_SECRET environment variable is required');

  return { clientId, clientSecret };
}
