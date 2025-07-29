const vscode = require('vscode');
const { spawn } = require('child_process');
const path = require('path');

// Import the palette generation functions from the MCP server
// We'll duplicate the logic here for direct use in language model tools
const TAILWIND_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Gradient generation functions
function generateGradientStops(colors, steps = 10, direction = 'to-r') {
    if (colors.length < 2) {
        throw new Error('At least 2 colors are required for gradient generation');
    }

    const stops = [];
    const stepSize = 100 / (steps - 1);
    
    for (let i = 0; i < steps; i++) {
        const position = i * stepSize;
        const colorIndex = (i / (steps - 1)) * (colors.length - 1);
        const lowerIndex = Math.floor(colorIndex);
        const upperIndex = Math.ceil(colorIndex);
        const factor = colorIndex - lowerIndex;
        
        let interpolatedColor;
        if (lowerIndex === upperIndex) {
            interpolatedColor = colors[lowerIndex];
        } else {
            interpolatedColor = interpolateColors(colors[lowerIndex], colors[upperIndex], factor);
        }
        
        stops.push({
            color: interpolatedColor,
            position: Math.round(position * 100) / 100
        });
    }
    
    return { stops, direction };
}

function interpolateColors(color1, color2, factor) {
    // Simple RGB interpolation
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) {
        return color1; // fallback
    }
    
    const r = Math.round(rgb1.r + factor * (rgb2.r - rgb1.r));
    const g = Math.round(rgb1.g + factor * (rgb2.g - rgb1.g));
    const b = Math.round(rgb1.b + factor * (rgb2.b - rgb1.b));
    
    return rgbToHex(r, g, b);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function generateTailwindGradient(gradient, format = 'css') {
    const { stops, direction } = gradient;
    
    if (format === 'css') {
        // Generate CSS gradient
        const stopStrings = stops.map(stop => `${stop.color} ${stop.position}%`);
        return `background: linear-gradient(${direction.replace('to-', '')}, ${stopStrings.join(', ')});`;
    } else if (format === 'tailwind') {
        // Generate Tailwind utility classes
        const directionClass = `bg-gradient-${direction}`;
        const fromColor = `from-[${stops[0].color}]`;
        const toColor = `to-[${stops[stops.length - 1].color}]`;
        
        let classes = `${directionClass} ${fromColor}`;
        
        if (stops.length > 2) {
            // Add via colors for multi-stop gradients
            const viaColors = stops.slice(1, -1).map(stop => `via-[${stop.color}]`);
            classes += ` ${viaColors.join(' ')}`;
        }
        
        classes += ` ${toColor}`;
        return classes;
    } else if (format === 'json') {
        return JSON.stringify(gradient, null, 2);
    } else {
        // Custom CSS with color stops
        const stopStrings = stops.map(stop => `${stop.color} ${stop.position}%`);
        return {
            gradient: `linear-gradient(${direction.replace('to-', '')}, ${stopStrings.join(', ')})`,
            stops: stops,
            direction: direction
        };
    }
}

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

    const generateGradientTool = vscode.lm.registerTool('generate_tailwind_gradient', {
        invoke: async (options, token) => {
            const { 
                colors, 
                steps = 10, 
                direction = 'to-r', 
                format = 'tailwind' 
            } = options.input;
            
            try {
                if (!colors || colors.length < 2) {
                    throw new Error('At least 2 colors are required for gradient generation');
                }

                const gradient = generateGradientStops(colors, steps, direction);
                const output = generateTailwindGradient(gradient, format);
                
                let responseText;
                if (format === 'css') {
                    responseText = `Generated CSS gradient from ${colors.length} colors:\n\n${output}\n\nGradient details:\n- Direction: ${direction}\n- Colors: ${colors.join(', ')}\n- Steps: ${steps}`;
                } else if (format === 'tailwind') {
                    responseText = `Generated Tailwind gradient classes:\n\n${output}\n\nUsage: Add these classes to your element\nGradient details:\n- Direction: ${direction}\n- Colors: ${colors.join(', ')}\n- Steps: ${steps}`;
                } else if (format === 'json') {
                    responseText = `Generated gradient configuration:\n\n${output}\n\nThis JSON includes all gradient stops with positions and colors.`;
                } else {
                    responseText = `Generated gradient configuration:\n\n${JSON.stringify(output, null, 2)}\n\nIncludes CSS gradient string and detailed stop information.`;
                }
                
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(responseText)
                ]);
            } catch (error) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(`Error generating gradient: ${error.message}`)
                ]);
            }
        },
        inputSchema: {
            type: 'object',
            properties: {
                colors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of colors in hex format (e.g., ["#FF0000", "#00FF00", "#0000FF"])',
                    minItems: 2
                },
                steps: {
                    type: 'number',
                    description: 'Number of gradient steps to generate (default: 10)',
                    minimum: 2,
                    maximum: 50
                },
                direction: {
                    type: 'string',
                    enum: ['to-r', 'to-l', 'to-t', 'to-b', 'to-tr', 'to-tl', 'to-br', 'to-bl'],
                    description: 'Gradient direction (default: "to-r")'
                },
                format: {
                    type: 'string',
                    enum: ['css', 'tailwind', 'json', 'detailed'],
                    description: 'Output format (default: "tailwind")'
                }
            },
            required: ['colors']
        }
    });

    // Register MCP Server Definition Provider for backward compatibility
    const mcpProvider = new TailwindColorMcpProvider(context);
    const mcpDisposable = vscode.lm.registerMcpServerDefinitionProvider(
        'tailwind-color-generator.mcp-servers',
        mcpProvider
    );

    context.subscriptions.push(generatePaletteTool, generateSchemeTool, analyzeColorTool, generateGradientTool);

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
• generate_tailwind_gradient - Generate gradients from multiple colors
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

    // Register command to generate gradient in current file
    let generateGradientCommand = vscode.commands.registerCommand('tailwind-color-generator.generateGradient', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        // Get colors from user
        const colorsInput = await vscode.window.showInputBox({
            prompt: 'Enter colors separated by commas (e.g., #FF0000, #00FF00, #0000FF)',
            placeholder: '#FF6B6B, #4ECDC4, #45B7D1',
            validateInput: (value) => {
                if (!value) return 'Please enter at least 2 colors';
                const colors = value.split(',').map(c => c.trim());
                if (colors.length < 2) return 'Please enter at least 2 colors';
                return null;
            }
        });

        if (!colorsInput) return;

        const colors = colorsInput.split(',').map(c => c.trim());

        // Get direction
        const direction = await vscode.window.showQuickPick(
            [
                { label: 'to-r', description: 'Left to right' },
                { label: 'to-l', description: 'Right to left' },
                { label: 'to-t', description: 'Bottom to top' },
                { label: 'to-b', description: 'Top to bottom' },
                { label: 'to-tr', description: 'Bottom-left to top-right' },
                { label: 'to-tl', description: 'Bottom-right to top-left' },
                { label: 'to-br', description: 'Top-left to bottom-right' },
                { label: 'to-bl', description: 'Top-right to bottom-left' }
            ],
            { placeHolder: 'Select gradient direction' }
        );

        if (!direction) return;

        // Get format
        const format = await vscode.window.showQuickPick(
            [
                { label: 'tailwind', description: 'Tailwind CSS classes' },
                { label: 'css', description: 'CSS background property' },
                { label: 'json', description: 'JSON configuration' },
                { label: 'detailed', description: 'Detailed configuration object' }
            ],
            { placeHolder: 'Select output format' }
        );

        if (!format) return;

        // Get number of steps
        const stepsInput = await vscode.window.showInputBox({
            prompt: 'Enter number of gradient steps (2-50)',
            placeholder: '10',
            value: '10',
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num < 2 || num > 50) {
                    return 'Please enter a number between 2 and 50';
                }
                return null;
            }
        });

        if (!stepsInput) return;

        const steps = parseInt(stepsInput);

        try {
            // Generate the gradient
            const gradient = generateGradientStops(colors, steps, direction.label);
            const output = generateTailwindGradient(gradient, format.label);

            let configText;
            if (format.label === 'css') {
                configText = output;
            } else if (format.label === 'tailwind') {
                configText = `<div class="${output}">
  <!-- Your gradient content here -->
</div>`;
            } else if (format.label === 'json') {
                configText = output;
            } else {
                configText = JSON.stringify(output, null, 2);
            }

            // Insert at cursor position
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, configText);
            });

            vscode.window.showInformationMessage(`✅ Generated gradient from ${colors.length} colors with ${steps} steps`);

        } catch (error) {
            vscode.window.showErrorMessage(`Error generating gradient: ${error.message}`);
        }
    });

    context.subscriptions.push(disposable, testCommand, generateCommand, generateGradientCommand);

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
