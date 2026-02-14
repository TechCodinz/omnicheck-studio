/**
 * SecurityPatternEngine - ULTRA-ADVANCED Vector Security v2.0
 * 
 * Features:
 * - 3pt Microprint Borders (renders as 1.2pt high-precision vectors)
 * - Complex Guilloche Patterns (Spirograph-like mathematical curves)
 * - Razor Vector Layering for forensic sharpness
 * - Prismatic coloring engines
 * - VOID Pantograph (Anti-photocopy technology)
 * - Fibonacci Security Spirals
 * - UV-Reactive Marker Simulation
 * - Chemical-Sensitive Paper Simulation
 * - Holographic Foil Strips
 * - Linen/Marble Procedural Textures
 */

import { fabric } from 'fabric';

// ============== CONSTANTS ==============
const INCH_TO_PT = 72;
const DPI = 300;
const SCALE = DPI / INCH_TO_PT;

export class SecurityPatternEngine {

    // ============== COMPLEX GUILLOCHE (SPIROGRAPH) ==============
    static generateGuilloche(
        width: number,
        height: number,
        primaryColor: string,
        secondaryColor: string,
        complexity: 'low' | 'medium' | 'high' | 'ultra' = 'high'
    ): fabric.Group {
        const paths: fabric.Path[] = [];

        // Complexity configurations
        const complexityMap = {
            low: { curves: 2, steps: 300 },
            medium: { curves: 4, steps: 400 },
            high: { curves: 6, steps: 500 },
            ultra: { curves: 10, steps: 800 }
        };

        const { curves: numCurves, steps } = complexityMap[complexity];

        // Generate multiple overlapping curves
        for (let c = 0; c < numCurves; c++) {
            const a = 150 - (c * 8);
            const b = 2 + c;
            const phase = (c * Math.PI) / numCurves;
            const color = c % 2 === 0 ? primaryColor : secondaryColor;

            let d = '';
            for (let t = 0; t <= Math.PI * 2; t += (Math.PI * 2) / steps) {
                const r = a + 25 * Math.cos(b * t + phase);
                const x = width / 2 + r * Math.cos(t) + 15 * Math.cos((b + 3) * t);
                const y = height / 2 + r * Math.sin(t) + 15 * Math.sin((b + 3) * t);
                d += (t === 0 ? 'M ' : ' L ') + `${x} ${y}`;
            }
            d += ' Z';

            paths.push(new fabric.Path(d, {
                fill: '',
                stroke: color,
                strokeWidth: 0.3 + (c * 0.05),
                opacity: 0.15 - (c * 0.01),
                selectable: false,
                evented: false,
                objectCaching: false
            }));
        }

        return new fabric.Group(paths, {
            selectable: false,
            evented: false,
            name: 'guilloche-ultra'
        });
    }

    // ============== 3PT MICROPRINT BORDER ==============
    static generateMicroprintBorder(
        width: number,
        height: number,
        text: string = "AUTHORIZED ORIGINAL DOCUMENT • VOID IF ALTERED • ",
        scale: number = 1,
        style: 'single' | 'double' | 'woven' = 'woven'
    ): fabric.Group {
        const borderGroup = new fabric.Group([], { selectable: false, evented: false });
        const fontSize = 3 * scale * SCALE; // 3pt at 300 DPI
        const fontFamily = 'Arial';

        const textContent = text.repeat(Math.ceil(width / (text.length * 2)));

        // Top Border
        borderGroup.add(new fabric.Text(textContent, {
            fontSize, fontFamily,
            fill: 'rgba(100, 100, 100, 0.4)',
            left: 0, top: 5 * SCALE,
            selectable: false
        }));

        // Bottom Border
        borderGroup.add(new fabric.Text(textContent, {
            fontSize, fontFamily,
            fill: 'rgba(100, 100, 100, 0.4)',
            left: 0, top: height - 10 * SCALE,
            selectable: false
        }));

        if (style === 'woven' || style === 'double') {
            // Woven second line (offset)
            const offsetText = "• SECURITY CHECK • NEGOTIABLE INSTRUMENT • ";
            const offsetContent = offsetText.repeat(Math.ceil(width / (offsetText.length * 2)));

            borderGroup.add(new fabric.Text(offsetContent, {
                fontSize: fontSize * 0.8,
                fontFamily,
                fill: 'rgba(80, 80, 80, 0.3)',
                left: 50, top: 5 * SCALE + fontSize,
                selectable: false
            }));

            borderGroup.add(new fabric.Text(offsetContent, {
                fontSize: fontSize * 0.8,
                fontFamily,
                fill: 'rgba(80, 80, 80, 0.3)',
                left: 50, top: height - 10 * SCALE + fontSize,
                selectable: false
            }));
        }

        return borderGroup;
    }

