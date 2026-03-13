import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AmazonAppstoreClient } from '../client.js';
import { formatError } from '../errors.js';

interface Edit {
  id: string;
  status: string;
}

export function registerEditTools(server: McpServer, client: AmazonAppstoreClient) {
  server.tool(
    'create_edit',
    'Create a new edit (draft release) for an app. Only one edit can be active at a time.',
    {
      appId: z.string().describe('Amazon app ID'),
    },
    async ({ appId }) => {
      try {
        const { data } = await client.request<Edit>(
          `/applications/${appId}/edits`,
          { method: 'POST', body: {} }
        );
        return { content: [{ type: 'text' as const, text: `Edit created.\n${JSON.stringify(data, null, 2)}` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'get_edit',
    'Get the current active edit for an app',
    {
      appId: z.string().describe('Amazon app ID'),
    },
    async ({ appId }) => {
      try {
        const { data, etag } = await client.request<Edit>(
          `/applications/${appId}/edits`
        );
        return {
          content: [{
            type: 'text' as const,
            text: `Current edit:\n${JSON.stringify(data, null, 2)}\nETag: ${etag ?? 'none'}`,
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'delete_edit',
    'Delete a draft edit (use if an orphaned edit is blocking a new one)',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID to delete'),
    },
    async ({ appId, editId }) => {
      try {
        await client.request(
          `/applications/${appId}/edits/${editId}`,
          { method: 'DELETE' }
        );
        return { content: [{ type: 'text' as const, text: `Edit ${editId} deleted.` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'validate_edit',
    'Validate an edit before committing (checks for missing required fields)',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID to validate'),
    },
    async ({ appId, editId }) => {
      try {
        const { data } = await client.request<unknown>(
          `/applications/${appId}/edits/${editId}/validate`,
          { method: 'POST' }
        );
        return { content: [{ type: 'text' as const, text: `Validation result:\n${JSON.stringify(data, null, 2)}` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'commit_edit',
    'Commit an edit to submit the app update for review',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID to commit'),
    },
    async ({ appId, editId }) => {
      try {
        const { data } = await client.request<unknown>(
          `/applications/${appId}/edits/${editId}/commit`,
          { method: 'POST' }
        );
        return { content: [{ type: 'text' as const, text: `Edit committed (submitted for review).\n${JSON.stringify(data, null, 2)}` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
