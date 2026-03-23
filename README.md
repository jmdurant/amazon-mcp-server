# Amazon Appstore MCP Server

An MCP (Model Context Protocol) server that provides Claude Code with direct access to the Amazon Appstore Submission API. Handles app edits, APK uploads, store listings, images, videos, targeting, and live app testing.

## Setup

### 1. Get API Credentials

1. Go to [Amazon Developer Console](https://developer.amazon.com/) > Tools & Services > API Access
2. Create a Security Profile (or use existing)
3. Go to Web Settings tab > copy Client ID and Client Secret
4. Associate the Security Profile with the App Submission API

### 2. Install

```bash
cd amazon-mcp-server
npm install
npm run build
```

### 3. Configure Claude Code

Add to your project's `.mcp.json` (or copy the one included in this repo):

```json
{
  "mcpServers": {
    "amazon-appstore": {
      "command": "node",
      "args": ["${HOME}/amazon-mcp-server/dist/index.js"],
      "env": {
        "HOME": "${USERPROFILE}",
        "AMAZON_CLIENT_ID": "your_client_id",
        "AMAZON_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

> The `"HOME": "${USERPROFILE}"` line ensures cross-platform compatibility (Windows sets `USERPROFILE`, macOS/Linux set `HOME`). On macOS/Linux you can remove it.

The server will guide you through setup if credentials are missing or invalid.

Restart Claude Code to pick up the new MCP server.

## Available Tools

### Edits (Submissions)
| Tool | Description |
|---|---|
| `create_edit` | Create a new edit for an app |
| `get_edit` | Get the current open edit |
| `get_edit_by_id` | Get a specific edit by ID |
| `get_previous_edit` | Get the most recent committed edit |
| `delete_edit` | Delete an open edit |
| `validate_edit` | Validate an edit before committing |
| `commit_edit` | Commit an edit to submit changes |

### APKs
| Tool | Description |
|---|---|
| `list_apks` | List APKs in the current edit |
| `get_apk` | Get details of a specific APK |
| `upload_apk` | Upload a new APK |
| `replace_apk` | Replace an existing APK |
| `delete_apk` | Delete an APK from the edit |

### Store Listings
| Tool | Description |
|---|---|
| `get_listings` | Get store listings for all languages |
| `update_listing` | Update a store listing |
| `delete_listing` | Delete a store listing for a language |
| `get_app_details` | Get app-level details |
| `update_app_details` | Update app-level details |

### Images
| Tool | Description |
|---|---|
| `list_images` | List uploaded images |
| `upload_image` | Upload a screenshot or graphic |
| `delete_image` | Delete an image |
| `delete_all_images` | Delete all images of a type |

### Videos
| Tool | Description |
|---|---|
| `list_videos` | List uploaded videos |
| `upload_video` | Upload a promo video |
| `delete_video` | Delete a video |
| `delete_all_videos` | Delete all videos |

### Availability
| Tool | Description |
|---|---|
| `get_availability` | Get marketplace availability |
| `set_availability` | Set marketplace availability |

### Targeting
| Tool | Description |
|---|---|
| `get_apk_targeting` | Get device targeting for an APK |
| `update_apk_targeting` | Update device targeting |

### Testing
| Tool | Description |
|---|---|
| `register_devtest` | Register a device for Live App Testing |
| `add_testers` | Add testers to Live App Testing |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AMAZON_CLIENT_ID` | Yes | Security Profile Client ID |
| `AMAZON_CLIENT_SECRET` | Yes | Security Profile Client Secret |

## Requirements

- Node.js 18+
- Amazon Developer account with App Submission API access
