import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AmazonAppstoreClient } from '../client.js';
import { formatError } from '../errors.js';

interface ImageResource {
  id: string;
  imageType?: string;
  height?: number;
  width?: number;
  url?: string;
}

const IMAGE_TYPE_ENUM = z.enum([
  'screenshots',
  'icon',
  'smallIcon',
  'firetv-icon',
  'firetv-screenshots',
  'firetv-featured-background',
]).describe('Image type (e.g. "screenshots", "icon", "smallIcon", "firetv-icon", "firetv-screenshots", "firetv-featured-background")');

export function registerImageTools(server: McpServer, client: AmazonAppstoreClient) {
  server.tool(
    'list_images',
    'List all images for an app listing by image type. Creates an edit automatically if editId is not provided.',
    {
      appId: z.string().describe('Amazon app ID'),
      imageType: IMAGE_TYPE_ENUM,
      editId: z.string().optional().describe('Edit ID (creates a new edit if not provided)'),
      language: z.string().optional().describe('Language code (default: "en-US")'),
    },
    async ({ appId, imageType, editId, language }) => {
      try {
        const lang = language ?? 'en-US';

        // Create edit if not provided
        let activeEditId = editId;
        if (!activeEditId) {
          const { data: edit } = await client.request<{ id: string }>(
            `/applications/${appId}/edits`,
            { method: 'POST', body: {} }
          );
          activeEditId = edit.id;
        }

        const { data } = await client.request<ImageResource[]>(
          `/applications/${appId}/edits/${activeEditId}/listings/${lang}/${imageType}`
        );

        return {
          content: [{
            type: 'text' as const,
            text: `${imageType} for ${lang} (edit: ${activeEditId}):\n${JSON.stringify(data, null, 2)}` +
              `\n\nEdit ${activeEditId} is still open — use commit_edit to submit or delete_edit to discard.`,
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'upload_image',
    'Upload a screenshot or image to an Amazon Appstore listing. Creates an edit automatically if editId is not provided.',
    {
      appId: z.string().describe('Amazon app ID'),
      imageType: IMAGE_TYPE_ENUM,
      filePath: z.string().describe('Absolute path to the image file (PNG or JPG)'),
      editId: z.string().optional().describe('Edit ID (creates a new edit if not provided)'),
      language: z.string().optional().describe('Language code (default: "en-US")'),
      autoCommit: z.boolean().optional().describe('Automatically validate and commit after upload (default: false)'),
    },
    async ({ appId, imageType, filePath, editId, language, autoCommit }) => {
      try {
        const { existsSync, readFileSync } = await import('node:fs');
        const { extname } = await import('node:path');

        if (!existsSync(filePath)) {
          return formatError(new Error(`Image file not found: ${filePath}`));
        }

        const lang = language ?? 'en-US';

        // Determine content type from extension
        const ext = extname(filePath).toLowerCase();
        let contentType: string;
        if (ext === '.png') {
          contentType = 'image/png';
        } else if (ext === '.jpg' || ext === '.jpeg') {
          contentType = 'image/jpeg';
        } else {
          return formatError(new Error(`Unsupported image format "${ext}". Use PNG or JPG.`));
        }

        // Create edit if not provided
        let activeEditId = editId;
        if (!activeEditId) {
          const { data: edit } = await client.request<{ id: string }>(
            `/applications/${appId}/edits`,
            { method: 'POST', body: {} }
          );
          activeEditId = edit.id;
        }

        // Get ETag for the upload
        const { etag } = await client.request<ImageResource[]>(
          `/applications/${appId}/edits/${activeEditId}/listings/${lang}/${imageType}`
        );

        // Upload image
        const fileBuffer = Buffer.from(readFileSync(filePath));
        const { data: image } = await client.request<ImageResource>(
          `/applications/${appId}/edits/${activeEditId}/listings/${lang}/${imageType}/upload`,
          {
            method: 'POST',
            rawBody: fileBuffer,
            contentType,
            etag,
          }
        );

        let commitResult = '';
        if (autoCommit) {
          await client.request(
            `/applications/${appId}/edits/${activeEditId}/validate`,
            { method: 'POST' }
          );
          const { data: commit } = await client.request<unknown>(
            `/applications/${appId}/edits/${activeEditId}/commit`,
            { method: 'POST' }
          );
          commitResult = `\nEdit validated and committed.\n${JSON.stringify(commit, null, 2)}`;
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Image uploaded successfully!\n` +
              `Edit ID: ${activeEditId}\n` +
              `Language: ${lang}\n` +
              `Type: ${imageType}\n` +
              `Image: ${JSON.stringify(image, null, 2)}` +
              commitResult +
              (autoCommit ? '' : `\n\nUse commit_edit to submit or make more changes first.`),
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'delete_image',
    'Delete a specific image from an Amazon Appstore listing. Creates an edit automatically if editId is not provided.',
    {
      appId: z.string().describe('Amazon app ID'),
      imageType: IMAGE_TYPE_ENUM,
      assetId: z.string().describe('Image asset ID to delete'),
      editId: z.string().optional().describe('Edit ID (creates a new edit if not provided)'),
      language: z.string().optional().describe('Language code (default: "en-US")'),
      autoCommit: z.boolean().optional().describe('Automatically validate and commit after deletion (default: false)'),
    },
    async ({ appId, imageType, assetId, editId, language, autoCommit }) => {
      try {
        const lang = language ?? 'en-US';

        // Create edit if not provided
        let activeEditId = editId;
        if (!activeEditId) {
          const { data: edit } = await client.request<{ id: string }>(
            `/applications/${appId}/edits`,
            { method: 'POST', body: {} }
          );
          activeEditId = edit.id;
        }

        // Get ETag
        const { etag } = await client.request<ImageResource[]>(
          `/applications/${appId}/edits/${activeEditId}/listings/${lang}/${imageType}`
        );

        await client.request(
          `/applications/${appId}/edits/${activeEditId}/listings/${lang}/${imageType}/${assetId}`,
          { method: 'DELETE', etag }
        );

        let commitResult = '';
        if (autoCommit) {
          await client.request(
            `/applications/${appId}/edits/${activeEditId}/validate`,
            { method: 'POST' }
          );
          const { data: commit } = await client.request<unknown>(
            `/applications/${appId}/edits/${activeEditId}/commit`,
            { method: 'POST' }
          );
          commitResult = `\nEdit validated and committed.\n${JSON.stringify(commit, null, 2)}`;
        }

        return {
          content: [{
            type: 'text' as const,
            text: `Image ${assetId} deleted.\n` +
              `Edit ID: ${activeEditId}\n` +
              `Language: ${lang}` +
              commitResult +
              (autoCommit ? '' : `\n\nUse commit_edit to submit or make more changes first.`),
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'delete_all_images',
    'Delete all images of a given type for a specific language. Creates an edit automatically if editId is not provided.',
    {
      appId: z.string().describe('Amazon app ID'),
      imageType: IMAGE_TYPE_ENUM,
      editId: z.string().optional().describe('Edit ID (creates a new edit if not provided)'),
      language: z.string().optional().describe('Language code (default: "en-US")'),
    },
    async ({ appId, imageType, editId, language }) => {
      try {
        const lang = language ?? 'en-US';

        // Create edit if not provided
        let activeEditId = editId;
        if (!activeEditId) {
          const { data: edit } = await client.request<{ id: string }>(
            `/applications/${appId}/edits`,
            { method: 'POST', body: {} }
          );
          activeEditId = edit.id;
        }

        // Get ETag
        const { etag } = await client.request<ImageResource[]>(
          `/applications/${appId}/edits/${activeEditId}/listings/${lang}/${imageType}`
        );

        await client.request(
          `/applications/${appId}/edits/${activeEditId}/listings/${lang}/${imageType}`,
          { method: 'DELETE', etag }
        );

        return {
          content: [{
            type: 'text' as const,
            text: `All ${imageType} deleted for ${lang}.\nEdit ID: ${activeEditId}` +
              `\n\nUse commit_edit to submit or make more changes first.`,
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
