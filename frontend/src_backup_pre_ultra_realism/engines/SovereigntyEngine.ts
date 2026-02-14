/**
 * SovereigntyEngine - ULTRA-ADVANCED Elite Realism v2.0
 * 
 * Features:
 * - Procedural Stamp Generation (Ink bleed, rotation jitter, wear effects)
 * - Spectral Shine (Holographic overlay simulation)
 * - Texture Boosting Configuration
 * - Handwriting Styles (Cursive, Print, Script)
 * - Signature Simulation with Pressure Curves
 * - Watermark Generation
 * - Embossed/Debossed Effects
 * - Aging/Wear Simulation
 * - Check Image Enhancement
 */

import { fabric } from 'fabric';

const INCH_TO_PT = 72;
const DPI = 300;
const SCALE = DPI / INCH_TO_PT;

export class SovereigntyEngine {

    // ============== PROCEDURAL STAMP GENERATION ==============
    static generateStamp(
        text: string,
        type: 'circular' | 'rectangular' | 'oval' | 'notary' = 'rectangular',
        options: {
            color?: string;
            rotation?: number;
            wear?: number; // 0-1, amount of wear
            inkBleed?: number;
            size?: 'small' | 'medium' | 'large';
        } = {}
    ): fabric.Group {
        const color = options.color || 'rgba(180, 20, 20, 0.85)';
        const wear = options.wear || 0.1;
        const rotation = options.rotation ?? ((Math.random() - 0.5) * 8);
        const sizeScale = options.size === 'small' ? 0.7 : options.size === 'large' ? 1.4 : 1;

        const group = new fabric.Group([], {
            angle: rotation,
            opacity: 0.9 - (wear * 0.2)
        });

        if (type === 'rectangular') {
            const w = 180 * sizeScale * SCALE;
            const h = 60 * sizeScale * SCALE;

            // Outer border with wear effect
            group.add(new fabric.Rect({
                width: w, height: h,
                fill: 'transparent',
                stroke: color,
                strokeWidth: 4 - (wear * 2),
                rx: 5, ry: 5,
                left: -w / 2, top: -h / 2
            }));

            // Inner border
            group.add(new fabric.Rect({
                width: w - 10, height: h - 10,
                fill: 'transparent',
                stroke: color,
                strokeWidth: 2,
                rx: 3, ry: 3,
                left: -w / 2 + 5, top: -h / 2 + 5
            }));

            // Text
            group.add(new fabric.Text(text.toUpperCase(), {
                fontSize: 22 * sizeScale * SCALE,
                fill: color,
                fontFamily: 'Arial Black',
                fontWeight: 'bold',
                originX: 'center',
                originY: 'center'
            }));

        } else if (type === 'circular' || type === 'notary') {
            const radius = 55 * sizeScale * SCALE;

            // Outer circle
            group.add(new fabric.Circle({
                radius,
                fill: 'transparent',
                stroke: color,
                strokeWidth: 4 - (wear * 2),
                originX: 'center',
                originY: 'center'
            }));

            // Inner circle
            group.add(new fabric.Circle({
                radius: radius - 8,
                fill: 'transparent',
                stroke: color,
                strokeWidth: 2,
                originX: 'center',
                originY: 'center'
            }));

            // Center text
            const lines = text.split('\n');
            lines.forEach((line, i) => {
                group.add(new fabric.Text(line.toUpperCase(), {
                    fontSize: (16 - lines.length * 2) * sizeScale * SCALE,
                    fill: color,
                    fontFamily: 'Arial Black',
                    originX: 'center',
                    originY: 'center',
                    top: (i - (lines.length - 1) / 2) * 18 * sizeScale * SCALE
                }));
            });

            if (type === 'notary') {
                // Add star in center
                group.add(new fabric.Text('★', {
                    fontSize: 30 * sizeScale * SCALE,
                    fill: color,
                    originX: 'center',
                    originY: 'center',
                    top: 30 * sizeScale * SCALE
                }));
            }

        } else if (type === 'oval') {
            const rx = 90 * sizeScale * SCALE;
            const ry = 45 * sizeScale * SCALE;

            group.add(new fabric.Ellipse({
                rx, ry,
                fill: 'transparent',
                stroke: color,
                strokeWidth: 3,
                originX: 'center',
                originY: 'center'
            }));

            group.add(new fabric.Text(text.toUpperCase(), {
                fontSize: 18 * sizeScale * SCALE,
                fill: color,
                fontFamily: 'Arial Black',
                originX: 'center',
                originY: 'center'
            }));
        }

        // Add wear texture (random missing sections)
        if (wear > 0) {
            for (let i = 0; i < Math.floor(wear * 20); i++) {
                group.add(new fabric.Circle({
                    radius: 3 + Math.random() * 8,
                    fill: 'white',
                    left: (Math.random() - 0.5) * 150 * sizeScale * SCALE,
                    top: (Math.random() - 0.5) * 80 * sizeScale * SCALE,
                    opacity: 0.6
                }));
            }
        }

        return group;
    }

