# GitHub Copilot MCP Configuration Guide

## Important: Manual Configuration Required

GitHub Copilot does **NOT** automatically discover MCP servers from VS Code extensions. You must manually configure the MCP server in Copilot's settings.

## Step-by-Step Configuration

### 1. Get Your Extension's Server Path

1. Install the "Tailwind Color Generator" extension in VS Code
2. Open Command Palette (`Ctrl+Shift+P`)
3. Run: **"Tailwind Color Generator: Configure MCP Server"**
4. Click **"Copy Server Path"** or **"Copy Full Command"**
5. Note the path (e.g., `C:\Users\X1\Downloads\tailwind-color-mcp\mcp-server.js`)

### 2. Configure GitHub Copilot

#### Method 1: VS Code Settings (Recommended)

1. Open VS Code Settings (`Ctrl+,`)
2. Search for "github copilot mcp"
3. Look for MCP settings and add your server configuration

#### Method 2: Configuration File

**Windows:**
```bash
# Navigate to Copilot config directory
cd "%APPDATA%\GitHub Copilot\hosts\vscode"

# Create or edit mcp_config.json
notepad mcp_config.json
```

**macOS:**
```bash
# Navigate to Copilot config directory
cd "~/Library/Application Support/GitHub Copilot/hosts/vscode"

# Create or edit mcp_config.json
nano mcp_config.json
```

**Linux:**
```bash
# Navigate to Copilot config directory
cd "~/.config/GitHub Copilot/hosts/vscode"

# Create or edit mcp_config.json
nano mcp_config.json
```

### 3. Configuration File Content

Create/edit the `mcp_config.json` file with:

```json
{
  "mcpServers": {
    "tailwind-color-generator": {
      "command": "node",
      "args": ["C:\\path\\to\\your\\extension\\mcp-server.js"],
      "env": {}
    }
  }
}
```

**Replace the path** with your actual server path from step 1.

### 4. Restart and Test

1. **Restart VS Code completely**
2. **Open GitHub Copilot Chat**
3. **Test with a prompt like:**
   ```
   "Generate a blue Tailwind color palette using the MCP tools"
   ```

## Troubleshooting

### Copilot Doesn't See the Tools

1. **Check the file path** - Use the exact path from the extension
2. **Use forward slashes or escaped backslashes** in JSON:
   ```json
   "args": ["C:/Users/X1/Downloads/tailwind-color-mcp/mcp-server.js"]
   ```
   or
   ```json
   "args": ["C:\\Users\\X1\\Downloads\\tailwind-color-mcp\\mcp-server.js"]
   ```

3. **Verify Node.js is available** - The `node` command must be in your PATH
4. **Test the server manually**:
   ```bash
   node "C:\path\to\mcp-server.js"
   ```

### Alternative: Use Extension Commands

If MCP configuration doesn't work, you can still use the extension's built-in commands:

1. Right-click in any file → **"Generate Color Palette"**
2. Command Palette → **"Tailwind Color Generator: Generate Color Palette"**

## Example Usage After Configuration

Once configured, ask Copilot:

- "Use the Tailwind color generator to create a blue palette"
- "Generate a complementary color scheme with the MCP tools"
- "Analyze the accessibility of color #3B82F6 using the color tools"

## Current Limitations

- GitHub Copilot MCP support may vary by version
- Configuration process may change as Copilot evolves
- Some Copilot versions may not support MCP yet

For the most up-to-date information, check:
- GitHub Copilot documentation
- MCP (Model Context Protocol) documentation
- This extension's README for updates
