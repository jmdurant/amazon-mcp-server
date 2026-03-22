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

## Install & Build

```bash
npm install
npm run build
```

## Configure Credentials

### Option 1: Shared `.env` file (Recommended)

Create `~/.env` with your credentials. The `.mcp.json` shell wrapper sources this automatically.

```bash
# ~/.env
AMAZON_CLIENT_ID="amzn1.application-oa2-client.your_client_id"
AMAZON_CLIENT_SECRET="your_client_secret"
```

Secure it:
```bash
chmod 600 ~/.env
```

You can also create a project-level `.env` to override per-project.

### Option 2: Shell profile environment variables

#### macOS / Linux (`~/.zshrc` or `~/.bashrc`)

```bash
export AMAZON_CLIENT_ID="amzn1.application-oa2-client.your_client_id"
export AMAZON_CLIENT_SECRET="your_client_secret"
```

#### Windows (PowerShell)

```powershell
$env:AMAZON_CLIENT_ID = "amzn1.application-oa2-client.your_client_id"
$env:AMAZON_CLIENT_SECRET = "your_client_secret"
```

#### Windows (CMD — persistent)

```cmd
setx AMAZON_CLIENT_ID "amzn1.application-oa2-client.your_client_id"
setx AMAZON_CLIENT_SECRET "your_client_secret"
```

## Add to Claude Code

Copy `.mcp.json.example` to your project's `.mcp.json` (or merge into existing):

```json
{
  "mcpServers": {
    "amazon-appstore": {
      "command": "bash",
      "args": ["-c", "set -a && source $HOME/.env && source ./.env 2>/dev/null && exec node $HOME/amazon-mcp-server/dist/index.js"]
    }
  }
}
```

How it works:
- `set -a` — auto-exports all sourced variables
- `source $HOME/.env` — loads shared credentials
- `source ./.env 2>/dev/null` — loads project overrides (silent if missing)
- `exec node ...` — launches the server

Restart Claude Code after adding.

## Security

- **Never commit your Client Secret** to any repository
- **Never hardcode credentials** in `.mcp.json` — use the `.env` sourcing pattern
- Secure your `.env`: `chmod 600 ~/.env`
- Add `.env` to your global gitignore: `echo ".env" >> ~/.gitignore_global`
- Rotate credentials periodically via Amazon Developer Console
- Use the principle of least privilege for API permissions
