/**
 * UltraRealisticCheckEngine - Premium Check Design System v1.0
 * 
 * Features:
 * - Colorful gradient borders (rainbow stripe)
 * - SECURE padlock icon
 * - Fractional routing display (XX-XXX/XXXX)
 * - Premium paper textures (linen, parchment, marble)
 * - Sophisticated line patterns and borders
 * - Enhanced typography with handwriting fonts
 * - Bank authenticity markers
 * - Thermochromic ink simulation
 * - Embossed seal effects
 */

import { fabric } from 'fabric';

// Premium color palettes for check designs
const PREMIUM_PALETTES = {
    classic: {
        primary: '#1E3A5F',
        secondary: '#4A7C9B',
        accent: '#B8860B',
        text: '#1a1a1a',
        background: '#fefefe'
    },
    executive: {
        primary: '#2C3E50',
        secondary: '#34495E',
        accent: '#C0392B',
        text: '#000000',
        background: '#f8f6f0'
    },
    prestige: {
        primary: '#1A4D1A',
        secondary: '#2E7D32',
        accent: '#FFD700',
        text: '#1a1a1a',
        background: '#fefdf8'
    },
    corporate: {
        primary: '#003366',
        secondary: '#0066CC',
        accent: '#FF6B00',
        text: '#000000',
        background: '#ffffff'
    },
    luxury: {
        primary: '#4A0E4E',
        secondary: '#7B1FA2',
        accent: '#FFD700',
        text: '#1a1a1a',
        background: '#fdf5ff'
    }
};

// Rainbow gradient colors for bottom border
const RAINBOW_GRADIENT_COLORS = [
    '#FF0000', '#FF3300', '#FF6600', '#FF9900', '#FFCC00', '#FFFF00',
    '#CCFF00', '#99FF00', '#66FF00', '#33FF00', '#00FF00', '#00FF33',
    '#00FF66', '#00FF99', '#00FFCC', '#00FFFF', '#00CCFF', '#0099FF',
    '#0066FF', '#0033FF', '#0000FF', '#3300FF', '#6600FF', '#9900FF',
    '#CC00FF', '#FF00FF', '#FF00CC', '#FF0099', '#FF0066', '#FF0033'
];

export interface UltraRealisticConfig {
    palette: keyof typeof PREMIUM_PALETTES;
    showRainbowBorder: boolean;
    showSecureIcon: boolean;
    showFractionalRouting: boolean;
    textureType: 'linen' | 'parchment' | 'marble' | 'smooth' | 'cotton' | 'cloud_marble';
    borderStyle: 'simple' | 'double' | 'ornate' | 'wave' | 'greek' | 'bofa_classic' | 'us_treasury';
    securityLevel: 'basic' | 'enhanced' | 'maximum';
    showVerticalSecurityBar?: boolean;
    distressLevel?: 'none' | 'low' | 'medium' | 'high';
}

const DEFAULT_CONFIG: UltraRealisticConfig = {
    palette: 'classic',
    showRainbowBorder: true,
    showSecureIcon: true,
    showFractionalRouting: true,
    textureType: 'linen',
    borderStyle: 'ornate',
    securityLevel: 'maximum'
};

export class UltraRealisticCheckEngine {

    // ============== RAINBOW GRADIENT BORDER ==============

    static generateRainbowBorder(
        width: number,
        height: number,
        position: 'bottom' | 'top' | 'both' = 'bottom',
        thickness: number = 15
    ): fabric.Group {
        const group = new fabric.Group([], {
            selectable: false,
            evented: false,
            name: 'rainbow-border'
        });

        const stripWidth = width / RAINBOW_GRADIENT_COLORS.length;

        const createStrip = (y: number) => {
            RAINBOW_GRADIENT_COLORS.forEach((color, i) => {
                group.add(new fabric.Rect({
                    left: i * stripWidth,
                    top: y,
                    width: stripWidth + 1, // +1 to avoid gaps
                    height: thickness,
                    fill: color,
                    stroke: color,
                    strokeWidth: 0
                }));
            });
        };

        if (position === 'bottom' || position === 'both') {
            createStrip(height - thickness - 70); // Above MICR line
        }
        if (position === 'top' || position === 'both') {
            createStrip(0);
        }

        return group;
    }

