# Zendesk MCP Server

> Model Context Protocol server that connects AI assistants to Zendesk, enabling natural language queries over support tickets, help articles, and customer feedback.

Search your Zendesk data using AI in [Cursor](https://cursor.sh), [Claude Desktop](https://claude.ai/desktop), or any MCP-compatible tool.

[![npm version](https://badge.fury.io/js/zendesk-mcp-server.svg)](https://www.npmjs.com/package/zendesk-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🔍 **Search Support Tickets** - Query tickets with advanced filters (status, tags, dates, priority)
- 📚 **Search Knowledge Base** - Find relevant help articles and documentation
- 📊 **Feature Feedback Analysis** - Get comprehensive feedback about specific features including bug reports, feature requests, and support questions
- 🎫 **Ticket Details** - Retrieve full ticket information including all comments
- 📖 **Article Content** - Access complete help center articles
- 🏷️ **Tag-based Search** - Find all tickets with specific tags

## Installation

### Option 1: Use via npx (Recommended)

No installation required! Just configure and use:

```json
{
  "mcpServers": {
    "zendesk": {
      "command": "npx",
      "args": ["-y", "zendesk-mcp-server"],
      "env": {
        "ZENDESK_SUBDOMAIN": "your-company",
        "ZENDESK_EMAIL": "your-email@company.com",
        "ZENDESK_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

### Option 2: Install Globally

```bash
npm install -g zendesk-mcp-server
```

Then configure:

```json
{
  "mcpServers": {
    "zendesk": {
      "command": "zendesk-mcp-server",
      "env": {
        "ZENDESK_SUBDOMAIN": "your-company",
        "ZENDESK_EMAIL": "your-email@company.com",
        "ZENDESK_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

### Option 3: Local Development

```bash
git clone https://github.com/wlaubernds/zendesk-mcp-server.git
cd zendesk-mcp-server
npm install
npm run build
```

Then use the local path in your config:

```json
{
  "mcpServers": {
    "zendesk": {
      "command": "node",
      "args": ["/path/to/zendesk-mcp-server/dist/index.js"],
      "env": {
        "ZENDESK_SUBDOMAIN": "your-company",
        "ZENDESK_EMAIL": "your-email@company.com",
        "ZENDESK_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

## Getting Your Zendesk API Credentials

1. Log in to your Zendesk Admin Center
2. Navigate to **Apps and integrations** > **APIs** > **Zendesk API**
3. Click the **Settings** tab
4. Under **Token Access**, click **Add API token**
5. Give it a description (e.g., "MCP Server")
6. Copy the token (you'll only see it once!)
7. Your subdomain is the first part of your Zendesk URL: `https://YOUR-SUBDOMAIN.zendesk.com`

## Configuration

Add the configuration to your MCP settings file:

- **Cursor**: `~/.cursor/mcp.json`
- **Claude Desktop**: 
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

See [examples/cursor-config.json](examples/cursor-config.json) for a complete example.

## Usage

Once configured, you can use natural language to query your Zendesk data:

### Example Queries

**Analyze feature feedback:**
```
"Show me all feedback about our mobile app from the last 3 months"
```

**Search tickets:**
```
"Find all high priority bug reports from this week"
"What are users saying about the new dashboard?"
```

**Weekend summaries:**
```
"Summarize all tickets from this weekend"
```

**Specific ticket details:**
```
"Get full details and comments for ticket #12345"
```

**Search help articles:**
```
"Find all help articles about password reset"
```

## Available Tools

The MCP server provides these tools that AI assistants can use:

| Tool | Description |
|------|-------------|
| `search_tickets` | Search tickets with advanced query syntax (status, priority, tags, dates) |
| `get_ticket` | Get full details of a specific ticket including all comments |
| `search_articles` | Search help center articles |
| `get_article` | Get full content of a specific article |
| `search_feature_feedback` | Comprehensive analysis of feedback for a specific feature |
| `get_tickets_by_tag` | Get all tickets with a specific tag |

## Zendesk Query Syntax

When searching tickets, you can use these filters:

- `status:` - new, open, pending, hold, solved, closed
- `priority:` - low, normal, high, urgent
- `tags:` - ticket tags
- `subject:` - search in subject line
- `created>` or `created<` - date filters (format: YYYY-MM-DD)
- `updated>` or `updated<` - last updated date
- Plain text for full-text search

### Query Examples:

```
status:open tags:bug priority:high
tags:mobile created>2024-01-01
subject:"cannot login" priority:urgent
password reset
```

## Permissions

🔒 **This MCP server is READ-ONLY** - it has zero write permissions to Zendesk.

### ✅ What it CAN do:
- Search and read support tickets
- Retrieve ticket details and comments
- Search knowledge base articles
- Analyze feature feedback
- Query tickets by tags, status, priority, dates

### ❌ What it CANNOT do:
- Create tickets
- Update or modify tickets
- Add comments to tickets
- Change ticket status
- Modify tags, priority, or assignments
- Create or edit help articles
- Delete anything

This read-only design makes it safe to use with shared API tokens for analysis and reporting purposes.

## API Rate Limits

Zendesk enforces API rate limits:

- **Professional plans**: 700 requests per minute
- **Team plans**: 400 requests per minute

The server doesn't implement rate limiting internally, so be mindful when making large queries.

## Troubleshooting

### "Error: Missing required environment variables"

Make sure all three environment variables are set in your MCP config:
- `ZENDESK_SUBDOMAIN`
- `ZENDESK_EMAIL`
- `ZENDESK_API_TOKEN`

### "Zendesk API error (401)"

- Check that your email and API token are correct
- Verify the API token hasn't been revoked in Zendesk
- Ensure you're using the correct authentication format

### "Zendesk API error (404)"

- Verify your subdomain is correct
- Check that the ticket/article ID exists

### Server not appearing in Cursor

- Make sure you've restarted Cursor completely after adding the config
- Check that the path in `mcp.json` is correct (if using local installation)
- Verify the JSON syntax in your config file is valid

## Development

### Building

```bash
npm run build
```

### Watch Mode

```bash
npm run watch
```

### Running Locally

```bash
npm run dev
```

Make sure to set the environment variables:

```bash
export ZENDESK_SUBDOMAIN=your-company
export ZENDESK_EMAIL=your-email@company.com
export ZENDESK_API_TOKEN=your-api-token
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

⚠️ **Never commit your API tokens to version control!** 

Your MCP configuration file should remain local to your machine and not be shared or committed to git.

## Acknowledgments

Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk) by Anthropic.

## Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)

## Support

If you encounter any issues or have questions:

- 🐛 [Report a bug](https://github.com/wlaubernds/zendesk-mcp-server/issues)
- 💡 [Request a feature](https://github.com/wlaubernds/zendesk-mcp-server/issues)
- 📖 [Read the docs](https://github.com/wlaubernds/zendesk-mcp-server#readme)
