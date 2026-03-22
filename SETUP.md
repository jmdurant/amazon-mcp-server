# Amazon Appstore MCP Server — Setup

## Prerequisites

1. An Amazon Developer account with Appstore API access
2. Security Profile credentials (Client ID and Client Secret)
3. Node.js 18+

## Create Security Profile

1. Go to [Amazon Developer Console](https://developer.amazon.com/)
2. Navigate to Settings → Security Profiles
3. Create a new Security Profile (or use existing)
4. Under the "Web Settings" tab, note the **Client ID** and **Client Secret**
5. Ensure the security profile has Appstore API permissions

## Environment Variables

Set these in your shell profile:

### macOS / Linux (`~/.zshrc` or `~/.bashrc`)

```bash
export AMAZON_CLIENT_ID="amzn1.application-oa2-client.your_client_id"
export AMAZON_CLIENT_SECRET="your_client_secret"
```

Then reload: `source ~/.zshrc`

### Windows (PowerShell)

```powershell
$env:AMAZON_CLIENT_ID = "amzn1.application-oa2-client.your_client_id"
$env:AMAZON_CLIENT_SECRET = "your_client_secret"
```

### Windows (CMD)

```cmd
setx AMAZON_CLIENT_ID "amzn1.application-oa2-client.your_client_id"
setx AMAZON_CLIENT_SECRET "your_client_secret"
```

## Install & Build

```bash
npm install
npm run build
```

## Add to Claude Code

Copy `.mcp.json.example` to your project's `.mcp.json`:

```bash
cp .mcp.json.example /path/to/your/project/.mcp.json
```

Update the `args` path:

```json
"args": ["/full/path/to/amazon-mcp-server/dist/index.js"]
```

Restart Claude Code.

## Security

- **Never commit your Client Secret** to any repository
- **Never hardcode credentials** in `.mcp.json` — use `${ENV_VAR}` references
- Rotate credentials periodically via Amazon Developer Console
- Use the principle of least privilege for API permissions
