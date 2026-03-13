#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig } from './config.js';
import { AmazonAppstoreClient } from './client.js';
import { registerEditTools } from './tools/edits.js';
import { registerApkTools } from './tools/apks.js';
import { registerListingTools } from './tools/listings.js';
import { registerAvailabilityTools } from './tools/availability.js';

const config = loadConfig();
const client = new AmazonAppstoreClient(config);

const server = new McpServer(
  { name: 'amazon-mcp-server', version: '1.0.0' },
  { capabilities: { logging: {} } }
);

registerEditTools(server, client);
registerApkTools(server, client);
registerListingTools(server, client);
registerAvailabilityTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
