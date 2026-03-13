import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AmazonAppstoreClient } from '../client.js';
import { formatError } from '../errors.js';

interface VideoResource {
  id: string;
  videoType?: string;
  url?: string;
}

export function registerVideoTools(server: McpServer, client: AmazonAppstoreClient) {
  server.tool(
    'list_videos',
    'List all videos for an app listing in a given language',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      language: z.string().optional().describe('Language code (default: "en-US")'),
    },
    async ({ appId, editId, language }) => {
      try {
        const lang = language ?? 'en-US';
        const { data } = await client.request<VideoResource[]>(
          `/applications/${appId}/edits/${editId}/listings/${lang}/videos`
        );
        return { content: [{ type: 'text' as const, text: `Videos for ${lang}:\n${JSON.stringify(data, null, 2)}` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'upload_video',
    'Upload a video to an Amazon Appstore listing',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      filePath: z.string().describe('Absolute path to the video file (MP4)'),
      language: z.string().optional().describe('Language code (default: "en-US")'),
    },
    async ({ appId, editId, filePath, language }) => {
      try {
        const { existsSync, readFileSync } = await import('node:fs');
        const { extname } = await import('node:path');

        if (!existsSync(filePath)) {
          return formatError(new Error(`Video file not found: ${filePath}`));
        }

        const lang = language ?? 'en-US';

        const ext = extname(filePath).toLowerCase();
        let contentType: string;
        if (ext === '.mp4') {
          contentType = 'video/mp4';
        } else if (ext === '.webm') {
          contentType = 'video/webm';
        } else {
          return formatError(new Error(`Unsupported video format "${ext}". Use MP4 or WebM.`));
        }

        const fileBuffer = Buffer.from(readFileSync(filePath));
        const { data } = await client.request<VideoResource>(
          `/applications/${appId}/edits/${editId}/listings/${lang}/videos`,
          {
            method: 'POST',
            rawBody: fileBuffer,
            contentType,
          }
        );

        return {
          content: [{
            type: 'text' as const,
            text: `Video uploaded successfully!\n${JSON.stringify(data, null, 2)}`,
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'delete_video',
    'Delete a specific video from an app listing',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      assetId: z.string().describe('Video asset ID to delete'),
      language: z.string().optional().describe('Language code (default: "en-US")'),
    },
    async ({ appId, editId, assetId, language }) => {
      try {
        const lang = language ?? 'en-US';

        // Get ETag first
        const { etag } = await client.request<VideoResource[]>(
          `/applications/${appId}/edits/${editId}/listings/${lang}/videos`
        );

        await client.request(
          `/applications/${appId}/edits/${editId}/listings/${lang}/videos/${assetId}`,
          { method: 'DELETE', etag }
        );

        return { content: [{ type: 'text' as const, text: `Video ${assetId} deleted.` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'delete_all_videos',
    'Delete all videos for a given language from an app listing',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      language: z.string().optional().describe('Language code (default: "en-US")'),
    },
    async ({ appId, editId, language }) => {
      try {
        const lang = language ?? 'en-US';
        await client.request(
          `/applications/${appId}/edits/${editId}/listings/${lang}/videos`,
          { method: 'DELETE' }
        );
        return { content: [{ type: 'text' as const, text: `All videos deleted for ${lang}.` }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
