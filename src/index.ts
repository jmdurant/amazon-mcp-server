#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig, getConfigErrors } from './config.js';

const config = loadConfig();

const server = new McpServer(
  { name: 'amazon-mcp-server', version: '1.0.0' },
  { capabilities: { logging: {} } }
);

if (config) {
  const { AmazonAppstoreClient } = await import('./client.js');
  const { registerEditTools } = await import('./tools/edits.js');
  const { registerApkTools } = await import('./tools/apks.js');
  const { registerListingTools } = await import('./tools/listings.js');
  const { registerAvailabilityTools } = await import('./tools/availability.js');

  const client = new AmazonAppstoreClient(config);
  registerEditTools(server, client);
  registerApkTools(server, client);
  registerListingTools(server, client);
  registerAvailabilityTools(server, client);
} else {
  const errors = getConfigErrors();
  const missingKeys = errors.map((e) => e.key);
  const allVars = ['AMAZON_CLIENT_ID', 'AMAZON_CLIENT_SECRET'];
  const setVars = allVars.filter((v) => !missingKeys.includes(v));

  server.tool('setup', 'Show setup instructions for the Amazon Appstore MCP server', {}, async () => {
    const lines = [
      'Amazon Appstore MCP Server - Setup Required',
      '',
      'This server needs the following environment variables configured in your Claude settings (~/.claude/settings.json):',
      '',
      '"amazon-appstore": {',
      '  "command": "node",',
      '  "args": ["/Users/jamesdurant/amazon-mcp-server/dist/index.js"],',
      '  "env": {',
      '    "AMAZON_CLIENT_ID": "Your client ID from Security Profile",',
      '    "AMAZON_CLIENT_SECRET": "Your client secret from Security Profile"',
      '  }',
      '}',
      '',
      'How to get these values:',
      '1. Go to Amazon Developer Console -> Tools & Services -> API Access',
      '2. Create a Security Profile (or use existing)',
      '3. Go to Web Settings tab -> copy Client ID and Client Secret',
      '4. Associate the Security Profile with the App Submission API',
      '',
      `Missing: ${missingKeys.join(', ')}`,
      `Set:     ${setVars.length > 0 ? setVars.join(', ') : '(none)'}`,
      '',
      'After updating settings, restart Claude Code for changes to take effect.',
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  });
}

const transport = new StdioServerTransport();
await server.connect(transport);
