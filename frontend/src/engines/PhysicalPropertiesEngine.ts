import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise';

export class PhysicalPropertiesEngine {
    private canvas: HTMLCanvasElement;
    private textureCache: Map<string, THREE.CanvasTexture> = new Map();
    private noiseGenerator: SimplexNoise;

    constructor() {
        this.noiseGenerator = new SimplexNoise();
        this.canvas = document.createElement('canvas'); // Initialize canvas
    }

    // Generate realistic paper textures
    generatePaperTexture(type: PaperType, options: PaperOptions = {}): THREE.CanvasTexture {
        const cacheKey = `${type}-${JSON.stringify(options)}`;
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey)!;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d')!;

        // Base paper color with subtle variations
        const baseColor = this.getPaperColor(type);
        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add paper fibers and pulp particles
        this.addPaperFibers(ctx, type, options);

        // Add watermark effect
        this.addWatermarkPattern(ctx, type);

        // Add surface irregularities
        this.addSurfaceTexture(ctx, type);

        // Add age/wear effects if requested
        if (options.aged) {
            this.addAgingEffects(ctx);
        }

        const texture = new THREE.CanvasTexture(canvas);
        this.textureCache.set(cacheKey, texture);
        return texture;
    }

    private getPaperColor(type: PaperType): string {
        switch (type) {
            case 'cotton': return '#fcfcf9';
            case 'security': return '#f5f5f5';
            case 'premium': return '#fffff0';
            case 'recycled': return '#f0f0e0';
            default: return '#ffffff';
        }
    }

    private addWatermarkPattern(ctx: CanvasRenderingContext2D, type: PaperType) {
        const w = ctx.canvas.width, h = ctx.canvas.height;
        ctx.save();
        ctx.globalAlpha = 0.04;
        ctx.font = '18px Arial';
        ctx.fillStyle = '#888888';
        const text = type === 'security' ? 'VOID VOID VOID' : 'ORIGINAL';
        const spacing = 120;
        ctx.rotate(-0.35);
        for (let y = -h; y < h * 2; y += spacing) {
            for (let x = -w; x < w * 2; x += spacing) {
                ctx.fillText(text, x, y);
            }
        }
        ctx.restore();
    }

    private addPaperFibers(ctx: CanvasRenderingContext2D, type: PaperType, options: PaperOptions) {
        // ULTRA-REALISM BOOST: Increased fiber counts significantly
        const fiberCount = type === 'cotton' ? 8000 : type === 'security' ? 5000 : 3000;

        for (let i = 0; i < fiberCount; i++) {
            const x = Math.random() * ctx.canvas.width;
            const y = Math.random() * ctx.canvas.height;
            const length = 2 + Math.random() * 8;
            const angle = Math.random() * Math.PI * 2;
            // Sub-pixel line weights for retina/4k displays
            const width = 0.08 + Math.random() * 0.2;

            // Color variations (natural paper fibers)
            const colors = [
                'rgba(245, 245, 240, 0.4)',
                'rgba(250, 250, 245, 0.5)',
                'rgba(255, 255, 250, 0.4)',
                'rgba(230, 230, 225, 0.3)'
            ];

            ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
            ctx.lineWidth = width;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(angle) * length,
                y + Math.sin(angle) * length
            );
            ctx.stroke();
        }

        // Add security fibers (colored threads)
        if (type === 'security' || options.securityFibers) {
            this.addSecurityFibers(ctx);
        }
    }

    private addSecurityFibers(ctx: CanvasRenderingContext2D) {
        const colors = [
            'rgba(255, 0, 0, 0.7)',    // Red
            'rgba(0, 255, 0, 0.7)',    // Green
            'rgba(0, 0, 255, 0.7)',    // Blue
            'rgba(255, 255, 0, 0.7)',  // Yellow
            'rgba(255, 0, 255, 0.7)',  // Magenta
        ];

        // 2000+ Security Fibers Boost
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * ctx.canvas.width;
            const y = Math.random() * ctx.canvas.height;
            const length = 3 + Math.random() * 15;
            const angle = Math.random() * Math.PI * 2;
            const color = colors[Math.floor(Math.random() * colors.length)];

            ctx.strokeStyle = color;
            ctx.lineWidth = 0.3 + Math.random() * 0.4; // Fine threads
            ctx.setLineDash([1, 2]); // Dashed lines for thread-like appearance

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(
                x + Math.cos(angle) * length,
                y + Math.sin(angle) * length
            );
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    private addSurfaceTexture(ctx: CanvasRenderingContext2D, type: PaperType) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;

        // Add subtle noise for paper texture
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 8; // Small variations
            // Fix: Ensure we don't wash out background colors
            // Only apply noise if pixel is not fully transparent
            if (data[i + 3] > 0) {
                data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
            }
        }

        // Add paper grain (more pronounced for certain types)
        // Boosted to 5000+ speckles equivalent coverage
        const grainIntensity = type === 'recycled' ? 20 : type === 'cotton' ? 12 : 8;
        for (let y = 0; y < ctx.canvas.height; y++) {
            for (let x = 0; x < ctx.canvas.width; x++) {
                const idx = (y * ctx.canvas.width + x) * 4;
                const grain = (Math.random() - 0.5) * grainIntensity;

                data[idx] = Math.max(0, Math.min(255, data[idx] + grain));
                data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] + grain));
                data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] + grain));
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Add embossed/debossed effects
        this.addEmbossedEffects(ctx, type);
    }

    private addEmbossedEffects(ctx: CanvasRenderingContext2D, type: PaperType) {
        if (type === 'premium' || type === 'security') {
            // Simulate watermark effect
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = 'white';
            ctx.font = 'bold 120px Georgia';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('SECURE', ctx.canvas.width / 2, ctx.canvas.height / 2);
            ctx.globalAlpha = 1.0;
        }

        // Add subtle shadow for raised printing areas
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
    }

    private addAgingEffects(ctx: CanvasRenderingContext2D) {
        // Add subtle yellowing
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Add yellow tint (increase red and green slightly)
            data[i] = Math.min(255, data[i] + 10);     // More red
            data[i + 1] = Math.min(255, data[i + 1] + 8); // More green
            // Slight decrease in blue
            data[i + 2] = Math.max(0, data[i + 2] - 5);
        }

        ctx.putImageData(imageData, 0, 0);

        // Add coffee stains
        this.addStains(ctx, 5);

        // Add fold/crease marks
        this.addFoldMarks(ctx);

        // Add edge wear
        this.addEdgeWear(ctx);
    }

    private addStains(ctx: CanvasRenderingContext2D, count: number) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * ctx.canvas.width;
            const y = Math.random() * ctx.canvas.height;
            const radius = 20 + Math.random() * 80;

            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(139, 69, 19, 0.3)'); // Brown center
            gradient.addColorStop(1, 'rgba(139, 69, 19, 0)');   // Transparent edge

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private addFoldMarks(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 3]);

        // Add a few fold lines
        for (let i = 0; i < 3; i++) {
            const startX = Math.random() * ctx.canvas.width;
            const startY = Math.random() * ctx.canvas.height;
            const length = 100 + Math.random() * 200;
            const angle = Math.random() * Math.PI * 2;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(
                startX + Math.cos(angle) * length,
                startY + Math.sin(angle) * length
            );
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    private addEdgeWear(ctx: CanvasRenderingContext2D) {
        const wearIntensity = 0.3;
        const edgeWidth = 20;

        // Top edge
        for (let x = 0; x < ctx.canvas.width; x++) {
            const wear = Math.random() * wearIntensity;
            const alpha = 1 - (wear * (edgeWidth - Math.min(x, ctx.canvas.width - x)) / edgeWidth);

            ctx.fillStyle = `rgba(200, 200, 180, ${wear})`;
            ctx.fillRect(x, 0, 1, edgeWidth * wear);
        }

    }

    // Generate ink bleed simulation
    generateInkBleedEffect(text: string, font: string, color: string, options: InkOptions): THREE.CanvasTexture {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;

        // Draw base text
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // Apply ink bleed effect based on paper type
        if ((options.paperType as any) === 'cheap' || options.inkType === 'liquid') {
            this.simulateInkBleed(ctx, options.intensity || 0.5);
        }

        // Add pen pressure variations
        if (options.handwritten) {
            this.addPenPressureVariations(ctx, text);
        }

        return new THREE.CanvasTexture(canvas);
    }

    private addPenPressureVariations(ctx: CanvasRenderingContext2D, text: string) {
        // Simulate pressure variations along text by overlaying variable-width strokes
        ctx.save();
        const w = ctx.canvas.width;
        const baseY = ctx.canvas.height / 2;
        const charWidth = w / Math.max(1, text.length);
        ctx.globalCompositeOperation = 'multiply';
        for (let i = 0; i < text.length; i++) {
            const pressure = 0.6 + Math.random() * 0.4;
            ctx.globalAlpha = 0.1 * pressure;
            ctx.lineWidth = 1 + pressure * 2;
            ctx.strokeStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(i * charWidth, baseY - 5);
            ctx.lineTo((i + 1) * charWidth, baseY - 5 + (Math.random() - 0.5) * 3);
            ctx.stroke();
        }
        ctx.restore();
    }

    private simulateInkBleed(ctx: CanvasRenderingContext2D, intensity: number) {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        const data = imageData.data;
        const bleedRadius = Math.ceil(intensity * 5);

        // Create temporary array for bleed effect
        const tempData = new Uint8ClampedArray(data.length);

        for (let y = 0; y < ctx.canvas.height; y++) {
            for (let x = 0; x < ctx.canvas.width; x++) {
                const idx = (y * ctx.canvas.width + x) * 4;

                if (data[idx + 3] > 128) { // If pixel is part of text
                    // Bleed ink to surrounding pixels
                    for (let dy = -bleedRadius; dy <= bleedRadius; dy++) {
                        for (let dx = -bleedRadius; dx <= bleedRadius; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;

                            if (nx >= 0 && nx < ctx.canvas.width && ny >= 0 && ny < ctx.canvas.height) {
                                const nIdx = (ny * ctx.canvas.width + nx) * 4;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                const bleedAmount = (1 - distance / bleedRadius) * intensity * 100;

                                tempData[nIdx] = Math.max(tempData[nIdx], data[idx] - bleedAmount);
                                tempData[nIdx + 1] = Math.max(tempData[nIdx + 1], data[idx + 1] - bleedAmount);
                                tempData[nIdx + 2] = Math.max(tempData[nIdx + 2], data[idx + 2] - bleedAmount);
                                tempData[nIdx + 3] = Math.max(tempData[nIdx + 3], bleedAmount);
                            }
                        }
                    }
                }
            }
        }

        // Combine original and bleed effects
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.max(data[i], tempData[i]);
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Generate 3D paper effect with lighting
    generate3DPaperEffect(baseTexture: THREE.CanvasTexture): THREE.Mesh {
        const geometry = new THREE.PlaneGeometry(3.5, 8.5, 32, 32);

        // Add subtle deformation for realistic paper
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            const wave = this.noiseGenerator.noise(x * 10, y * 10) * 0.01;
            vertices[i + 2] = wave; // Add z-offset for 3D effect
        }

        const material = new THREE.MeshPhongMaterial({
            map: baseTexture,
            side: THREE.DoubleSide,
            specular: 0x111111,
            shininess: 30,
            bumpScale: 0.05,
            transparent: true,
            opacity: 0.95
        });

        // Generate normal map for paper texture
        this.generateNormalMap(baseTexture).then(normalMap => {
            material.normalMap = normalMap;
            material.needsUpdate = true;
        });

        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    private async generateNormalMap(baseTexture: THREE.CanvasTexture): Promise<THREE.Texture> {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Load texture image
        const image = await new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = baseTexture.image.src;
        });

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const normalData = new Uint8ClampedArray(imageData.data.length);

        // Convert to normal map
        for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < canvas.width - 1; x++) {
                const idx = (y * canvas.width + x) * 4;

                // Get neighboring pixel intensities
                const left = this.getIntensity(imageData, x - 1, y);
                const right = this.getIntensity(imageData, x + 1, y);
                const up = this.getIntensity(imageData, x, y - 1);
                const down = this.getIntensity(imageData, x, y + 1);

                // Calculate normal
                const dx = (left - right) * 0.5;
                const dy = (up - down) * 0.5;
                const dz = 1.0;

                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

                normalData[idx] = (dx / length + 1) * 127.5;     // R
                normalData[idx + 1] = (dy / length + 1) * 127.5; // G
                normalData[idx + 2] = (dz / length + 1) * 127.5; // B
                normalData[idx + 3] = 255;                       // A
            }
        }

        const normalImageData = new ImageData(normalData, canvas.width, canvas.height);
        ctx.putImageData(normalImageData, 0, 0);

        return new THREE.CanvasTexture(canvas);
    }

    private getIntensity(imageData: ImageData, x: number, y: number): number {
        const idx = (y * imageData.width + x) * 4;
        const r = imageData.data[idx];
        const g = imageData.data[idx + 1];
        const b = imageData.data[idx + 2];
        return (r + g + b) / 3;
    }
}

// Types
export type PaperType = 'cotton' | 'security' | 'premium' | 'recycled' | 'standard';
export type InkType = 'gel' | 'ballpoint' | 'fountain' | 'rollerball' | 'liquid';

export interface PaperOptions {
    aged?: boolean;
    securityFibers?: boolean;
    watermark?: string;
    textureIntensity?: number;
}

export interface InkOptions {
    paperType: PaperType;
    inkType: InkType;
    handwritten?: boolean;
    intensity?: number;
    pressureVariation?: number;
}
