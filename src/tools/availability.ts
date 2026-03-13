import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AmazonAppstoreClient } from '../client.js';
import { formatError } from '../errors.js';

interface Availability {
  publishingDate?: string;
  countries?: string[];
}

export function registerAvailabilityTools(server: McpServer, client: AmazonAppstoreClient) {
  server.tool(
    'get_availability',
    'Get availability and scheduling info for an app edit',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
    },
    async ({ appId, editId }) => {
      try {
        const { data } = await client.request<Availability>(
          `/applications/${appId}/edits/${editId}/availability`
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'set_availability',
    'Set publishing date and availability for an app edit',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      publishingDate: z.string().optional().describe('Scheduled publishing date (ISO 8601, e.g. "2026-04-01T00:00:00Z")'),
    },
    async ({ appId, editId, publishingDate }) => {
      try {
        const { data: current, etag } = await client.request<Availability>(
          `/applications/${appId}/edits/${editId}/availability`
        );

        const updated = {
          ...current,
          ...(publishingDate !== undefined && { publishingDate }),
        };

        const { data } = await client.request<Availability>(
          `/applications/${appId}/edits/${editId}/availability`,
          { method: 'PUT', body: updated, etag }
        );

        return { content: [{ type: 'text' as const, text: `Availability updated.\n${JSON.stringify(data, null, 2)}` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
