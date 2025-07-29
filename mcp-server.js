#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import chroma from 'chroma-js';

// Tailwind's standard shade structure
const TAILWIND_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// Generate a complete Tailwind-compatible color palette from a base color
function generateTailwindPalette(baseColor, name = 'primary') {
    const base = chroma(baseColor);
    const palette = {};

    TAILWIND_SHADES.forEach(shade => {
        let color;
        if (shade <= 500) {
            const ratio = (500 - shade) / 450;
            const lightness = base.get('hsl.l') + (0.95 - base.get('hsl.l')) * ratio;
            const saturation = Math.max(0.1, base.get('hsl.s') * (1 - ratio * 0.7));
            color = chroma.hsl(base.get('hsl.h'), saturation, lightness);
        } else {
            const ratio = (shade - 500) / 450;
            const lightness = base.get('hsl.l') * (1 - ratio * 0.85);
            const saturation = Math.min(1, base.get('hsl.s') * (1 + ratio * 0.2));
            color = chroma.hsl(base.get('hsl.h'), saturation, lightness);
        }
        palette[shade] = color.hex();
    });

    return { name, palette };
}

// Generate Tailwind config format
function generateTailwindConfig(palettes, format = 'js') {
    const colors = {};
    palettes.forEach(({ name, palette }) => {
        colors[name] = palette;
    });

    if (format === 'css') {
        let css = ':root {\\n';
        Object.entries(colors).forEach(([colorName, shades]) => {
            Object.entries(shades).forEach(([shade, hex]) => {
                css += `  --color-${colorName}-${shade}: ${hex};\\n`;
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

const server = new Server(
    {
        name: 'tailwind-color-generator',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'generate_tailwind_palette',
                description: 'Generate a Tailwind-compatible color palette from a base color',
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
                },
            },
            {
                name: 'generate_color_scheme',
                description: 'Generate a complete color scheme with multiple palettes using predefined strategies',
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
                },
            },
            {
                name: 'analyze_color',
                description: 'Analyze a color and provide detailed information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        color: {
                            type: 'string',
                            description: 'Color to analyze in hex, hsl, or named format',
                        },
                    },
                    required: ['color'],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        if (name === 'generate_tailwind_palette') {
            const { baseColor, name: paletteName = 'primary', format = 'js' } = args;
            const palette = generateTailwindPalette(baseColor, paletteName);
            const config = generateTailwindConfig([palette], format);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Generated Tailwind palette for "${paletteName}" from base color "${baseColor}":

${config}

Palette details:
${Object.entries(palette.palette).map(([shade, hex]) => `- ${paletteName}-${shade}: ${hex}`).join('\\n')}`,
                    },
                ],
            };
        }

        if (name === 'generate_color_scheme') {
            const {
                strategy,
                baseHue = Math.random() * 360,
                colorNames = ['primary', 'secondary', 'accent'],
                format = 'js'
            } = args;

            // Define color strategies
            const strategies = {
                complementary: (hue) => [
                    chroma.hsl(hue, 0.8, 0.6),
                    chroma.hsl(hue + 180, 0.8, 0.6),
                    chroma.hsl(hue + 90, 0.7, 0.5),
                ],
                analogous: (hue) => [
                    chroma.hsl(hue, 0.8, 0.6),
                    chroma.hsl(hue + 30, 0.8, 0.6),
                    chroma.hsl(hue - 30, 0.8, 0.6),
                ],
                monochromatic: (hue) => [
                    chroma.hsl(hue, 0.8, 0.6),
                    chroma.hsl(hue, 0.6, 0.5),
                    chroma.hsl(hue, 0.9, 0.7),
                ],
                triadic: (hue) => [
                    chroma.hsl(hue, 0.8, 0.6),
                    chroma.hsl(hue + 120, 0.8, 0.6),
                    chroma.hsl(hue + 240, 0.8, 0.6),
                ],
            };

            const baseColors = strategies[strategy](baseHue);
            const palettes = baseColors.map((color, index) => {
                const name = colorNames[index] || `color${index + 1}`;
                return generateTailwindPalette(color.hex(), name);
            });

            const config = generateTailwindConfig(palettes, format);

            return {
                content: [
                    {
                        type: 'text',
                        text: `Generated ${strategy} color scheme (base hue: ${Math.round(baseHue)}°):

${config}

Color breakdown:
${palettes.map(p => `- ${p.name}: ${Object.entries(p.palette).map(([shade, hex]) => `${shade}(${hex})`).join(', ')}`).join('\\n')}`,
                    },
                ],
            };
        }

        if (name === 'analyze_color') {
            const { color } = args;
            const chromaColor = chroma(color);

            const hsl = chromaColor.hsl();
            const rgb = chromaColor.rgb();
            const hex = chromaColor.hex();
            const luminance = chromaColor.luminance();

            return {
                content: [
                    {
                        type: 'text',
                        text: `Color Analysis for "${color}":

Format conversions:
- Hex: ${hex}
- RGB: rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})
- HSL: hsl(${Math.round(hsl[0] || 0)}, ${Math.round(hsl[1] * 100)}%, ${Math.round(hsl[2] * 100)}%)

Properties:
- Luminance: ${luminance.toFixed(3)}
- Temperature: ${chromaColor.temperature()}K
- Brightness: ${Math.round(chromaColor.get('hsl.l') * 100)}%
- Saturation: ${Math.round(chromaColor.get('hsl.s') * 100)}%

Accessibility:
- Contrast with white: ${chroma.contrast(chromaColor, 'white').toFixed(2)}
- Contrast with black: ${chroma.contrast(chromaColor, 'black').toFixed(2)}
- Recommended text color: ${chroma.contrast(chromaColor, 'white') > 4.5 ? 'white' : 'black'}`,
                    },
                ],
            };
        }

        throw new Error(`Unknown tool: ${name}`);
    } catch (error) {
        throw new Error(`Error executing ${name}: ${error.message}`);
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Tailwind Color Generator MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