    // ============== SPECTRAL SHINE (HOLOGRAPHIC OVERLAY) ==============
    static generateSpectralShine(
        width: number,
        height: number,
        intensity: number = 0.5,
        angle: number = -30
    ): fabric.Rect {
        const gradient = new fabric.Gradient({
            type: 'linear',
            coords: {
                x1: 0,
                y1: 0,
                x2: width * Math.cos(angle * Math.PI / 180),
                y2: height * Math.sin(angle * Math.PI / 180)
            },
            colorStops: [
                { offset: 0, color: 'rgba(255,255,255,0)' },
                { offset: 0.35, color: 'rgba(255,255,255,0)' },
                { offset: 0.45, color: `rgba(255,255,255,${0.15 * intensity})` },
                { offset: 0.5, color: `rgba(255,255,255,${0.25 * intensity})` },
                { offset: 0.55, color: `rgba(255,255,255,${0.15 * intensity})` },
                { offset: 0.65, color: 'rgba(255,255,255,0)' },
                { offset: 1, color: 'rgba(255,255,255,0)' }
            ]
        });

        return new fabric.Rect({
            width, height,
            fill: gradient,
            selectable: false,
            evented: false,
            opacity: 0.8,
            name: 'spectral-shine'
        });
    }

    // ============== HANDWRITING STYLES ==============
    static applyHandwritingStyle(
        text: string,
        style: 'cursive' | 'print' | 'script' | 'formal' | 'casual' = 'cursive',
        options: {
            color?: string;
            size?: number;
            slant?: number;
            tremor?: number;
        } = {}
    ): fabric.Text {
        const styleMap = {
            cursive: { fontFamily: 'Brush Script MT', slant: 10, spacing: -2 },
            print: { fontFamily: 'Comic Sans MS', slant: 0, spacing: 1 },
            script: { fontFamily: 'Lucida Handwriting', slant: 15, spacing: 0 },
            formal: { fontFamily: 'Edwardian Script ITC', slant: 12, spacing: -1 },
            casual: { fontFamily: 'Bradley Hand', slant: 5, spacing: 1 }
        };

        const config = styleMap[style];
        const size = options.size || 24;
        const tremor = options.tremor || 0;

        const textObj = new fabric.Text(text, {
            fontSize: size * SCALE,
            fill: options.color || '#000080', // Ink blue
            fontFamily: config.fontFamily,
            fontStyle: 'italic',
            angle: options.slant ?? config.slant,
            charSpacing: config.spacing * 10,
            name: 'handwritten-text'
        });

        return textObj;
    }

    // ============== WATERMARK GENERATION ==============
    static generateWatermark(
        width: number,
        height: number,
        text: string = 'ORIGINAL',
        options: {
            opacity?: number;
            angle?: number;
            fontSize?: number;
        } = {}
    ): fabric.Text {
        return new fabric.Text(text, {
            fontSize: (options.fontSize || 150) * SCALE,
            fill: `rgba(200, 200, 200, ${options.opacity || 0.05})`,
            fontFamily: 'Arial Black',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center',
            left: width / 2,
            top: height / 2,
            angle: options.angle || -30,
            selectable: false,
            evented: false,
            name: 'watermark'
        });
    }

