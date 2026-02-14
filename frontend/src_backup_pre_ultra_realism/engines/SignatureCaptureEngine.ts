/**
 * SignatureCaptureEngine - Real-Time Signature Drawing v1.0
 * 
 * Features:
 * - Canvas-based signature capture with pressure sensitivity
 * - Multiple pen styles (ballpoint, fountain, felt-tip)
 * - Ink colors (blue, black, red, green)
 * - Signature smoothing and anti-aliasing
 * - Save/Load signature as PNG/SVG
 * - Signature verification placeholder
 */

import { fabric } from 'fabric';

export interface SignatureConfig {
    penStyle: 'ballpoint' | 'fountain' | 'felt-tip' | 'marker';
    inkColor: string;
    strokeWidth: number;
    smoothing: number;
    pressureSensitivity: boolean;
}

export interface SignatureData {
    imageData: string;
    svgData?: string;
    timestamp: Date;
    dimensions: { width: number; height: number };
}

const DEFAULT_CONFIG: SignatureConfig = {
    penStyle: 'ballpoint',
    inkColor: '#000080', // Ink blue
    strokeWidth: 2,
    smoothing: 0.3,
    pressureSensitivity: true
};

const PEN_PROFILES = {
    ballpoint: { minWidth: 1, maxWidth: 2.5, opacity: 1, taper: 0.1 },
    fountain: { minWidth: 0.5, maxWidth: 4, opacity: 0.95, taper: 0.3 },
    'felt-tip': { minWidth: 2, maxWidth: 3, opacity: 0.9, taper: 0.05 },
    marker: { minWidth: 3, maxWidth: 5, opacity: 0.85, taper: 0 }
};

const INK_COLORS = {
    blue: '#000080',
    black: '#1a1a1a',
    red: '#8B0000',
    green: '#006400',
    purple: '#4B0082'
};

export class SignatureCaptureEngine {
    private canvas: fabric.Canvas | null = null;
    private config: SignatureConfig = DEFAULT_CONFIG;
    private isDrawing = false;
    private points: Array<{ x: number; y: number; pressure: number }> = [];
    private pathGroup: fabric.Group | null = null;

    constructor(canvasElement: HTMLCanvasElement, width: number = 400, height: number = 150) {
        this.canvas = new fabric.Canvas(canvasElement, {
            width,
            height,
            backgroundColor: '#ffffff',
            isDrawingMode: true,
            selection: false
        });

        this.setupDrawingBrush();
        this.setupEventListeners();
    }

    private setupDrawingBrush() {
        if (!this.canvas) return;

        const profile = PEN_PROFILES[this.config.penStyle];

        const brush = new fabric.PencilBrush(this.canvas);
        brush.color = this.config.inkColor;
        brush.width = this.config.strokeWidth;
        brush.strokeLineCap = 'round';
        brush.strokeLineJoin = 'round';

        this.canvas.freeDrawingBrush = brush;
    }

    private setupEventListeners() {
        if (!this.canvas) return;

        this.canvas.on('path:created', (e: any) => {
            const path = e.path;
            if (path) {
                // Apply smoothing
                this.smoothPath(path);
                // Apply ink effect
                this.applyInkEffect(path);
            }
        });
    }

    private smoothPath(path: fabric.Path) {
        if (!path.path) return;

        // Simplify path for smoother curves
        const simplifiedPath: any[] = [];
        const pathData = path.path;

        for (let i = 0; i < pathData.length; i++) {
            if (i % 2 === 0 || i === pathData.length - 1) {
                simplifiedPath.push(pathData[i]);
            }
        }

        path.set('path', simplifiedPath);
    }

    private applyInkEffect(path: fabric.Path) {
        const profile = PEN_PROFILES[this.config.penStyle];

        // Add subtle shadow for ink depth
        path.set({
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.1)',
                blur: 1,
                offsetX: 0.5,
                offsetY: 0.5
            }),
            opacity: profile.opacity,
            strokeLineCap: 'round',
            strokeLineJoin: 'round'
        });
    }

    // Set pen configuration
    setConfig(config: Partial<SignatureConfig>) {
        this.config = { ...this.config, ...config };
        this.setupDrawingBrush();
    }

    // Set ink color
    setInkColor(color: keyof typeof INK_COLORS | string) {
        const inkColor = INK_COLORS[color as keyof typeof INK_COLORS] || color;
        this.config.inkColor = inkColor;
        if (this.canvas?.freeDrawingBrush) {
            this.canvas.freeDrawingBrush.color = inkColor;
        }
    }

    // Set pen style
    setPenStyle(style: SignatureConfig['penStyle']) {
        this.config.penStyle = style;
        const profile = PEN_PROFILES[style];
        if (this.canvas?.freeDrawingBrush) {
            this.canvas.freeDrawingBrush.width = (profile.minWidth + profile.maxWidth) / 2;
        }
    }

    // Clear the signature
    clear() {
        this.canvas?.clear();
        this.canvas?.setBackgroundColor('#ffffff', () => this.canvas?.renderAll());
    }

    // Check if signature is empty
    isEmpty(): boolean {
        return (this.canvas?.getObjects().length || 0) === 0;
    }

    // Get signature as PNG data URL
    toDataURL(options?: { format?: string; quality?: number; multiplier?: number }): string {
        if (!this.canvas) return '';
        return this.canvas.toDataURL({
            format: options?.format || 'png',
            quality: options?.quality || 1,
            multiplier: options?.multiplier || 2
        });
    }

    // Get signature as SVG
    toSVG(): string {
        return this.canvas?.toSVG() || '';
    }

    // Export full signature data
    export(): SignatureData {
        return {
            imageData: this.toDataURL(),
            svgData: this.toSVG(),
            timestamp: new Date(),
            dimensions: {
                width: this.canvas?.width || 400,
                height: this.canvas?.height || 150
            }
        };
    }

    // Convert signature to Fabric image for check
    toFabricImage(callback: (img: fabric.Image) => void) {
        const dataUrl = this.toDataURL({ multiplier: 2 });
        fabric.Image.fromURL(dataUrl, (img) => {
            img.set({
                selectable: true,
                hasControls: true,
                hasBorders: true,
                name: 'signature'
            });
            callback(img);
        });
    }

    // Undo last stroke
    undo() {
        if (!this.canvas) return;
        const objects = this.canvas.getObjects();
        if (objects.length > 0) {
            this.canvas.remove(objects[objects.length - 1]);
            this.canvas.renderAll();
        }
    }

    // Dispose
    dispose() {
        this.canvas?.dispose();
        this.canvas = null;
    }

    // Static helper: Create signature from text (typed signature)
    static createTypedSignature(
        name: string,
        style: 'cursive' | 'script' | 'formal' = 'cursive',
        color: string = '#000080'
    ): fabric.Text {
        const fonts = {
            cursive: 'Brush Script MT, cursive',
            script: 'Lucida Handwriting, cursive',
            formal: 'Edwardian Script ITC, cursive'
        };

        return new fabric.Text(name, {
            fontFamily: fonts[style],
            fontSize: 32,
            fill: color,
            fontStyle: 'italic',
            selectable: true,
            name: 'typed-signature'
        });
    }

    // Static: Get available ink colors
    static getInkColors() {
        return INK_COLORS;
    }

    // Static: Get pen styles
    static getPenStyles() {
        return Object.keys(PEN_PROFILES);
    }
}
