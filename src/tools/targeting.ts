import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AmazonAppstoreClient } from '../client.js';
import { formatError } from '../errors.js';

interface ApkTargeting {
  [key: string]: unknown;
}

export function registerTargetingTools(server: McpServer, client: AmazonAppstoreClient) {
  server.tool(
    'get_apk_targeting',
    'Get device targeting details for a specific APK (supported devices, screen sizes, etc.)',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      apkId: z.string().describe('APK ID'),
    },
    async ({ appId, editId, apkId }) => {
      try {
        const { data, etag } = await client.request<ApkTargeting>(
          `/applications/${appId}/edits/${editId}/apks/${apkId}/targeting`
        );
        return {
          content: [{
            type: 'text' as const,
            text: `APK targeting:\n${JSON.stringify(data, null, 2)}\nETag: ${etag ?? 'none'}`,
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'update_apk_targeting',
    'Update device targeting for a specific APK. Fetch current targeting first to get the ETag.',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      apkId: z.string().describe('APK ID'),
      targeting: z.record(z.unknown()).describe('Targeting configuration object (get current values first with get_apk_targeting)'),
    },
    async ({ appId, editId, apkId, targeting }) => {
      try {
        // Get current ETag
        const { etag } = await client.request<ApkTargeting>(
          `/applications/${appId}/edits/${editId}/apks/${apkId}/targeting`
        );

        const { data } = await client.request<ApkTargeting>(
          `/applications/${appId}/edits/${editId}/apks/${apkId}/targeting`,
          { method: 'PUT', body: targeting, etag }
        );

        return {
          content: [{
            type: 'text' as const,
            text: `APK targeting updated.\n${JSON.stringify(data, null, 2)}`,
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
