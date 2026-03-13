import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AmazonAppstoreClient } from '../client.js';
import { formatError } from '../errors.js';

interface Apk {
  id: string;
  name: string;
  versionCode: number;
}

export function registerApkTools(server: McpServer, client: AmazonAppstoreClient) {
  server.tool(
    'list_apks',
    'List all APKs in an edit',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
    },
    async ({ appId, editId }) => {
      try {
        const { data } = await client.request<Apk[]>(
          `/applications/${appId}/edits/${editId}/apks`
        );
        return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'upload_apk',
    'Upload an APK to an edit. Creates the edit automatically if editId is not provided.',
    {
      appId: z.string().describe('Amazon app ID'),
      apkPath: z.string().describe('Absolute path to the .apk file'),
      editId: z.string().optional().describe('Edit ID (creates a new edit if not provided)'),
      autoCommit: z.boolean().optional().describe('Automatically validate and commit after upload (default: false)'),
    },
    async ({ appId, apkPath, editId, autoCommit }) => {
      try {
        const { existsSync, readFileSync } = await import('node:fs');
        if (!existsSync(apkPath)) {
          return formatError(new Error(`APK file not found: ${apkPath}`));
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

        // Upload APK
        const fileBuffer = Buffer.from(readFileSync(apkPath));
        const { data: apk } = await client.request<Apk>(
          `/applications/${appId}/edits/${activeEditId}/apks/upload`,
          {
            method: 'POST',
            rawBody: fileBuffer,
            contentType: 'application/vnd.android.package-archive',
          }
        );

        let commitResult = '';
        if (autoCommit) {
          // Validate
          await client.request(
            `/applications/${appId}/edits/${activeEditId}/validate`,
            { method: 'POST' }
          );

          // Commit
          const { data: commit } = await client.request<unknown>(
            `/applications/${appId}/edits/${activeEditId}/commit`,
            { method: 'POST' }
          );
          commitResult = `\nEdit validated and committed.\n${JSON.stringify(commit, null, 2)}`;
        }

        return {
          content: [{
            type: 'text' as const,
            text: `APK uploaded successfully!\n` +
              `Edit ID: ${activeEditId}\n` +
              `APK: ${JSON.stringify(apk, null, 2)}` +
              commitResult +
              (autoCommit ? '' : `\n\nUse validate_edit and commit_edit to submit, or make more changes first.`),
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'replace_apk',
    'Replace an existing APK in an edit (preserves device targeting)',
    {
      appId: z.string().describe('Amazon app ID'),
      editId: z.string().describe('Edit ID'),
      apkId: z.string().describe('APK ID to replace'),
      apkPath: z.string().describe('Absolute path to the new .apk file'),
    },
    async ({ appId, editId, apkId, apkPath }) => {
      try {
        const { existsSync, readFileSync } = await import('node:fs');
        if (!existsSync(apkPath)) {
          return formatError(new Error(`APK file not found: ${apkPath}`));
        }

        const fileBuffer = Buffer.from(readFileSync(apkPath));
        const { data } = await client.request<Apk>(
          `/applications/${appId}/edits/${editId}/apks/${apkId}/replace`,
          {
            method: 'PUT',
            rawBody: fileBuffer,
            contentType: 'application/vnd.android.package-archive',
          }
        );

        return {
          content: [{
            type: 'text' as const,
            text: `APK replaced successfully!\n${JSON.stringify(data, null, 2)}`,
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