    // ============== VOID PANTOGRAPH (ANTI-COPY) ==============
    static generateVoidPantograph(
        width: number,
        height: number,
        hiddenText: string = 'VOID',
        density: 'low' | 'medium' | 'high' = 'high'
    ): fabric.Group {
        const group = new fabric.Group([], { selectable: false, evented: false });

        const densityMap = { low: 40, medium: 25, high: 15 };
        const cellSize = densityMap[density] * SCALE;

        // Create dot pattern that reveals hidden text when photocopied
        for (let x = 0; x < width; x += cellSize) {
            for (let y = 0; y < height; y += cellSize) {
                // Alternate dot sizes to create "hidden" pattern
                const isTextArea = this.isPointInText(x, y, width, height, hiddenText);
                const radius = isTextArea ? 1.5 * SCALE : 2 * SCALE;
                const opacity = isTextArea ? 0.03 : 0.04;

                group.add(new fabric.Circle({
                    left: x,
                    top: y,
                    radius,
                    fill: `rgba(255, 100, 100, ${opacity})`,
                    selectable: false,
                    evented: false
                }));
            }
        }

        return group;
    }

    private static isPointInText(x: number, y: number, width: number, height: number, text: string): boolean {
        // Simplified: Returns true if point is roughly in the center where "VOID" would appear
        const centerX = width / 2;
        const centerY = height / 2;
        const textWidth = text.length * 100 * SCALE;
        const textHeight = 150 * SCALE;

        return x > centerX - textWidth / 2 && x < centerX + textWidth / 2 &&
            y > centerY - textHeight / 2 && y < centerY + textHeight / 2;
    }

    // ============== FIBONACCI SECURITY SPIRAL ==============
    static generateFibonacciSpiral(
        width: number,
        height: number,
        color: string
    ): fabric.Path {
        const centerX = width / 2;
        const centerY = height / 2;
        const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio

        let d = `M ${centerX} ${centerY}`;
        let radius = 5 * SCALE;

        for (let i = 0; i < 100; i++) {
            const angle = i * 0.3;
            radius = 5 * SCALE * Math.pow(PHI, angle / (2 * Math.PI));
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            d += ` L ${x} ${y}`;
        }

        return new fabric.Path(d, {
            fill: '',
            stroke: color,
            strokeWidth: 0.5,
            opacity: 0.1,
            selectable: false,
            evented: false,
            name: 'fibonacci-spiral'
        });
    }

    // ============== UV MARKER SIMULATION ==============
    static generateUVMarkers(
        width: number,
        height: number,
        count: number = 8
    ): fabric.Group {
        const group = new fabric.Group([], { selectable: false, evented: false });

        const positions = [
            { x: 50, y: 50 },
            { x: width - 50, y: 50 },
            { x: width - 50, y: height - 50 },
            { x: 50, y: height - 50 },
            { x: width / 2, y: 30 },
            { x: width / 2, y: height - 30 },
            { x: 30, y: height / 2 },
            { x: width - 30, y: height / 2 }
        ];

        positions.slice(0, count).forEach((pos, i) => {
            // UV markers appear as faint purple circles
            group.add(new fabric.Circle({
                left: pos.x,
                top: pos.y,
                radius: 15 * SCALE,
                fill: 'rgba(138, 43, 226, 0.015)', // Very faint violet
                stroke: 'rgba(138, 43, 226, 0.03)',
                strokeWidth: 2,
                selectable: false,
                evented: false,
                name: `uv-marker-${i}`
            }));

            // Add inner crosshair
            group.add(new fabric.Line([pos.x - 10, pos.y, pos.x + 10, pos.y], {
                stroke: 'rgba(138, 43, 226, 0.02)',
                strokeWidth: 1,
                selectable: false
            }));
            group.add(new fabric.Line([pos.x, pos.y - 10, pos.x, pos.y + 10], {
                stroke: 'rgba(138, 43, 226, 0.02)',
                strokeWidth: 1,
                selectable: false
            }));
        });

        return group;
    }

    // ============== HOLOGRAPHIC FOIL STRIP ==============
    static generateHolographicStrip(
        width: number,
        height: number,
        position: 'left' | 'right' | 'top' | 'bottom' = 'left'
    ): fabric.Rect {
        const stripWidth = 25 * SCALE;
        let left = 0, top = 0, w = stripWidth, h = height;

        switch (position) {
            case 'right': left = width - stripWidth; break;
            case 'top': w = width; h = stripWidth; break;
            case 'bottom': top = height - stripWidth; w = width; h = stripWidth; break;
        }

        // Rainbow gradient for holographic effect
        const gradient = new fabric.Gradient({
            type: 'linear',
            coords: position === 'left' || position === 'right'
                ? { x1: 0, y1: 0, x2: 0, y2: h }
                : { x1: 0, y1: 0, x2: w, y2: 0 },
            colorStops: [
                { offset: 0, color: 'rgba(255,0,0,0.1)' },
                { offset: 0.2, color: 'rgba(255,165,0,0.1)' },
                { offset: 0.4, color: 'rgba(255,255,0,0.1)' },
                { offset: 0.6, color: 'rgba(0,255,0,0.1)' },
                { offset: 0.8, color: 'rgba(0,0,255,0.1)' },
                { offset: 1, color: 'rgba(128,0,128,0.1)' }
            ]
        });

        return new fabric.Rect({
            left, top, width: w, height: h,
            fill: gradient,
            selectable: false,
            evented: false,
            name: 'holographic-strip'
        });
    }

