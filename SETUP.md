# Setup and Installation Guide

## Prerequisites

- Node.js 18.0.0 or higher
- Visual Studio Code 1.74.0 or higher
- An MCP-compatible AI client (GitHub Copilot, Claude Desktop, etc.)

## Installation Steps

### 1. Install the Extension

**Option A: From Source (Development)**
1. Clone or download this repository
2. Open the folder in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to run the extension in a new Extension Development Host window

**Option B: Package and Install**
1. Install vsce: `npm install -g @vscode/vsce`
2. Package the extension: `npx vsce package`
3. Install the .vsix file in VS Code

### 2. Configure the MCP Server

1. Open VS Code Command Palette (`Ctrl+Shift+P`)
2. Run "Tailwind Color Generator: Configure MCP Server"
3. Copy the server path shown (e.g., `C:\path\to\mcp-server.js`)

### 3. Set Up Your AI Client

#### For GitHub Copilot
Configure your MCP client settings to include:
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

#### For Claude Desktop
Add to your `claude_desktop_config.json`:
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

### 4. Test the Setup

1. Run "Tailwind Color Generator: Test MCP Server" in VS Code
2. Verify you see "✅ MCP Server is working correctly!"
3. Try asking your AI assistant to generate a color palette

## Using the Extension

### Direct VS Code Usage

1. **Generate Palette in File**:
   - Right-click in any file
   - Select "Generate Color Palette"
   - Follow the prompts

2. **Command Palette Options**:
   - `Tailwind Color Generator: Configure MCP Server`
   - `Tailwind Color Generator: Test MCP Server`
   - `Tailwind Color Generator: Generate Color Palette`

### With AI Assistants

Ask your AI assistant things like:
- "Generate a blue Tailwind color palette"
- "Create a complementary color scheme from #FF6B6B"
- "Analyze the accessibility of color #3B82F6"
- "Generate a triadic color scheme for a website"

## Available MCP Tools

### generate_tailwind_palette
Generate a complete Tailwind-compatible color palette.

**Parameters:**
- `baseColor` (required): Hex, HSL, or named color
- `name` (optional): Palette name (default: "primary")
- `format` (optional): "js", "css", or "json" (default: "js")

### generate_color_scheme  
Generate multiple palettes using color harmony.

**Parameters:**
- `strategy` (required): "complementary", "analogous", "monochromatic", or "triadic"
- `baseHue` (optional): Base hue 0-360 degrees
- `colorNames` (optional): Array of palette names
- `format` (optional): Output format

### analyze_color
Analyze color properties and accessibility.

**Parameters:**
- `color` (required): Color to analyze

## Troubleshooting

### Extension Issues
- Ensure Node.js 18+ is installed
- Check that all dependencies are installed (`npm install`)
- Verify the extension is activated in VS Code

### MCP Server Issues
- Test the server: "Tailwind Color Generator: Test MCP Server"
- Check the server path is correct
- Ensure your AI client configuration matches the server path
- Verify Node.js can run the server file directly

### AI Assistant Issues
- Confirm your AI client supports MCP
- Double-check the MCP configuration file syntax
- Restart your AI client after configuration changes
- Check that the server path uses forward slashes or escaped backslashes

## Configuration

You can customize the extension through VS Code settings:

- `tailwindColorGenerator.serverPath`: Custom MCP server path
- `tailwindColorGenerator.autoStart`: Auto-start server with VS Code

## Support

For issues and questions:
1. Use "Test MCP Server" to diagnose server issues
2. Check the Output panel for error messages  
3. Verify your MCP client configuration
4. Ensure all prerequisites are met
