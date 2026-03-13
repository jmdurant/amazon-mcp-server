import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { AmazonAppstoreClient } from '../client.js';
import { formatError } from '../errors.js';

interface DevTestRegistration {
  trackId: string;
}

interface TesterGroup {
  name: string;
  testers: Array<{ firstName: string; lastName: string; email: string }>;
}

interface TesterResponse {
  groups: string[];
  uniqueTesterCount: number;
}

export function registerTestingTools(server: McpServer, client: AmazonAppstoreClient) {
  server.tool(
    'register_devtest',
    'Register an app for Appstore DevTest (Live App Testing). Returns a trackId used to add testers.',
    {
      appId: z.string().describe('Amazon app ID'),
      packageName: z.string().describe('Android package name (e.g. "com.example.myapp")'),
      certificate: z.string().describe('SHA-256 certificate fingerprint of the signing key'),
    },
    async ({ appId, packageName, certificate }) => {
      try {
        const { data } = await client.request<DevTestRegistration>(
          `/applications/${appId}/devtest/register`,
          { method: 'POST', body: { packageName, certificate } }
        );
        return {
          content: [{
            type: 'text' as const,
            text: `App registered for DevTest.\n${JSON.stringify(data, null, 2)}\n\nUse add_testers with trackId "${data.trackId}" to add testers.`,
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );

  server.tool(
    'add_testers',
    'Add testers to a DevTest track. Testers receive an email invitation to install the test version.',
    {
      appId: z.string().describe('Amazon app ID'),
      trackId: z.string().describe('Track ID from register_devtest (usually "devtest")'),
      groups: z.array(z.object({
        name: z.string().describe('Group name'),
        testers: z.array(z.object({
          firstName: z.string().describe('Tester first name'),
          lastName: z.string().describe('Tester last name'),
          email: z.string().describe('Tester email address'),
        })).describe('List of testers in this group'),
      })).describe('Tester groups to add'),
    },
    async ({ appId, trackId, groups }) => {
      try {
        const { data } = await client.request<TesterResponse>(
          `/applications/${appId}/tracks/${trackId}/testers`,
          { method: 'POST', body: { groups } }
        );
        return {
          content: [{
            type: 'text' as const,
            text: `Testers added.\n${JSON.stringify(data, null, 2)}`,
          }],
        };
      } catch (error) {
        return formatError(error);
      }
    }
  );
}