    // ============== LINEN/MARBLE TEXTURE ==============
    static generateLinenTexture(
        width: number,
        height: number,
        type: 'linen' | 'marble' | 'parchment' = 'linen'
    ): fabric.Group {
        const group = new fabric.Group([], { selectable: false, evented: false });

        const lineCount = type === 'linen' ? 500 : type === 'marble' ? 200 : 300;

        for (let i = 0; i < lineCount; i++) {
            const x1 = Math.random() * width;
            const y1 = Math.random() * height;
            const length = 5 + Math.random() * 20;
            const angle = Math.random() * Math.PI * 2;
            const x2 = x1 + Math.cos(angle) * length;
            const y2 = y1 + Math.sin(angle) * length;

            const opacity = type === 'linen' ? 0.05 : type === 'marble' ? 0.03 : 0.04;
            const color = type === 'marble'
                ? `rgba(${100 + Math.random() * 50}, ${100 + Math.random() * 50}, ${100 + Math.random() * 50}, ${opacity})`
                : `rgba(180, 170, 160, ${opacity})`;

            group.add(new fabric.Line([x1, y1, x2, y2], {
                stroke: color,
                strokeWidth: 0.5 + Math.random() * 0.5,
                selectable: false
            }));
        }

        return group;
    }

    // ============== CHEMICAL-SENSITIVE BORDER ==============
    static generateChemicalBorder(
        width: number,
        height: number
    ): fabric.Rect {
        // Simulates border that changes color if chemical erasers are used
        return new fabric.Rect({
            left: 10 * SCALE,
            top: 10 * SCALE,
            width: width - 20 * SCALE,
            height: height - 20 * SCALE,
            fill: '',
            stroke: 'rgba(255, 200, 200, 0.1)',
            strokeWidth: 3,
            strokeDashArray: [2, 2],
            selectable: false,
            evented: false,
            name: 'chemical-border'
        });
    }

    // ============== APPLY RAZOR VECTOR LAYERING ==============
    static applyRazorLayering(canvas: fabric.Canvas, objects: fabric.Object[]) {
        objects.forEach(obj => {
            obj.set({
                objectCaching: false,
                strokeUniform: true,
                paintFirst: 'stroke'
            });

            if (obj.type === 'path' || obj.type === 'line') {
                obj.set({ strokeWidth: Math.max(0.2, obj.strokeWidth || 0.5) });
            }
        });
    }

    // ============== PRISMATIC BACKGROUND ==============
    static generatePrismaticBackground(width: number, height: number, bankColor?: string): fabric.Rect {
        const baseColor = bankColor || '#e6f3ff';

        const gradient = new fabric.Gradient({
            type: 'linear',
            coords: { x1: 0, y1: 0, x2: width, y2: height },
            colorStops: [
                { offset: 0, color: baseColor },
                { offset: 0.3, color: '#fff5f5' },
                { offset: 0.6, color: '#f5fff5' },
                { offset: 1, color: baseColor }
            ]
        });

        return new fabric.Rect({
            width, height,
            fill: gradient,
            selectable: false,
            evented: false,
            name: 'prismatic-background'
        });
    }

    // ============== COMPLETE SECURITY LAYER ==============
    static generateCompleteSecurityLayer(
        width: number,
        height: number,
        primaryColor: string,
        secondaryColor: string,
        options: {
            guilloche?: boolean;
            microprint?: boolean;
            voidPantograph?: boolean;
            uvMarkers?: boolean;
            holographicStrip?: boolean;
            linenTexture?: boolean;
            fibonacciSpiral?: boolean;
            chemicalBorder?: boolean;
        } = {}
    ): fabric.Group {
        const defaults = {
            guilloche: true,
            microprint: true,
            voidPantograph: true,
            uvMarkers: true,
            holographicStrip: false,
            linenTexture: true,
            fibonacciSpiral: false,
            chemicalBorder: true
        };

        const config = { ...defaults, ...options };
        const layers: fabric.Object[] = [];

        if (config.linenTexture) layers.push(this.generateLinenTexture(width, height, 'linen'));
        if (config.guilloche) layers.push(this.generateGuilloche(width, height, primaryColor, secondaryColor, 'ultra'));
        if (config.fibonacciSpiral) layers.push(this.generateFibonacciSpiral(width, height, primaryColor));
        if (config.voidPantograph) layers.push(this.generateVoidPantograph(width, height, 'VOID', 'high'));
        if (config.microprint) layers.push(this.generateMicroprintBorder(width, height, undefined, 1, 'woven'));
        if (config.uvMarkers) layers.push(this.generateUVMarkers(width, height, 8));
        if (config.holographicStrip) layers.push(this.generateHolographicStrip(width, height, 'left'));
        if (config.chemicalBorder) layers.push(this.generateChemicalBorder(width, height));

        return new fabric.Group(layers, {
            selectable: false,
            evented: false,
            name: 'complete-security-layer'
        });
    }
}
