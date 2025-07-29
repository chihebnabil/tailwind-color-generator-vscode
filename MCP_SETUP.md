# MCP Server Configuration Guide

## ✅ AUTOMATIC DISCOVERY (VS Code Extension)

**Good News!** If you installed the Tailwind Color Generator VS Code extension, the MCP server is automatically registered with GitHub Copilot and other MCP clients.

### What You Need to Do:
1. ✅ Install the VS Code extension (you've done this!)
2. ✅ Restart VS Code to ensure registration
3. ✅ Test with GitHub Copilot: Ask "Generate a blue Tailwind color palette"

The extension automatically provides these tools to AI assistants:
- `generate_tailwind_palette`
- `generate_color_scheme` 
- `analyze_color`

### If Automatic Discovery Doesn't Work

Some older MCP clients may require manual configuration. Use the instructions below.

---

## 📋 Manual Configuration (If Needed)

### GitHub Copilot (Manual Setup)

**Only needed if automatic discovery fails:**

1. **Get Server Path**:
   - Run "Tailwind Color Generator: Configure MCP Server" in VS Code
   - Copy the server path shown

2. **Manual Configuration File**:
   Create/edit MCP config at:
   - Windows: `%APPDATA%\GitHub Copilot\hosts\vscode\mcp_config.json`
   - macOS: `~/Library/Application Support/GitHub Copilot/hosts/vscode/mcp_config.json`
   - Linux: `~/.config/GitHub Copilot/hosts/vscode/mcp_config.json`

   ```json
   {
     "mcpServers": {
       "tailwind-color-generator": {
         "command": "node",
         "args": ["C:\\path\\to\\mcp-server.js"]
       }
     }
   }
   ```

3. **Restart VS Code**

## Claude Desktop

For Claude Desktop, add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tailwind-color-generator": {
      "command": "node",
      "args": ["C:\\Users\\X1\\Downloads\\tailwind-color-mcp\\mcp-server.js"]
    }
  }
}
```

## Other MCP Clients

For any MCP-compatible client:
- **Command**: `node`
- **Arguments**: `["path/to/mcp-server.js"]`
- **Transport**: stdio
- **Protocol**: MCP 1.0

## Testing the Configuration

1. Use the VS Code command "Tailwind Color Generator: Test MCP Server"
2. Or manually test by running: `node mcp-server.js`
3. The server should output: "Tailwind Color Generator MCP Server running on stdio"

## Available Tools

Once configured, you can use these tools with your AI assistant:

### generate_tailwind_palette
```json
{
  "name": "generate_tailwind_palette",
  "arguments": {
    "baseColor": "#3B82F6",
    "name": "primary",
    "format": "js"
  }
}
```

### generate_color_scheme
```json
{
  "name": "generate_color_scheme",
  "arguments": {
    "strategy": "complementary",
    "baseHue": 220,
    "colorNames": ["primary", "secondary", "accent"],
    "format": "js"
  }
}
```

### analyze_color
```json
{
  "name": "analyze_color",
  "arguments": {
    "color": "#3B82F6"
  }
}
```

## Example Usage with AI

Once configured, you can ask your AI assistant:

- "Generate a blue-themed Tailwind color palette"
- "Create a complementary color scheme for my website"
- "Analyze the accessibility of color #FF6B6B"
- "Generate a monochromatic palette from #10B981"

The AI will use the MCP tools to generate the requested color palettes and configurations.
