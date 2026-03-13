import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AmazonAppstoreClient } from '../client.js';
import { formatError } from '../errors.js';

interface Listing {
  language: string;
  title: string;
  fullDescription: string;
  shortDescription: string;
  recentChanges?: string;
  keywords?: string[];
}

interface AppDetails {
  defaultLanguage: string;
  contactEmail?: string;
  contactPhone?: string;
  contactWebsite?: string;
}

export function registerListingTools(server: McpServer, client: AmazonAppstoreClient) {
  server.tool(
    'get_listings',
    'Get all localized listings for an app edit',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
    },
    async ({ appId, editId }) => {
      try {
        const { data } = await client.request<Listing[]>(
          `/applications/${appId}/edits/${editId}/listings`
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'update_listing',
    'Update the store listing for a specific language',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      language: z.string().describe('Language code (e.g. "en-US")'),
      title: z.string().optional().describe('App title'),
      fullDescription: z.string().optional().describe('Full description'),
      shortDescription: z.string().optional().describe('Short description'),
      recentChanges: z.string().optional().describe('What\'s new text'),
    },
    async ({ appId, editId, language, title, fullDescription, shortDescription, recentChanges }) => {
      try {
        // Get current listing and its ETag
        const { data: current, etag } = await client.request<Listing>(
          `/applications/${appId}/edits/${editId}/listings/${language}`
        );

        // Merge updates
        const updated = {
          ...current,
          ...(title !== undefined && { title }),
          ...(fullDescription !== undefined && { fullDescription }),
          ...(shortDescription !== undefined && { shortDescription }),
          ...(recentChanges !== undefined && { recentChanges }),
        };

        const { data } = await client.request<Listing>(
          `/applications/${appId}/edits/${editId}/listings/${language}`,
          { method: 'PUT', body: updated, etag }
        );

        return { content: [{ type: 'text' as const, text: `Listing updated.\n${JSON.stringify(data, null, 2)}` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'delete_listing',
    'Delete a localized listing for a specific language. Cannot delete the default language listing.',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      language: z.string().describe('Language code to delete (e.g. "fr-FR")'),
    },
    async ({ appId, editId, language }) => {
      try {
        // Get ETag first
        const { etag } = await client.request<Listing>(
          `/applications/${appId}/edits/${editId}/listings/${language}`
        );

        await client.request(
          `/applications/${appId}/edits/${editId}/listings/${language}`,
          { method: 'DELETE', etag }
        );
        return { content: [{ type: 'text' as const, text: `Listing for ${language} deleted.` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'get_app_details',
    'Get app details (contact info, default language)',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
    },
    async ({ appId, editId }) => {
      try {
        const { data } = await client.request<AppDetails>(
          `/applications/${appId}/edits/${editId}/details`
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'update_app_details',
    'Update app details (contact info)',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      contactEmail: z.string().optional().describe('Contact email'),
      contactPhone: z.string().optional().describe('Contact phone'),
      contactWebsite: z.string().optional().describe('Contact website'),
    },
    async ({ appId, editId, contactEmail, contactPhone, contactWebsite }) => {
      try {
        const { data: current, etag } = await client.request<AppDetails>(
          `/applications/${appId}/edits/${editId}/details`
        );

        const updated = {
          ...current,
          ...(contactEmail !== undefined && { contactEmail }),
          ...(contactPhone !== undefined && { contactPhone }),
          ...(contactWebsite !== undefined && { contactWebsite }),
        };

        const { data } = await client.request<AppDetails>(
          `/applications/${appId}/edits/${editId}/details`,
          { method: 'PUT', body: updated, etag }
        );

        return { content: [{ type: 'text' as const, text: `Details updated.\n${JSON.stringify(data, null, 2)}` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
