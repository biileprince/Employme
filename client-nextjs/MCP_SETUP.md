# MCP Server Configuration for Employ.me Next.js Frontend

This Next.js 16 application is configured with **Model Context Protocol (MCP)** servers for AI-assisted development.

## Configured MCP Servers

### 1. Next.js DevTools MCP

**Purpose**: AI-assisted debugging with live application context

**Capabilities**:

- Error detection (build, runtime, TypeScript errors)
- Live application state queries
- Page metadata and routing info
- Server Actions inspection
- Development logs access
- Migration and upgrade assistance

**Configuration**: `.mcp.json`

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

### 2. shadcn UI MCP

**Purpose**: Browse, search, and install UI components from registries

**Capabilities**:

- List all available components from shadcn/ui registry
- Search components across registries
- Install components via natural language
- Support for custom/private registries

**Configuration**: `.mcp.json`

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

## Using MCP Servers

### Prerequisites

1. **Next.js 16+** (already installed ✓)
2. **MCP-compatible AI assistant** (Claude Code, Cursor, VS Code with Copilot, Codex)
3. **Running dev server**: `npm run dev`

### Example Prompts

#### Next.js DevTools MCP

```
"What errors are currently in my application?"
"Help me upgrade to Next.js 16"
"Show me the current page metadata"
"When should I use 'use client' in App Router?"
```

#### shadcn UI MCP

```
"Show me all available components in the shadcn registry"
"Add the button, dialog and card components to my project"
"Create a contact form using shadcn components"
"Install a login form from the shadcn registry"
```

### For Different AI Assistants

#### Claude Code

1. Configuration is already in `.mcp.json`
2. Restart Claude Code
3. Run `/mcp` to verify connection (should show "Connected")

#### Cursor

1. Configuration is already in `.cursor/mcp.json` (created automatically)
2. Enable shadcn MCP server in Cursor Settings
3. Look for green dot next to shadcn server

#### VS Code (GitHub Copilot)

1. Configuration is in `.vscode/mcp.json` (created automatically)
2. Open `.vscode/mcp.json` and click "Start" next to shadcn server
3. Verify in MCP panel

#### Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]

[mcp_servers.next-devtools]
command = "npx"
args = ["-y", "next-devtools-mcp@latest"]
```

## Custom Registries

To add private or third-party registries, edit `components.json`:

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@acme": "https://registry.acme.com/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

Then add authentication tokens to `.env.local`:

```bash
REGISTRY_TOKEN=your_token_here
API_KEY=your_api_key_here
```

## Troubleshooting

### MCP Server Not Connecting

1. Ensure Next.js dev server is running: `npm run dev`
2. Verify `.mcp.json` exists in project root
3. Restart your AI assistant
4. Check MCP server status in your AI assistant

### No Tools Available

1. Clear npx cache: `npx clear-npx-cache`
2. Re-enable MCP server in your AI assistant
3. Check logs (in Cursor: View -> Output -> MCP)

### Registry Access Issues

1. Verify registry URLs in `components.json`
2. Check authentication tokens in `.env.local`
3. Test registry accessibility

## Learn More

- [Next.js MCP Documentation](https://nextjs.org/docs/app/guides/mcp)
- [shadcn MCP Documentation](https://ui.shadcn.com/docs/mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [next-devtools-mcp GitHub](https://github.com/vercel/next-devtools-mcp)
