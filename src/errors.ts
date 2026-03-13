export class AmazonAppstoreError extends Error {
  constructor(
    public status: number,
    public code: string,
    public detail: string
  ) {
    super(`${code}: ${detail}`);
    this.name = 'AmazonAppstoreError';
  }
}

export function formatError(error: unknown): { content: Array<{ type: 'text'; text: string }>; isError: true } {
  if (error instanceof AmazonAppstoreError) {
    return {
      content: [{ type: 'text', text: `Amazon Appstore API Error (${error.status}): ${error.code}\n${error.detail}` }],
      isError: true
    };
  }
  return {
    content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
    isError: true
  };
}
