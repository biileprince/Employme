# Employ.me Next.js Frontend - Quick Reference

## MCP Servers Configured ✓

Both Next.js DevTools MCP and shadcn MCP are now configured and ready to use!

### Files Created:

- `.mcp.json` - Main MCP configuration (Claude Code)
- `.cursor/mcp.json` - Cursor-specific configuration
- `.vscode/mcp.json` - VS Code configuration
- `.env.local` - Environment variables
- `MCP_SETUP.md` - Comprehensive MCP documentation

## Quick Start

1. **Start the dev server**:

```bash
npm run dev
```

2. **Verify MCP connection** (in your AI assistant):

   - Claude Code: Run `/mcp` command
   - Cursor: Check Settings → MCP Servers (look for green dot)
   - VS Code: Open `.vscode/mcp.json` and click "Start"

3. **Try example prompts**:

```
"Show me all available components in the shadcn registry"
"What errors are in my application?"
"Add button and dialog components to my project"
"Help me understand Next.js 16 caching"
```

## Next Steps

### Install Core Components

```bash
# Use AI assistant with MCP:
"Add button, input, dialog, card, and avatar components"

# Or manually:
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add card
npx shadcn@latest add avatar
```

### Configure Theme

The project uses:

- **Style**: new-york
- **Base Color**: neutral
- **CSS Variables**: enabled
- **Icon Library**: lucide
- **RSC**: enabled

### Project Structure

```
client-nextjs/
├── .mcp.json              # MCP configuration (root)
├── .cursor/mcp.json       # Cursor MCP config
├── .vscode/mcp.json       # VS Code MCP config
├── .env.local             # Environment variables
├── components.json        # shadcn configuration
├── MCP_SETUP.md          # MCP documentation
├── app/
│   ├── globals.css       # Global styles with Tailwind
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   └── ui/               # shadcn components (auto-generated)
└── lib/
    └── utils.ts          # Utilities (cn function)
```

## Environment Variables

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:5001/api

# Socket.IO
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001

# Cloudinary (optional - for file uploads)
# NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
# NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Registry Auth (optional - for private registries)
# REGISTRY_TOKEN=your_token_here
```

## MCP Capabilities

### Next.js DevTools MCP

- ✓ Error detection (build/runtime/TypeScript)
- ✓ Live application state
- ✓ Page metadata and routing
- ✓ Server Actions inspection
- ✓ Development logs
- ✓ Upgrade assistance

### shadcn MCP

- ✓ Browse all components
- ✓ Search across registries
- ✓ Install via natural language
- ✓ Custom registry support

## Troubleshooting

### MCP not connecting?

1. Ensure dev server is running
2. Restart your AI assistant
3. Check `.mcp.json` exists

### Components not installing?

1. Verify `components.json` exists
2. Check you have write permissions
3. Ensure dependencies are installed

## Learn More

- See `MCP_SETUP.md` for detailed documentation
- [Next.js MCP Docs](https://nextjs.org/docs/app/guides/mcp)
- [shadcn MCP Docs](https://ui.shadcn.com/docs/mcp)
