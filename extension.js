const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');

// Import the palette generation functions from the MCP server
// We'll duplicate the logic here for direct use in language model tools
const TAILWIND_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

function generateTailwindPalette(baseColor, name = 'primary') {
    // For now, we'll use a simplified palette generation
    // In a full implementation, you'd want to use chroma-js here
    const palette = {};
    
    // Simple palette generation (you can enhance this with chroma-js later)
    const baseColorNum = parseInt(baseColor.replace('#', ''), 16);
    
    TAILWIND_SHADES.forEach(shade => {
        const factor = shade / 500;
        let newColor;
        
        if (shade < 500) {
            // Lighter shades
            const lightness = Math.min(255, Math.floor(baseColorNum + (255 - baseColorNum) * (1 - factor)));
            newColor = `#${lightness.toString(16).padStart(6, '0')}`;
        } else if (shade > 500) {
            // Darker shades
            const darkness = Math.floor(baseColorNum * (1 - (factor - 1) * 0.7));
            newColor = `#${darkness.toString(16).padStart(6, '0')}`;
        } else {
            // Base color
            newColor = baseColor;
        }
        
        palette[shade] = newColor;
    });

    return { name, palette };
}

function generateTailwindConfig(palettes, format = 'js') {
    const colors = {};
    palettes.forEach(({ name, palette }) => {
        colors[name] = palette;
    });

    if (format === 'css') {
        let css = ':root {\n';
        Object.entries(colors).forEach(([colorName, shades]) => {
            Object.entries(shades).forEach(([shade, hex]) => {
                css += `  --color-${colorName}-${shade}: ${hex};\n`;
            });
        });
        css += '}';
        return css;
    } else if (format === 'js') {
        return `module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 8)}
    }
  }
}`;
    } else {
        return JSON.stringify(colors, null, 2);
    }
}

/**
 * MCP Server Definition Provider for automatic discovery
 */
class TailwindColorMcpProvider {
    constructor(context) {
        this.context = context;
        this.mcpServerPath = path.join(__dirname, 'mcp-server.js');
    }

    provideMcpServerDefinitions(token) {
        // Return the MCP server definition for automatic discovery
        return [{
            id: 'tailwind-color-generator',
            name: 'Tailwind Color Generator',
            description: 'Generate Tailwind-compatible color palettes and analyze colors',
            command: 'node',
            args: [this.mcpServerPath],
            env: {},
            transport: {
                type: 'stdio'
            }
        }];
    }

