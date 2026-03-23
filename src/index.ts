#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig, getConfigErrors } from './config.js';

const config = loadConfig();

if (!config) {
  const errors = getConfigErrors();
  const missing = errors.map(e => e.key).join(', ');
  const setupMessage = `Setup required — missing: ${missing}

Set the following in your .mcp.json env block:

  "env": {
    "AMAZON_CLIENT_ID": "your_client_id",
    "AMAZON_CLIENT_SECRET": "your_client_secret"
  }

How to get these values:
1. Go to Amazon Developer Console > Tools & Services > API Access
2. Create a Security Profile (or use existing)
3. Go to Web Settings tab > copy Client ID and Client Secret
4. Associate the Security Profile with the App Submission API

After updating .mcp.json, restart Claude Code for changes to take effect.`;

  const server = new McpServer(
    { name: 'amazon-appstore (needs setup)', version: '1.0.0' },
    { capabilities: { logging: {} } }
  );

  server.tool('amazon_setup', `Amazon Appstore MCP server is not configured. Call this tool for setup instructions.`, {}, async () => ({
    content: [{ type: 'text', text: setupMessage }],
    isError: true,
  }));

  const transport = new StdioServerTransport();
  await server.connect(transport);
} else {
  try {
    const server = new McpServer(
      { name: 'amazon-mcp-server', version: '1.0.0' },
      { capabilities: { logging: {} } }
    );

    const { AmazonAppstoreClient } = await import('./client.js');
    const { registerEditTools } = await import('./tools/edits.js');
    const { registerApkTools } = await import('./tools/apks.js');
    const { registerListingTools } = await import('./tools/listings.js');
    const { registerAvailabilityTools } = await import('./tools/availability.js');
    const { registerImageTools } = await import('./tools/images.js');
    const { registerVideoTools } = await import('./tools/videos.js');
    const { registerTargetingTools } = await import('./tools/targeting.js');
    const { registerTestingTools } = await import('./tools/testing.js');

    const client = new AmazonAppstoreClient(config);
    registerEditTools(server, client);
    registerApkTools(server, client);
    registerListingTools(server, client);
    registerAvailabilityTools(server, client);
    registerImageTools(server, client);
    registerVideoTools(server, client);
    registerTargetingTools(server, client);
    registerTestingTools(server, client);

    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const setupMessage = `Amazon Appstore MCP server failed to start: ${detail}

This usually means your credentials are missing or invalid.

Set the following in your .mcp.json env block:

  "env": {
    "AMAZON_CLIENT_ID": "your_client_id",
    "AMAZON_CLIENT_SECRET": "your_client_secret"
  }

How to get these values:
1. Go to Amazon Developer Console > Tools & Services > API Access
2. Create a Security Profile (or use existing)
3. Go to Web Settings tab > copy Client ID and Client Secret
4. Associate the Security Profile with the App Submission API

After updating .mcp.json, restart Claude Code for changes to take effect.`;

    const fallback = new McpServer(
      { name: 'amazon-appstore (needs setup)', version: '1.0.0' },
      { capabilities: { logging: {} } }
    );
    fallback.tool('amazon_setup', `Amazon Appstore MCP server is not configured. Call this tool for setup instructions.`, {}, async () => ({
      content: [{ type: 'text', text: setupMessage }],
      isError: true,
    }));
    const transport = new StdioServerTransport();
    await fallback.connect(transport);
  }
}