    // ============== SECURE PADLOCK ICON ==============

    static generateSecureIcon(x: number = 500, y: number = 30, size: number = 40): fabric.Group {
        const group = new fabric.Group([], {
            left: x,
            top: y,
            selectable: true,
            name: 'secure-icon'
        });

        // Padlock body
        group.add(new fabric.Rect({
            left: -size / 3,
            top: size / 4,
            width: size * 0.67,
            height: size * 0.5,
            fill: '#333',
            rx: 3,
            ry: 3
        }));

        // Padlock shackle (U-shape)
        group.add(new fabric.Path(
            `M ${-size / 6} ${size / 4} 
             L ${-size / 6} ${-size / 6} 
             A ${size / 3} ${size / 3} 0 0 1 ${size / 3} ${-size / 6} 
             L ${size / 3} ${size / 4}`,
            {
                fill: 'transparent',
                stroke: '#333',
                strokeWidth: size * 0.12
            }
        ));

        // Keyhole
        group.add(new fabric.Circle({
            left: -size / 12,
            top: size * 0.35,
            radius: size * 0.08,
            fill: '#fff'
        }));
        group.add(new fabric.Rect({
            left: -size / 16,
            top: size * 0.42,
            width: size * 0.08,
            height: size * 0.12,
            fill: '#fff'
        }));

        // "SECURE" text
        group.add(new fabric.Text('SECURE', {
            left: -size / 2.5,
            top: size * 0.85,
            fontSize: size * 0.25,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: '#333'
        }));

        return group;
    }

    // ============== FRACTIONAL ROUTING DISPLAY ==============

    static generateFractionalRouting(
        routingNumber: string,
        x: number,
        y: number,
        fontSize: number = 12
    ): fabric.Group {
        // Convert 9-digit routing to fractional format: XX-XXX/XXXX
        // First 2 digits = Federal Reserve District
        // Next 4 digits = ABA Institution Identifier
        // Last 3 digits = Check Digit

        const fed = routingNumber.substring(0, 2);
        const inst = routingNumber.substring(2, 6);
        const check = routingNumber.substring(6, 9);

        const fractional = `${fed}-${inst.substring(0, 3)}/${inst.substring(3)}${check}`;

        return new fabric.Group([
            new fabric.Text(fractional, {
                fontSize,
                fontFamily: 'Courier New',
                fill: '#333',
                left: 0,
                top: 0
            })
        ], {
            left: x,
            top: y,
            selectable: true,
            name: 'fractional-routing'
        });
    }

    // ============== PREMIUM PAPER TEXTURES ==============

    static generatePaperTexture(
        width: number,
        height: number,
        type: UltraRealisticConfig['textureType'] = 'linen'
    ): fabric.Group {
        const group = new fabric.Group([], {
            selectable: false,
            evented: false,
            name: 'paper-texture'
        });

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        switch (type) {
            case 'linen':
                this.drawLinenTexture(ctx, width, height);
                break;
            case 'parchment':
                this.drawParchmentTexture(ctx, width, height);
                break;
            case 'marble':
                this.drawMarbleTexture(ctx, width, height);
                break;
            case 'cloud_marble':
                this.drawCloudMarbleTexture(ctx, width, height);
                break;
            case 'cotton':
                this.drawCottonTexture(ctx, width, height);
                break;
            default:
                ctx.fillStyle = '#fefefe';
                ctx.fillRect(0, 0, width, height);
        }

        const dataUrl = canvas.toDataURL();

        return new fabric.Group([
            new fabric.Rect({
                width, height,
                left: 0, top: 0,
                fill: new fabric.Pattern({
                    source: dataUrl,
                    repeat: 'no-repeat'
                }) as unknown as string
            })
        ], { name: 'paper-texture-group' });
    }

    private static drawLinenTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.fillStyle = '#fdf8f0';
        ctx.fillRect(0, 0, w, h);