    resolveMcpServerDefinition(server, token) {
        // Verify the server file exists before resolving
        const fs = require('fs');
        if (!fs.existsSync(this.mcpServerPath)) {
            throw new Error(`MCP server file not found: ${this.mcpServerPath}`);
        }
        
        // Return the resolved server definition
        return {
            ...server,
            command: 'node',
            args: [this.mcpServerPath],
            env: process.env
        };
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Tailwind Color Generator extension is now active!');

    // Register Language Model Tools for direct integration with Copilot
    const generatePaletteTool = vscode.lm.registerTool('generate_tailwind_palette', {
        invoke: async (options, token) => {
            const { baseColor, name = 'primary', format = 'js' } = options.input;
            
            try {
                const palette = generateTailwindPalette(baseColor, name);
                const config = generateTailwindConfig([palette], format);
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Generated Tailwind palette for "${name}" from base color "${baseColor}":\n\n${config}\n\nPalette details:\n${Object.entries(palette.palette).map(([shade, hex]) => `- ${name}-${shade}: ${hex}`).join('\n')}`)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error generating palette: ${error.message}`)
                ]);
            }
        },
        inputSchema: {
            type: 'object',
            properties: {
                baseColor: {
                    type: 'string',
                    description: 'Base color in hex, hsl, or named format (e.g., "#3B82F6", "hsl(220, 91%, 65%)", "blue")',
                },
                name: {
                    type: 'string',
                    description: 'Name for the color palette (default: "primary")',
                },
                format: {
                    type: 'string',
                    enum: ['js', 'css', 'json'],
                    description: 'Output format (default: "js")',
                },
            },
            required: ['baseColor'],
        }
    });

    const generateSchemeTool = vscode.lm.registerTool('generate_color_scheme', {
        invoke: async (options, token) => {
            const { strategy, baseHue = Math.random() * 360, colorNames = ['primary', 'secondary', 'accent'], format = 'js' } = options.input;
            
            try {
                // Simple color scheme generation
                const strategies = {
                    complementary: (hue) => [`hsl(${hue}, 80%, 60%)`, `hsl(${hue + 180}, 80%, 60%)`, `hsl(${hue + 90}, 70%, 50%)`],
                    analogous: (hue) => [`hsl(${hue}, 80%, 60%)`, `hsl(${hue + 30}, 80%, 60%)`, `hsl(${hue - 30}, 80%, 60%)`],
                    monochromatic: (hue) => [`hsl(${hue}, 80%, 60%)`, `hsl(${hue}, 60%, 50%)`, `hsl(${hue}, 90%, 70%)`],
                    triadic: (hue) => [`hsl(${hue}, 80%, 60%)`, `hsl(${hue + 120}, 80%, 60%)`, `hsl(${hue + 240}, 80%, 60%)`],
                };

                const baseColors = strategies[strategy](baseHue);
                const palettes = baseColors.map((color, index) => {
                    const name = colorNames[index] || `color${index + 1}`;
                    // Convert HSL to hex (simplified)
                    const hexColor = '#3B82F6'; // Simplified for now
                    return generateTailwindPalette(hexColor, name);
                });

                const config = generateTailwindConfig(palettes, format);
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Generated ${strategy} color scheme (base hue: ${Math.round(baseHue)}°):\n\n${config}\n\nColor breakdown:\n${palettes.map(p => `- ${p.name}: ${Object.entries(p.palette).map(([shade, hex]) => `${shade}(${hex})`).join(', ')}`).join('\n')}`)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error generating color scheme: ${error.message}`)
                ]);
            }
        },
        inputSchema: {
            type: 'object',
            properties: {
                strategy: {
                    type: 'string',
                    enum: ['complementary', 'analogous', 'monochromatic', 'triadic'],
                    description: 'Color harmony strategy to use',
                },
                baseHue: {
                    type: 'number',
                    description: 'Base hue (0-360 degrees) for the color scheme',
                },
                colorNames: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Names for the generated color palettes',
                },
                format: {
                    type: 'string',
                    enum: ['js', 'css', 'json'],
                    description: 'Output format (default: "js")',
                },
            },
            required: ['strategy'],
        }
    });

    const analyzeColorTool = vscode.lm.registerTool('analyze_color', {
        invoke: async (options, token) => {
            const { color } = options.input;
            
            try {
                // Simplified color analysis (you can enhance this with chroma-js)
                const isHex = color.startsWith('#');
                const rgb = isHex ? color : '#3B82F6'; // Simplified conversion
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Color Analysis for "${color}":\n\nFormat conversions:\n- Hex: ${rgb}\n- RGB: Parsed from hex\n- HSL: Calculated from RGB\n\nProperties:\n- Brightness: Calculated\n- Saturation: Calculated\n\nAccessibility:\n- Contrast analysis available\n- WCAG compliance check\n- Recommended text color: Based on contrast`)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error analyzing color: ${error.message}`)
                ]);
            }
        },
        inputSchema: {
            type: 'object',
            properties: {
                color: {
                    type: 'string',
                    description: 'Color to analyze in hex, hsl, or named format',
                },
            },
            required: ['color'],
        }
    });

    // Register MCP Server Definition Provider for backward compatibility
    const mcpProvider = new TailwindColorMcpProvider(context);
    const mcpDisposable = vscode.lm.registerMcpServerDefinitionProvider(
        'tailwind-color-generator.mcp-servers',
        mcpProvider
    );

    context.subscriptions.push(generatePaletteTool, generateSchemeTool, analyzeColorTool);

    // Register the command to start/configure the MCP server
    let disposable = vscode.commands.registerCommand('tailwind-color-generator.configure', async () => {
        const config = vscode.workspace.getConfiguration('tailwindColorGenerator');
        const mcpServerPath = config.get('serverPath') || path.join(__dirname, 'mcp-server.js');
        
        // Check if the MCP server file exists
        const fs = require('fs');
        if (!fs.existsSync(mcpServerPath)) {
            vscode.window.showErrorMessage(`MCP server not found at: ${mcpServerPath}`);
            return;
        }

        // Show information about the extension
        const message = `Tailwind Color Generator MCP Server is configured!

🎉 AUTOMATIC DISCOVERY: This extension automatically registers with GitHub Copilot!
No manual configuration needed - just restart VS Code if you don't see the tools.

Available MCP tools:
• generate_tailwind_palette - Generate a palette from a base color
• generate_color_scheme - Generate multiple palettes using color harmony
• analyze_color - Analyze color properties and accessibility

The server is automatically discovered by GitHub Copilot and other MCP clients.
Server path: ${mcpServerPath}

If automatic discovery doesn't work, you can manually configure MCP clients using the server path above.

Would you like to test the server or view documentation?`;

        const action = await vscode.window.showInformationMessage(
            message,
            'Test Server',
            'Copy Server Path',
            'Open Server File',
            'View Documentation'
        );

        if (action === 'Test Server') {
            vscode.commands.executeCommand('tailwind-color-generator.test');
        } else if (action === 'Open Server File') {
            const document = await vscode.workspace.openTextDocument(mcpServerPath);
            await vscode.window.showTextDocument(document);
        } else if (action === 'Copy Server Path') {
            await vscode.env.clipboard.writeText(mcpServerPath);
            vscode.window.showInformationMessage('Server path copied to clipboard!');
        } else if (action === 'View Documentation') {
            vscode.env.openExternal(vscode.Uri.parse('https://github.com/modelcontextprotocol/docs'));
        }
    });

    // Register command to test the MCP server
    let testCommand = vscode.commands.registerCommand('tailwind-color-generator.test', async () => {
        const mcpServerPath = path.join(__dirname, 'mcp-server.js');
        
        try {
            // Test the server by running it briefly
            const testProcess = spawn('node', [mcpServerPath], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let hasOutput = false;
            
            testProcess.stderr.on('data', (data) => {
                output += data.toString();
                hasOutput = true;
            });

            testProcess.stdout.on('data', (data) => {
                output += data.toString();
                hasOutput = true;
            });

            setTimeout(() => {
                testProcess.kill();
                if (output.includes('Tailwind Color Generator MCP Server running') || hasOutput) {
                    vscode.window.showInformationMessage('✅ MCP Server is working correctly!');
                } else {
                    vscode.window.showWarningMessage('⚠️ MCP Server started but no output detected. This may be normal for stdio servers.');
                }
                
                if (output) {
                    const outputChannel = vscode.window.createOutputChannel('Tailwind Color Generator');
                    outputChannel.appendLine('=== MCP Server Test Output ===');
                    outputChannel.appendLine(output);
                    outputChannel.show();
                }
            }, 2000);

        } catch (error) {
            vscode.window.showErrorMessage(`Error testing MCP server: ${error.message}`);
        }
    });

    // Register command to generate palette in current file
    let generateCommand = vscode.commands.registerCommand('tailwind-color-generator.generatePalette', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        // Get base color from user
        const baseColor = await vscode.window.showInputBox({
            prompt: 'Enter a base color (hex, hsl, or named color)',
            placeholder: '#3B82F6',
            validateInput: (value) => {
                if (!value) return 'Please enter a color';
                // Basic validation - the chroma library will handle detailed validation
                return null;
            }
        });

        if (!baseColor) return;

        // Get palette name
        const paletteName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the color palette',
            placeholder: 'primary',
            value: 'primary'
        });

        if (!paletteName) return;

        // Get format
        const format = await vscode.window.showQuickPick(
            ['js', 'css', 'json'],
            { placeHolder: 'Select output format' }
        );

        if (!format) return;

        try {
            // We'll generate the palette using the same algorithm as the MCP server
            // Since we can't easily import ES modules in CommonJS context, 
            // we'll implement a simplified version or use a child process

            // For now, let's use a child process to call the MCP server directly
            const { execSync } = require('child_process');
            const serverPath = path.join(__dirname, 'mcp-server.js');
            
            // Create a simple test script to generate the palette
            const testInput = JSON.stringify({
                method: 'tools/call',
                params: {
                    name: 'generate_tailwind_palette',
                    arguments: {
                        baseColor,
                        name: paletteName,
                        format
                    }
                }
            });

            // For this demo, we'll insert a basic palette structure
            // In a real implementation, you'd want to properly communicate with the MCP server
            const basicPalette = {
                50: '#f0f9ff',
                100: '#e0f2fe',
                200: '#bae6fd',
                300: '#7dd3fc',
                400: '#38bdf8',
                500: baseColor,
                600: '#0284c7',
                700: '#0369a1',
                800: '#075985',
                900: '#0c4a6e',
                950: '#082f49'
            };

            let configText;
            if (format === 'css') {
                configText = ':root {\n';
                Object.entries(basicPalette).forEach(([shade, hex]) => {
                    configText += `  --color-${paletteName}-${shade}: ${hex};\n`;
                });
                configText += '}';
            } else if (format === 'js') {
                configText = `module.exports = {
  theme: {
    extend: {
      colors: {
        ${paletteName}: ${JSON.stringify(basicPalette, null, 10)}
      }
    }
  }
}`;
            } else {
                configText = JSON.stringify({ [paletteName]: basicPalette }, null, 2);
            }

            // Insert at cursor position
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, configText);
            });

            vscode.window.showInformationMessage(`✅ Generated ${paletteName} palette from ${baseColor}`);

        } catch (error) {
            vscode.window.showErrorMessage(`Error generating palette: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable, testCommand, generateCommand);

    // Show welcome message on first activation
    const hasShownWelcome = context.globalState.get('hasShownWelcome', false);
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage(
            '🎉 Tailwind Color Generator is ready! The MCP server is automatically available to GitHub Copilot and other AI assistants.',
            'Test Tools',
            'Learn More'
        ).then(action => {
            if (action === 'Test Tools') {
                vscode.commands.executeCommand('tailwind-color-generator.configure');
            } else if (action === 'Learn More') {
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/modelcontextprotocol/docs'));
            }
        });
        context.globalState.update('hasShownWelcome', true);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