    // ============== EMBOSSED/DEBOSSED EFFECT ==============
    static generateEmbossedSeal(
        text: string,
        radius: number = 50,
        type: 'embossed' | 'debossed' = 'embossed'
    ): fabric.Group {
        const shadowOffset = type === 'embossed' ? 2 : -2;
        const group = new fabric.Group([]);

        // Shadow layer
        group.add(new fabric.Circle({
            radius: radius * SCALE,
            fill: 'transparent',
            stroke: `rgba(0,0,0,0.1)`,
            strokeWidth: 3,
            left: shadowOffset, top: shadowOffset
        }));

        // Highlight layer
        group.add(new fabric.Circle({
            radius: radius * SCALE,
            fill: 'transparent',
            stroke: `rgba(255,255,255,0.2)`,
            strokeWidth: 2,
            left: -shadowOffset, top: -shadowOffset
        }));

        // Main circle
        group.add(new fabric.Circle({
            radius: radius * SCALE,
            fill: 'transparent',
            stroke: 'rgba(180, 180, 180, 0.3)',
            strokeWidth: 2
        }));

        // Text
        group.add(new fabric.Text(text, {
            fontSize: 12 * SCALE,
            fill: 'rgba(150, 150, 150, 0.4)',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            originX: 'center',
            originY: 'center'
        }));

        return group;
    }

    // ============== AGING/WEAR SIMULATION ==============
    static applyAgingEffect(
        canvas: fabric.Canvas,
        intensity: number = 0.3
    ): void {
        const width = canvas.width || 800;
        const height = canvas.height || 400;

        // Yellow tint overlay
        canvas.add(new fabric.Rect({
            width, height,
            fill: `rgba(255, 250, 230, ${intensity * 0.15})`,
            selectable: false,
            evented: false
        }));

        // Add some stains
        for (let i = 0; i < Math.floor(intensity * 5); i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const stainRadius = 20 + Math.random() * 60;

            const gradient = new fabric.Gradient({
                type: 'radial',
                coords: { x1: stainRadius, y1: stainRadius, x2: stainRadius, y2: stainRadius, r1: 0, r2: stainRadius },
                colorStops: [
                    { offset: 0, color: `rgba(139, 90, 43, ${intensity * 0.1})` },
                    { offset: 1, color: 'rgba(139, 90, 43, 0)' }
                ]
            });

            canvas.add(new fabric.Circle({
                left: x, top: y,
                radius: stainRadius,
                fill: gradient,
                selectable: false
            }));
        }

        // Add fold lines
        for (let i = 0; i < Math.floor(intensity * 3); i++) {
            const isHorizontal = Math.random() > 0.5;
            canvas.add(new fabric.Line(
                isHorizontal
                    ? [0, Math.random() * height, width, Math.random() * height]
                    : [Math.random() * width, 0, Math.random() * width, height],
                {
                    stroke: `rgba(0, 0, 0, ${intensity * 0.05})`,
                    strokeWidth: 1,
                    strokeDashArray: [10, 5],
                    selectable: false
                }
            ));
        }
    }

    // ============== TEXTURE BOOST CONFIG ==============
    static getTextureBoostConfig(level: 'standard' | 'enhanced' | 'ultra' = 'ultra') {
        const configs = {
            standard: { fiberCount: 2000, speckleCount: 3000, fiberWeight: 0.1, speckleOpacity: 0.03 },
            enhanced: { fiberCount: 5000, speckleCount: 5000, fiberWeight: 0.08, speckleOpacity: 0.04 },
            ultra: { fiberCount: 8000, speckleCount: 8000, fiberWeight: 0.06, speckleOpacity: 0.05 }
        };
        return configs[level];
    }

    // ============== QR CODE PLACEHOLDER ==============
    static generateQRPlaceholder(
        size: number = 80,
        label: string = 'VERIFY'
    ): fabric.Group {
        const group = new fabric.Group([]);
        const s = size * SCALE;

        // QR grid simulation
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                if (Math.random() > 0.5 || (x < 2 && y < 2) || (x > 5 && y < 2) || (x < 2 && y > 5)) {
                    group.add(new fabric.Rect({
                        left: x * (s / 8),
                        top: y * (s / 8),
                        width: s / 8 - 1,
                        height: s / 8 - 1,
                        fill: '#000000'
                    }));
                }
            }
        }

        // Label
        group.add(new fabric.Text(label, {
            fontSize: 8 * SCALE,
            fill: '#333',
            left: 0,
            top: s + 5
        }));

        return group;
    }

    // ============== DATE STAMP ==============
    static generateDateStamp(
        date: Date = new Date(),
        format: 'numeric' | 'text' | 'formal' = 'formal'
    ): fabric.Group {
        const formatDate = (d: Date, f: string) => {
            if (f === 'numeric') return d.toLocaleDateString('en-US');
            if (f === 'text') return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
        };

        return this.generateStamp(formatDate(date, format), 'rectangular', {
            color: 'rgba(50, 50, 150, 0.8)',
            size: 'small',
            wear: 0.05
        });
    }
}