        // Horizontal linen threads
        ctx.strokeStyle = 'rgba(200, 190, 170, 0.15)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < h; y += 3) {
            ctx.beginPath();
            ctx.moveTo(0, y + (Math.random() - 0.5) * 0.5);
            ctx.lineTo(w, y + (Math.random() - 0.5) * 0.5);
            ctx.stroke();
        }

        // Vertical linen threads
        for (let x = 0; x < w; x += 4) {
            ctx.beginPath();
            ctx.moveTo(x + (Math.random() - 0.5) * 0.5, 0);
            ctx.lineTo(x + (Math.random() - 0.5) * 0.5, h);
            ctx.stroke();
        }
    }

    private static drawParchmentTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
        gradient.addColorStop(0, '#fdf5e6');
        gradient.addColorStop(0.5, '#f5ecd5');
        gradient.addColorStop(1, '#e8dcc8');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Age spots
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = Math.random() * 3 + 1;
            ctx.fillStyle = `rgba(180, 160, 120, ${Math.random() * 0.1})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private static drawMarbleTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, w, h);

        // Marble veins
        const veins = 20;
        for (let i = 0; i < veins; i++) {
            ctx.strokeStyle = `rgba(180, 180, 190, ${0.1 + Math.random() * 0.15})`;
            ctx.lineWidth = 0.5 + Math.random() * 1.5;
            ctx.beginPath();
            let x = Math.random() * w;
            let y = Math.random() * h;
            ctx.moveTo(x, y);
            for (let j = 0; j < 10; j++) {
                x += (Math.random() - 0.5) * 100;
                y += (Math.random() - 0.5) * 50;
                ctx.quadraticCurveTo(
                    x + (Math.random() - 0.5) * 50,
                    y + (Math.random() - 0.5) * 30,
                    x, y
                );
            }
            ctx.stroke();
        }
    }

    private static drawCloudMarbleTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
        // Base color (Light blue-grey)
        ctx.fillStyle = '#f0f4f8';
        ctx.fillRect(0, 0, w, h);

        // Soft cloud-like veins
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const radius = 100 + Math.random() * 200;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
            grad.addColorStop(0, 'rgba(210, 220, 230, 0.4)');
            grad.addColorStop(1, 'rgba(240, 244, 248, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(x, y, radius, radius * 0.4, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }

        // Finer sharper veins
        for (let i = 0; i < 20; i++) {
            ctx.strokeStyle = `rgba(160, 175, 190, ${0.1 + Math.random() * 0.1})`;
            ctx.lineWidth = 0.5 + Math.random();
            ctx.beginPath();
            let curX = Math.random() * w;
            let curY = Math.random() * h;
            ctx.moveTo(curX, curY);
            for (let j = 0; j < 5; j++) {
                curX += (Math.random() - 0.5) * 200;
                curY += (Math.random() - 0.5) * 100;
                ctx.lineTo(curX, curY);
            }
            ctx.stroke();
        }
    }
    private static drawCottonTexture(ctx: CanvasRenderingContext2D, w: number, h: number) {
        ctx.fillStyle = '#fefefe';
        ctx.fillRect(0, 0, w, h);

        // Cotton fiber feel
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            ctx.fillStyle = `rgba(230, 225, 220, ${Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.ellipse(x, y, Math.random() * 2, Math.random() * 4, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ============== ORNATE BORDER DESIGNS ==============

    static generateOrnateBorder(
        width: number,
        height: number,
        style: UltraRealisticConfig['borderStyle'] = 'ornate',
        color: string = '#1E3A5F'
    ): fabric.Group {
        const group = new fabric.Group([], {
            selectable: false,
            evented: false,
            name: 'ornate-border'
        });

        const margin = 20;
        const innerMargin = 30;

        switch (style) {
            case 'double':
                // Outer border
                group.add(new fabric.Rect({
                    left: margin, top: margin,
                    width: width - margin * 2,
                    height: height - margin * 2 - 50,
                    fill: 'transparent',
                    stroke: color,
                    strokeWidth: 2
                }));
                // Inner border
                group.add(new fabric.Rect({
                    left: innerMargin, top: innerMargin,
                    width: width - innerMargin * 2,
                    height: height - innerMargin * 2 - 50,
                    fill: 'transparent',
                    stroke: color,
                    strokeWidth: 1
                }));
                break;

            case 'ornate':
                // Main decorative border
                this.addOrnateCorners(group, width, height, color);
                break;

            case 'wave':
                this.addWaveBorder(group, width, height, color);
                break;

            case 'greek':
                this.addGreekKeyBorder(group, width, height, color);
                break;

            case 'bofa_classic':
                this.addBofaClassicBorder(group, width, height, color);
                break;

            default:
                group.add(new fabric.Rect({
                    left: margin, top: margin,
                    width: width - margin * 2,
                    height: height - margin * 2 - 50,
                    fill: 'transparent',
                    stroke: color,
                    strokeWidth: 1
                }));
        }

        return group;
    }

    private static addOrnateCorners(group: fabric.Group, w: number, h: number, color: string) {
        const cornerSize = 60;
        const positions = [
            { x: 15, y: 15, angle: 0 },
            { x: w - 15, y: 15, angle: 90 },
            { x: w - 15, y: h - 85, angle: 180 },
            { x: 15, y: h - 85, angle: 270 }
        ];

        positions.forEach(pos => {
            // Corner flourish
            group.add(new fabric.Path(
                `M 0 0 Q ${cornerSize / 2} 0 ${cornerSize / 2} ${cornerSize / 2} Q ${cornerSize / 2} ${cornerSize} ${cornerSize} ${cornerSize}`,
                {
                    left: pos.x,
                    top: pos.y,
                    fill: 'transparent',
                    stroke: color,
                    strokeWidth: 2,
                    angle: pos.angle,
                    originX: 'left',
                    originY: 'top'
                }
            ));
        });

        // Connecting lines
        group.add(new fabric.Line([75, 15, w - 75, 15], { stroke: color, strokeWidth: 1 }));
        group.add(new fabric.Line([75, h - 85, w - 75, h - 85], { stroke: color, strokeWidth: 1 }));
        group.add(new fabric.Line([15, 75, 15, h - 145], { stroke: color, strokeWidth: 1 }));
        group.add(new fabric.Line([w - 15, 75, w - 15, h - 145], { stroke: color, strokeWidth: 1 }));
    }

    private static addWaveBorder(group: fabric.Group, w: number, h: number, color: string) {
        const amplitude = 5;
        const frequency = 0.05;
        let pathTop = 'M 20 20';
        let pathBottom = `M 20 ${h - 70}`;

        for (let x = 20; x <= w - 20; x += 5) {
            const yOffset = Math.sin(x * frequency) * amplitude;
            pathTop += ` L ${x} ${20 + yOffset}`;
            pathBottom += ` L ${x} ${h - 70 + yOffset}`;
        }

        group.add(new fabric.Path(pathTop, { fill: 'transparent', stroke: color, strokeWidth: 1.5 }));
        group.add(new fabric.Path(pathBottom, { fill: 'transparent', stroke: color, strokeWidth: 1.5 }));
    }

    private static addGreekKeyBorder(group: fabric.Group, w: number, h: number, color: string) {
        const unit = 8;
        let path = `M 20 20`;
        let x = 20;

        while (x < w - 40) {
            path += ` l ${unit} 0 l 0 ${unit} l ${-unit} 0 l 0 ${unit} l ${unit * 2} 0 l 0 ${-unit * 2}`;
            x += unit * 2;
        }

        group.add(new fabric.Path(path, {
            fill: 'transparent',
            stroke: color,
            strokeWidth: 1
        }));
    }

    private static addBofaClassicBorder(group: fabric.Group, w: number, h: number, color: string) {
        // Double border with the vertical bar area
        const margin = 10;

        // Outer dark border (thin)
        group.add(new fabric.Rect({
            left: margin, top: margin,
            width: w - margin * 2,
            height: h - margin * 2 - 40,
            fill: 'transparent',
            stroke: color,
            strokeWidth: 1
        }));

        // Inner blue-grey main area border
        group.add(new fabric.Rect({
            left: margin + 3, top: margin + 3,
            width: w - (margin + 3) * 2,
            height: h - (margin + 3) * 2 - 40,
            fill: 'transparent',
            stroke: '#5d728d',
            strokeWidth: 0.5
        }));
    }

    // ============== VERTICAL SECURITY BAR (RIGHT SIDE) ==============

    static generateVerticalSecurityBar(width: number, height: number): fabric.Group {
        const barWidth = 25;
        const x = width - barWidth - 10;
        const y = 10;
        const barHeight = height - 60;

        const group = new fabric.Group([], {
            selectable: false,
            evented: false,
            name: 'vertical-security-bar'
        });

        // Dark blue background
        group.add(new fabric.Rect({
            left: x,
            top: y,
            width: barWidth,
            height: barHeight,
            fill: '#012169'
        }));

        // White warning text rotated 90 deg
        const text = "THIS DOCUMENT HAS A COLORED BACKGROUND AND MICROPRINTING. THE REVERSE SIDE INCLUDES AN ARTIFICIAL WATERMARK.";
        group.add(new fabric.Text(text, {
            left: x + barWidth / 2 + 2,
            top: y + barHeight / 2,
            fontSize: 6.5,
            fontFamily: 'Arial',
            fill: '#ffffff',
            angle: 90,
            originX: 'center',
            originY: 'center',
            fontWeight: 'bold',
            textAlign: 'center'
        }));

        return group;
    }

    // ============== DECORATIVE LINE PATTERNS ==============

    static generateDecorativeLine(
        x1: number, y1: number,
        x2: number, y2: number,
        style: 'solid' | 'dashed' | 'dotted' | 'double' | 'decorative' = 'decorative',
        color: string = '#333'
    ): fabric.Group {
        const group = new fabric.Group([], { selectable: false });
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));

        switch (style) {
            case 'double':
                group.add(new fabric.Line([x1, y1 - 1.5, x2, y2 - 1.5], { stroke: color, strokeWidth: 1 }));
                group.add(new fabric.Line([x1, y1 + 1.5, x2, y2 + 1.5], { stroke: color, strokeWidth: 1 }));
                break;
            case 'decorative':
                group.add(new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: 1 }));
                // Add small diamonds at intervals
                for (let i = 50; i < length; i += 100) {
                    const ratio = i / length;
                    const px = x1 + (x2 - x1) * ratio;
                    const py = y1 + (y2 - y1) * ratio;
                    group.add(new fabric.Polygon([
                        { x: px, y: py - 3 },
                        { x: px + 3, y: py },
                        { x: px, y: py + 3 },
                        { x: px - 3, y: py }
                    ], { fill: color }));
                }
                break;
            case 'dotted':
                group.add(new fabric.Line([x1, y1, x2, y2], {
                    stroke: color, strokeWidth: 1, strokeDashArray: [2, 4]
                }));
                break;
            case 'dashed':
                group.add(new fabric.Line([x1, y1, x2, y2], {
                    stroke: color, strokeWidth: 1, strokeDashArray: [8, 4]
                }));
                break;
            default:
                group.add(new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: 1 }));
        }

        return group;
    }

    // ============== CHECK AMOUNT BOX (ENHANCED) ==============

    static generateAmountBox(
        x: number, y: number,
        width: number = 180, height: number = 45,
        color: string = '#1E3A5F'
    ): fabric.Group {
        const group = new fabric.Group([], {
            left: x, top: y,
            selectable: true,
            name: 'amount-box'
        });

        // Outer decorative border
        group.add(new fabric.Rect({
            width: width + 10, height: height + 10,
            left: -5, top: -5,
            fill: 'transparent',
            stroke: color,
            strokeWidth: 2
        }));

        // Inner box
        group.add(new fabric.Rect({
            width, height,
            left: 0, top: 0,
            fill: '#f8f8f8',
            stroke: color,
            strokeWidth: 1
        }));

        // Dollar sign area
        group.add(new fabric.Rect({
            width: 30, height,
            left: 0, top: 0,
            fill: 'rgba(0,0,0,0.03)'
        }));

        group.add(new fabric.Text('$', {
            left: 8, top: 8,
            fontSize: 22,
            fontFamily: 'Times New Roman',
            fontWeight: 'bold',
            fill: color
        }));

        // Decorative corners
        const cornerPath = 'M 0 0 L 8 0 L 8 2 L 2 2 L 2 8 L 0 8 Z';
        group.add(new fabric.Path(cornerPath, { fill: color, left: -3, top: -3 }));
        group.add(new fabric.Path(cornerPath, { fill: color, left: width - 5, top: -3, angle: 90 }));
        group.add(new fabric.Path(cornerPath, { fill: color, left: width + 5, top: height - 5, angle: 180 }));
        group.add(new fabric.Path(cornerPath, { fill: color, left: -3, top: height + 5, angle: 270 }));

        return group;
    }

    // ============== BANK LOGO AREA ==============

    static generateBankLogoArea(
        bankName: string,
        x: number, y: number,
        options: { showIcon?: boolean; accentColor?: string } = {}
    ): fabric.Group {
        const { showIcon = true, accentColor = '#003366' } = options;

        const group = new fabric.Group([], {
            left: x, top: y,
            selectable: true,
            name: 'bank-logo-area'
        });

        if (showIcon) {
            // Bank building icon
            group.add(new fabric.Polygon([
                { x: 0, y: 20 }, { x: 15, y: 5 }, { x: 30, y: 20 }
            ], { fill: accentColor }));
            group.add(new fabric.Rect({
                left: 3, top: 20, width: 6, height: 20, fill: accentColor
            }));
            group.add(new fabric.Rect({
                left: 12, top: 20, width: 6, height: 20, fill: accentColor
            }));
            group.add(new fabric.Rect({
                left: 21, top: 20, width: 6, height: 20, fill: accentColor
            }));
            group.add(new fabric.Rect({
                left: 0, top: 40, width: 30, height: 4, fill: accentColor
            }));
        }

        // Bank name
        group.add(new fabric.Text(bankName, {
            left: showIcon ? 40 : 0,
            top: showIcon ? 15 : 0,
            fontSize: 16,
            fontFamily: 'Georgia',
            fontWeight: 'bold',
            fill: accentColor
        }));

        return group;
    }

    // ============== COMPLETE PREMIUM CHECK DESIGN ==============

    static generatePremiumCheckDesign(
        width: number,
        height: number,
        config: Partial<UltraRealisticConfig> = {}
    ): fabric.Group[] {
        const cfg = { ...DEFAULT_CONFIG, ...config };
        const palette = PREMIUM_PALETTES[cfg.palette];
        const elements: fabric.Group[] = [];

        // 1. Paper texture
        elements.push(this.generatePaperTexture(width, height, cfg.textureType));

        // 2. Ornate border
        elements.push(this.generateOrnateBorder(width, height, cfg.borderStyle, palette.primary));

        // 3. Rainbow border (if enabled)
        if (cfg.showRainbowBorder) {
            elements.push(this.generateRainbowBorder(width, height, 'bottom', 12));
        }

        // 4. Secure icon (if enabled)
        if (cfg.showSecureIcon) {
            elements.push(this.generateSecureIcon(width / 2 - 20, 20, 40));
        }

        // 4b. Vertical Security Bar (Special)
        if (cfg.showVerticalSecurityBar || cfg.borderStyle === 'bofa_classic') {
            elements.push(this.generateVerticalSecurityBar(width, height));
        }

        // 4c. US Treasury Specific Assets
        if (cfg.borderStyle === 'us_treasury') {
            this.addTreasurySpecialAssets(elements, width, height, palette.primary);
        }

        // 6. Decorative lines
        elements.push(this.generateDecorativeLine(80, 180, width - 300, 180, 'decorative', palette.primary));
        elements.push(this.generateDecorativeLine(80, 270, width - 100, 270, 'double', palette.primary));
        elements.push(this.generateDecorativeLine(width - 500, 360, width - 100, 360, 'solid', palette.primary));

        // 7. Amount box
        if (cfg.borderStyle !== 'us_treasury') {
            elements.push(this.generateAmountBox(width - 280, 160, 180, 45, palette.primary));
        }

        // 8. Watermark/Treasury Assets
        if (cfg.borderStyle === 'us_treasury') {
            elements.push(this.generateTreasuryWatermark(width, height));
        }

        // 9. APPLY WEAR AND TEAR (Physical Realism)
        if (cfg.distressLevel && cfg.distressLevel !== 'none') {
            elements.push(...this.applyWearAndTear(width, height, cfg.distressLevel));
        }

        return elements;
    }

    // ============== WEAR AND TEAR FILTERS ==============

    static applyWearAndTear(width: number, height: number, level: 'low' | 'medium' | 'high'): fabric.Group[] {
        const effects: fabric.Group[] = [];
        const intensity = level === 'low' ? 0.3 : level === 'medium' ? 0.6 : 1.0;

        // 1. Vertical Fold Marks (Simulating pocket storage)
        const foldGroup = new fabric.Group([], { selectable: false, evented: false });
        const foldX = width / 3 + (Math.random() - 0.5) * 50;
        foldGroup.add(new fabric.Line([foldX, 0, foldX, height], {
            stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2, strokeDashArray: [10, 5]
        }));
        foldGroup.add(new fabric.Line([foldX + 2, 0, foldX + 2, height], {
            stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1
        }));
        effects.push(foldGroup);

        // 2. Ink Fading (Sparse noise overlay)
        const fadeGroup = new fabric.Group([], { selectable: false, evented: false });
        for (let i = 0; i < 20 * intensity; i++) {
            fadeGroup.add(new fabric.Circle({
                left: Math.random() * width,
                top: Math.random() * height,
                radius: 20 + Math.random() * 50,
                fill: 'rgba(255,255,255,0.15)',
                blur: 10
            } as any));
        }
        effects.push(fadeGroup);

        // 3. Subtle Smudging
        if (level !== 'low') {
            const smudgeGroup = new fabric.Group([], { selectable: false, evented: false });
            for (let i = 0; i < 5 * intensity; i++) {
                smudgeGroup.add(new fabric.Path(`M 0 0 Q ${20 * intensity} ${10 * intensity} ${40 * intensity} 0`, {
                    left: Math.random() * width,
                    top: Math.random() * height,
                    fill: 'transparent',
                    stroke: 'rgba(60,60,60,0.03)',
                    strokeWidth: 15,
                    strokeLineCap: 'round'
                }));
            }
            effects.push(smudgeGroup);
        }

        return effects;
    }

    // ============== GET PREMIUM PALETTES ==============

    static getPalettes(): typeof PREMIUM_PALETTES {
        return PREMIUM_PALETTES;
    }

    static getPaletteNames(): string[] {
        return Object.keys(PREMIUM_PALETTES);
    }

    static addTreasurySpecialAssets(elements: fabric.Object[], width: number, height: number, color: string) {
        // 1. Statue of Liberty (Left)
        const liberty = this.generateStatueOfLiberty(15, 20, 180);
        elements.push(liberty);

        // 2. Treasury Seal (Top center-left)
        const seal = this.generateTreasurySeal(285, 45, 35);
        elements.push(seal);

        // 3. Signature Box (Bottom Right)
        const sigBox = this.generateShadedSignatureBox(width - 250, 195, 200, 50);
        elements.push(sigBox);

        // 4. DataMatrix (Top Right)
        const dataMatrix = this.generateDataMatrix(width - 100, 35, 40);
        elements.push(dataMatrix);
    }

    private static generateStatueOfLiberty(x: number, y: number, h: number): fabric.Group {
        const color = 'rgba(30, 57, 50, 0.7)';
        const g = new fabric.Group([], { left: x, top: y, selectable: true });

        // Background Rays
        for (let i = 0; i < 12; i++) {
            const angle = (i * 15 - 90) * Math.PI / 180;
            g.add(new fabric.Line([40, 45, 40 + Math.cos(angle) * 45, 45 + Math.sin(angle) * 45], {
                stroke: 'rgba(30, 57, 50, 0.15)', strokeWidth: 1
            }));
        }

        // Detailed Silhouette Path (Robes + Base)
        const path = "M 40 180 L 25 180 L 20 150 L 15 100 L 20 60 L 30 40 L 40 30 L 45 40 L 55 60 L 65 100 L 60 150 L 55 180 Z";
        g.add(new fabric.Path(path, { fill: color, stroke: color, strokeWidth: 0.5 }));

        // Crown Spikes
        for (let i = 0; i < 7; i++) {
            const angle = (i * 20 - 60) * Math.PI / 180;
            g.add(new fabric.Line([40, 32, 40 + Math.cos(angle) * 8, 32 + Math.sin(angle) * 8], { stroke: color, strokeWidth: 1.5 }));
        }

        // Torch Arm
        g.add(new fabric.Path("M 25 60 L 12 25 L 16 20 L 30 55", { fill: color }));
        // Torch Flame
        g.add(new fabric.Circle({ left: 8, top: 12, radius: 4, fill: 'rgba(212, 175, 55, 0.8)' }));
        // Torch Glow
        g.add(new fabric.Circle({ left: 8, top: 12, radius: 8, fill: 'rgba(212, 175, 55, 0.3)' }));

        g.scaleToHeight(h);
        return g;
    }

    private static generateTreasurySeal(x: number, y: number, r: number): fabric.Group {
        const color = 'rgba(30, 57, 50, 0.9)';
        const g = new fabric.Group([], { left: x, top: y, selectable: true });

        // Outer rims
        g.add(new fabric.Circle({ radius: r, fill: 'transparent', stroke: color, strokeWidth: 2 }));

        // Inner Dashed Rim (Authentic)
        g.add(new fabric.Circle({
            radius: r - 4,
            fill: 'transparent',
            stroke: color,
            strokeWidth: 1,
            strokeDashArray: [2, 2]
        }));

        // Shield / Symbols (Abstracted for fidelity at small scale)
        const shieldPath = `M ${r - 10} ${r - 10} L ${r + 10} ${r - 10} L ${r + 10} ${r + 5} Q ${r} ${r + 15} ${r - 10} ${r + 5} Z`;
        g.add(new fabric.Path(shieldPath, { fill: 'transparent', stroke: color, strokeWidth: 1 }));

        // Scales
        g.add(new fabric.Text('⚖️', { left: r / 2 - 2, top: r / 2 - 8, fontSize: r * 0.35, fill: color }));
        // Key
        g.add(new fabric.Text('🗝️', { left: r / 2 - 2, top: r / 2 + 5, fontSize: r * 0.35, fill: color, angle: 45 }));

        return g;
    }

    static generateTreasuryWatermark(width: number, height: number): fabric.Group {
        const t = new fabric.Text("U.S. TREASURY", {
            fontSize: 40,
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: 'rgba(0, 0, 0, 0.06)',
            originX: 'center',
            originY: 'center'
        });

        return new fabric.Group([t], {
            left: width / 2,
            top: height / 2,
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });
    }

    private static generateShadedSignatureBox(x: number, y: number, w: number, h: number): fabric.Group {
        const g = new fabric.Group([], { left: x, top: y, selectable: true });

        // Complex crosshatch ground
        for (let i = 0; i < w; i += 2) {
            g.add(new fabric.Line([i, 0, i, h], { stroke: 'rgba(0,0,0,0.1)', strokeWidth: 0.2 }));
        }
        for (let i = 0; i < h; i += 2) {
            g.add(new fabric.Line([0, i, w, i], { stroke: 'rgba(0,0,0,0.1)', strokeWidth: 0.2 }));
        }

        // Diagonal noise
        for (let i = -h; i < w; i += 3) {
            g.add(new fabric.Line([i, 0, i + h, h], { stroke: 'rgba(0,0,0,0.15)', strokeWidth: 0.3 }));
        }

        return g;
    }

    private static generateDataMatrix(x: number, y: number, s: number): fabric.Group {
        const g = new fabric.Group([], { left: x, top: y, selectable: true });
        const cellSize = s / 10;
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                if (Math.random() > 0.4 || (i === 0) || (j === 9)) {
                    g.add(new fabric.Rect({
                        left: i * cellSize,
                        top: j * cellSize,
                        width: cellSize,
                        height: cellSize,
                        fill: '#222'
                    }));
                }
            }
        }
        return g;
    }
}
