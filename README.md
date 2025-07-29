# Tailwind Color Generator VS Code Extension

A Visual Studio Code extension that provides an MCP (Model Context Protocol) server for generating Tailwind-compatible color palettes. This extension allows you to use AI assistants like GitHub Copilot to generate beautiful color schemes for your projects.

## Features

- 🎨 **Generate Tailwind Palettes**: Create complete Tailwind-compatible color palettes from any base color
- 🔄 **Color Harmony Schemes**: Generate multiple palettes using complementary, analogous, monochromatic, or triadic color strategies
- 🔍 **Color Analysis**: Analyze colors for accessibility, contrast ratios, and color properties
- 🤖 **MCP Integration**: Works seamlessly with AI assistants through the Model Context Protocol
- ⚡ **Direct Integration**: Generate palettes directly in your code files

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Tailwind Color Generator"
4. Click Install

### Manual Installation
1. Clone or download this repository
2. Run `npm install` to install dependencies
3. Open the folder in VS Code
4. Press F5 to run the extension in a new Extension Development Host window

## Usage

### Using with AI Assistants (Recommended)

1. **Configure the MCP Server**:
   - Open Command Palette (Ctrl+Shift+P)
   - Run "Tailwind Color Generator: Configure MCP Server"
   - Copy the server path provided

2. **Set up your MCP Client**:
   - Configure your AI assistant to connect to the MCP server
   - Use the server path from step 1

3. **Available MCP Tools**:
   - `generate_tailwind_palette`: Generate a palette from a base color
   - `generate_color_scheme`: Generate multiple palettes using color harmony
   - `analyze_color`: Analyze color properties and accessibility

### Direct Usage in VS Code

1. **Generate Palette in Editor**:
   - Right-click in any file
   - Select "Generate Color Palette"
   - Enter base color and preferences
   - Palette will be inserted at cursor position

2. **Test MCP Server**:
   - Run "Tailwind Color Generator: Test MCP Server" from Command Palette
   - Verifies the server is working correctly

## Example AI Prompts

Once configured with an MCP-enabled AI assistant, you can use prompts like:

```
"Generate a blue-themed color palette for my Tailwind project"
"Create a complementary color scheme starting from #FF6B6B"
"Analyze the accessibility of color #3B82F6"
"Generate a monochromatic palette for a professional website"
```

## MCP Tools Reference

### generate_tailwind_palette
Generate a complete Tailwind-compatible color palette from a base color.

**Parameters:**
- `baseColor` (required): Base color in hex, hsl, or named format
- `name` (optional): Name for the color palette (default: "primary")
- `format` (optional): Output format - "js", "css", or "json" (default: "js")

### generate_color_scheme
Generate multiple color palettes using predefined color harmony strategies.

**Parameters:**
- `strategy` (required): Color harmony strategy - "complementary", "analogous", "monochromatic", or "triadic"
- `baseHue` (optional): Base hue in degrees 0-360
- `colorNames` (optional): Array of names for the generated palettes
- `format` (optional): Output format - "js", "css", or "json" (default: "js")

### analyze_color
Analyze a color and provide detailed information about its properties.

**Parameters:**
- `color` (required): Color to analyze in hex, hsl, or named format

## Configuration

Access extension settings through VS Code settings:

- `tailwindColorGenerator.serverPath`: Custom path to MCP server file
- `tailwindColorGenerator.autoStart`: Automatically start MCP server with VS Code

## Output Formats

### JavaScript (Tailwind Config)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          // ... more shades
        }
      }
    }
  }
}
```

### CSS Variables
```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  /* ... more shades */
}
```

### JSON
```json
{
  "primary": {
    "50": "#eff6ff",
    "100": "#dbeafe"
  }
}
```

## Requirements

- VS Code 1.74.0 or higher
- Node.js 18.0.0 or higher (for MCP server)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

If you encounter any issues or have feature requests:
1. Check the [issues page](https://github.com/your-username/tailwind-color-generator-vscode/issues)
2. Create a new issue with detailed information
3. Use the "Test MCP Server" command to verify setup

## Changelog

### 1.0.0
- Initial release
- MCP server integration
- Basic palette generation
- Color analysis tools
- VS Code command integration
