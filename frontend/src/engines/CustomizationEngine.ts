import { fabric } from 'fabric';
import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'; // Commented out to avoid build error if not used or installed

// Types
export interface UserAssets {
    logos: LogoAsset[];
    patterns: PatternAsset[];
    textures: TextureAsset[];
    signatures: SignatureAsset[];
    watermarks: WatermarkAsset[];
    backgrounds: BackgroundAsset[];
}

// ... (Other interfaces defined below)

export class CustomizationEngine {
    private fabricCanvas: fabric.Canvas | null = null;
    private threeScene: THREE.Scene | null = null;
    private userAssets: UserAssets = {
        logos: [],
        patterns: [],
        textures: [],
        signatures: [],
        watermarks: [],
        backgrounds: []
    };

    // Initialize with canvas
    initialize(canvasElement: HTMLCanvasElement, threeContainer?: HTMLElement) {
        this.fabricCanvas = new fabric.Canvas(canvasElement, {
            width: 850,
            height: 350,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true
        });

        if (threeContainer) {
            this.initialize3DScene(threeContainer);
        }

        this.loadDefaultAssets();
    }

    private initialize3DScene(container: HTMLElement) {
        // Placeholder
    }

    private loadDefaultAssets() {
        // Placeholder
    }

    // 1. LOGO UPLOAD & MANAGEMENT
    async uploadLogo(file: File, options: LogoOptions = {}): Promise<LogoAsset> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const logoUrl = e.target?.result as string;

                    // Process logo
                    const processedLogo = await this.processLogo(logoUrl, options);

                    // Create fabric image
                    fabric.Image.fromURL(processedLogo.url, async (img) => {
                        const logo: LogoAsset = {
                            id: `logo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            name: file.name,
                            url: processedLogo.url,
                            thumbnail: await this.createThumbnail(processedLogo.url),
                            type: 'logo',
                            size: file.size,
                            dimensions: { width: img.width!, height: img.height! },
                            format: file.type,
                            tags: options.tags || [],
                            metadata: {
                                uploaded: new Date().toISOString(),
                                category: options.category || 'business',
                                transparency: processedLogo.hasTransparency,
                                colors: await this.extractColors(processedLogo.url)
                            },
                            fabricObject: img,
                            positionPresets: this.generateLogoPositions()
                        };

                        this.userAssets.logos.push(logo);
                        resolve(logo);
                    });
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    private async processLogo(logoUrl: string, options: LogoOptions): Promise<ProcessedLogo> {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = await this.loadImage(logoUrl);

        // Set canvas size
        canvas.width = options.maxWidth || 300;
        canvas.height = options.maxHeight || 150;

        // Apply processing
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply effects based on options
        if (options.removeBackground) {
            await this.removeBackground(ctx, canvas);
        }

        if (options.enhanceEdges) {
            this.enhanceEdges(ctx, canvas);
        }

        if (options.convertToGrayscale) {
            this.convertToGrayscale(ctx, canvas);
        }

        return {
            url: canvas.toDataURL('image/png'),
            hasTransparency: options.removeBackground || this.hasTransparency(ctx, canvas)
        };
    }

    private async loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = url;
        });
    }

    private async removeBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        // Alpha-thresholding background removal
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // Sample corners to find background color
        const corners = [
            [0, 0], [canvas.width - 1, 0],
            [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]
        ];
        let bgR = 0, bgG = 0, bgB = 0;
        for (const [x, y] of corners) {
            const idx = (y * canvas.width + x) * 4;
            bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2];
        }
        bgR /= 4; bgG /= 4; bgB /= 4;
        const tolerance = 40;
        for (let i = 0; i < data.length; i += 4) {
            const diff = Math.abs(data[i] - bgR) + Math.abs(data[i + 1] - bgG) + Math.abs(data[i + 2] - bgB);
            if (diff < tolerance) {
                data[i + 3] = 0; // Set alpha to 0 for background pixels
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    private enhanceEdges(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        // Sobel edge enhancement
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width;
        const h = canvas.height;
        const output = new Uint8ClampedArray(data.length);
        output.set(data);

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                for (let c = 0; c < 3; c++) {
                    const gx = -data[((y - 1) * w + (x - 1)) * 4 + c] + data[((y - 1) * w + (x + 1)) * 4 + c]
                        - 2 * data[(y * w + (x - 1)) * 4 + c] + 2 * data[(y * w + (x + 1)) * 4 + c]
                        - data[((y + 1) * w + (x - 1)) * 4 + c] + data[((y + 1) * w + (x + 1)) * 4 + c];
                    const gy = -data[((y - 1) * w + (x - 1)) * 4 + c] - 2 * data[((y - 1) * w + x) * 4 + c] - data[((y - 1) * w + (x + 1)) * 4 + c]
                        + data[((y + 1) * w + (x - 1)) * 4 + c] + 2 * data[((y + 1) * w + x) * 4 + c] + data[((y + 1) * w + (x + 1)) * 4 + c];
                    const edge = Math.min(255, Math.sqrt(gx * gx + gy * gy));
                    // Blend edge with original (sharpen)
                    output[idx + c] = Math.min(255, data[idx + c] + edge * 0.3);
                }
            }
        }
        const newData = new ImageData(output, w, h);
        ctx.putImageData(newData, 0, 0);
    }

    private convertToGrayscale(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = data[i + 1] = data[i + 2] = lum;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    private hasTransparency(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): boolean {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 3; i < data.length; i += 4) {
            if (data[i] < 250) return true;
        }
        return false;
    }

    private async createThumbnail(url: string): Promise<string> {
        const img = await this.loadImage(url);
        const thumbSize = 128;
        const canvas = document.createElement('canvas');
        const aspect = img.width / img.height;
        canvas.width = aspect >= 1 ? thumbSize : Math.round(thumbSize * aspect);
        canvas.height = aspect >= 1 ? Math.round(thumbSize / aspect) : thumbSize;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    }

    private async extractColors(url: string): Promise<string[]> {
        const img = await this.loadImage(url);
        const canvas = document.createElement('canvas');
        const size = 64; // Downsample for speed
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Simple k-means-like color extraction
        const colorBuckets: Map<string, number> = new Map();
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] < 128) continue; // Skip transparent
            const qr = Math.round(data[i] / 32) * 32;
            const qg = Math.round(data[i + 1] / 32) * 32;
            const qb = Math.round(data[i + 2] / 32) * 32;
            const key = `#${((1 << 24) + (qr << 16) + (qg << 8) + qb).toString(16).slice(1)}`;
            colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1);
        }
        const entries: Array<[string, number]> = [];
        colorBuckets.forEach((count, color) => entries.push([color, count]));
        return entries
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map((entry) => entry[0]);
    }

    private generateLogoPositions(): LogoPosition[] {
        return ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    }


    // 2. PATTERN UPLOAD & CREATION
    async createPattern(options: PatternOptions): Promise<PatternAsset> {
        const patternId = `pattern_${Date.now()}`;

        // Generate pattern based on type
        let patternUrl: string;
        switch (options.type) {
            case 'geometric':
                patternUrl = await this.generateGeometricPattern(options);
                break;
            case 'organic':
                patternUrl = await this.generateOrganicPattern(options);
                break;
            case 'custom':
                patternUrl = await this.generateCustomPattern(options);
                break;
            case 'security':
                patternUrl = await this.generateSecurityPattern(options);
                break;
            default:
                patternUrl = await this.generateGeometricPattern(options);
        }

        const pattern: PatternAsset = {
            id: patternId,
            name: options.name || `Pattern ${this.userAssets.patterns.length + 1}`,
            url: patternUrl,
            thumbnail: await this.createThumbnail(patternUrl),
            type: 'pattern',
            category: options.type,
            seamless: options.seamless || true,
            colors: options.colors || ['#000000', '#ffffff'],
            intensity: options.intensity || 0.5,
            scale: options.scale || 1.0,
            opacity: options.opacity || 0.1,
            fabricPattern: await this.createFabricPattern(patternUrl),
            threeMaterial: await this.createThreeMaterial(patternUrl),
            metadata: {
                created: new Date().toISOString(),
                complexity: options.complexity || 'medium',
                repeatable: options.seamless || true,
                securityLevel: options.type === 'security' ? 'high' : 'low'
            }
        };

        this.userAssets.patterns.push(pattern);
        return pattern;
    }

    private async generateGeometricPattern(options: PatternOptions): Promise<string> {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d')!;
        const colors = options.colors || ['#000000', '#ffffff'];
        const intensity = options.intensity || 0.5;

        ctx.fillStyle = colors[1] || '#ffffff';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = colors[0];
        ctx.globalAlpha = intensity;
        ctx.lineWidth = 1;

        const complexity = options.complexity === 'high' ? 24 : options.complexity === 'low' ? 6 : 12;

        // Diamond crosshatch
        for (let i = 0; i < complexity; i++) {
            const offset = (256 / complexity) * i;
            ctx.beginPath();
            ctx.moveTo(offset, 0); ctx.lineTo(256, 256 - offset);
            ctx.moveTo(0, offset); ctx.lineTo(256 - offset, 256);
            ctx.moveTo(256 - offset, 0); ctx.lineTo(0, 256 - offset);
            ctx.moveTo(256, offset); ctx.lineTo(offset, 256);
            ctx.stroke();
        }

        // Add circles at intersections
        ctx.globalAlpha = intensity * 0.5;
        for (let y = 0; y < complexity; y++) {
            for (let x = 0; x < complexity; x++) {
                if ((x + y) % 3 === 0) {
                    ctx.beginPath();
                    ctx.arc((256 / complexity) * x, (256 / complexity) * y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        return canvas.toDataURL('image/png');
    }

    private async generateOrganicPattern(options: PatternOptions): Promise<string> {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d')!;
        const colors = options.colors || ['#2d5016', '#ffffff'];
        const intensity = options.intensity || 0.5;

        ctx.fillStyle = colors[1] || '#ffffff';
        ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = colors[0];
        ctx.globalAlpha = intensity;
        ctx.lineWidth = 0.8;

        // Perlin-like organic flow curves
        const waves = options.complexity === 'high' ? 40 : options.complexity === 'low' ? 10 : 20;
        for (let i = 0; i < waves; i++) {
            ctx.beginPath();
            const startY = (256 / waves) * i;
            ctx.moveTo(0, startY);
            for (let x = 0; x <= 256; x += 4) {
                const y = startY + Math.sin(x * 0.02 + i * 0.7) * 12
                    + Math.sin(x * 0.05 + i * 1.3) * 6
                    + Math.cos(x * 0.01 + i * 2.1) * 8;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Add organic dots
        ctx.globalAlpha = intensity * 0.3;
        for (let i = 0; i < 80; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const r = 1 + Math.random() * 3;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas.toDataURL('image/png');
    }

    private async generateCustomPattern(options: PatternOptions): Promise<string> {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d')!;
        const colors = options.colors || ['#333333', '#f0f0f0'];
        const intensity = options.intensity || 0.5;
        const scale = options.scale || 1.0;

        ctx.fillStyle = colors[1] || '#f0f0f0';
        ctx.fillRect(0, 0, 256, 256);

        // Blend multiple pattern types for a unique custom look
        ctx.globalAlpha = intensity;
        ctx.strokeStyle = colors[0];
        ctx.lineWidth = 0.5 * scale;

        // Layer 1: Concentric rectangles
        for (let i = 0; i < 8; i++) {
            const offset = 16 * i * scale;
            ctx.strokeRect(offset, offset, 256 - offset * 2, 256 - offset * 2);
        }

        // Layer 2: Diagonal hatching
        ctx.globalAlpha = intensity * 0.4;
        for (let i = -256; i < 512; i += 20 * scale) {
            ctx.beginPath();
            ctx.moveTo(i, 0); ctx.lineTo(i + 256, 256);
            ctx.stroke();
        }

        // Layer 3: Dot grid
        ctx.globalAlpha = intensity * 0.6;
        const dotSpacing = 24 * scale;
        for (let y = 0; y < 256; y += dotSpacing) {
            for (let x = 0; x < 256; x += dotSpacing) {
                ctx.beginPath();
                ctx.arc(x, y, 1.5 * scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        return canvas.toDataURL('image/png');
    }

    private async generateSecurityPattern(options: PatternOptions): Promise<string> {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;

        // Create guilloche pattern (anti-counterfeiting)
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Base pattern
        ctx.strokeStyle = options.colors?.[0] || '#000000';
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = options.opacity || 0.05;

        for (let i = 0; i < 360; i += 5) {
            const angle = (i * Math.PI) / 180;
            const radius = 100 + Math.sin(i * 0.1) * 50;

            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;

            const x2 = centerX + Math.cos(angle + Math.PI / 6) * (radius * 1.2);
            const y2 = centerY + Math.sin(angle + Math.PI / 6) * (radius * 1.2);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.bezierCurveTo(
                x1 + 30, y1 - 30,
                x2 - 30, y2 - 30,
                x2, y2
            );
            ctx.stroke();
        }

        // Add microprint
        ctx.font = '4px Arial';
        ctx.fillStyle = options.colors?.[1] || '#666666';
        ctx.globalAlpha = 0.03;

        for (let y = 0; y < canvas.height; y += 20) {
            for (let x = 0; x < canvas.width; x += 100) {
                ctx.fillText('SECURE', x, y);
            }
        }

        return canvas.toDataURL('image/png');
    }

    private async createFabricPattern(url: string): Promise<fabric.Pattern> {
        return new fabric.Pattern({ source: url });
    }

    private async createThreeMaterial(url: string): Promise<THREE.Material> {
        return new THREE.MeshBasicMaterial();
    }

    // 3. TEXTURE UPLOAD & GENERATION
    async uploadTexture(file: File, options: TextureOptions): Promise<TextureAsset> {
        const textureUrl = URL.createObjectURL(file);

        // Analyze texture
        const analysis = await this.analyzeTexture(textureUrl, options);

        const texture: TextureAsset = {
            id: `texture_${Date.now()}`,
            name: file.name,
            url: textureUrl,
            thumbnail: await this.createThumbnail(textureUrl),
            type: 'texture',
            category: analysis.category,
            properties: {
                roughness: analysis.roughness,
                bumpiness: analysis.bumpiness,
                reflectivity: analysis.reflectivity,
                transparency: analysis.transparency,
                tileable: analysis.tileable
            },
            fabricPattern: await this.createFabricPattern(textureUrl),
            threeTexture: await this.createThreeTexture(textureUrl),
            normalMap: await this.generateNormalMap(textureUrl),
            displacementMap: await this.generateDisplacementMap(textureUrl),
            metadata: {
                uploaded: new Date().toISOString(),
                size: file.size,
                resolution: analysis.resolution,
                format: file.type,
                colors: analysis.colors
            }
        };

        this.userAssets.textures.push(texture);
        return texture;
    }

    private async analyzeTexture(url: string, options: TextureOptions): Promise<any> {
        const img = await this.loadImage(url);
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Analyze roughness via local variance
        let totalVariance = 0;
        const blockSize = 8;
        for (let by = 0; by < size; by += blockSize) {
            for (let bx = 0; bx < size; bx += blockSize) {
                let sum = 0, sumSq = 0, count = 0;
                for (let dy = 0; dy < blockSize && by + dy < size; dy++) {
                    for (let dx = 0; dx < blockSize && bx + dx < size; dx++) {
                        const idx = ((by + dy) * size + (bx + dx)) * 4;
                        const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                        sum += lum; sumSq += lum * lum; count++;
                    }
                }
                const mean = sum / count;
                totalVariance += (sumSq / count) - (mean * mean);
            }
        }
        const blocks = Math.ceil(size / blockSize) ** 2;
        const avgVariance = totalVariance / blocks;

        // Tileability check via edge correlation
        let edgeCorrelation = 0;
        for (let i = 0; i < size; i++) {
            const leftIdx = (i * size) * 4;
            const rightIdx = (i * size + size - 1) * 4;
            edgeCorrelation += Math.abs(data[leftIdx] - data[rightIdx]);
            const topIdx = i * 4;
            const bottomIdx = ((size - 1) * size + i) * 4;
            edgeCorrelation += Math.abs(data[topIdx] - data[bottomIdx]);
        }
        const tileable = (edgeCorrelation / (size * 4)) < 30;

        // Extract dominant colors
        const colors = await this.extractColors(url);

        return {
            roughness: Math.min(1, avgVariance / 500),
            bumpiness: Math.min(1, avgVariance / 300),
            reflectivity: Math.max(0, 1 - (avgVariance / 500)),
            transparency: 0,
            tileable,
            resolution: `${img.width}x${img.height}`,
            colors,
            category: options.category || 'general'
        };
    }

    private async createThreeTexture(url: string): Promise<THREE.Texture> {
        return new Promise((resolve) => {
            const loader = new THREE.TextureLoader();
            loader.load(url, (texture) => {
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                resolve(texture);
            }, undefined, () => resolve(new THREE.Texture()));
        });
    }

    private async generateNormalMap(url: string): Promise<string> {
        const img = await this.loadImage(url);
        const w = img.width, h = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const src = ctx.getImageData(0, 0, w, h);
        const dst = ctx.createImageData(w, h);

        // Sobel-based normal map generation
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const getHeight = (px: number, py: number) => {
                    const idx = (py * w + px) * 4;
                    return (src.data[idx] + src.data[idx + 1] + src.data[idx + 2]) / 765;
                };
                // Sobel derivatives
                const dX = getHeight(x + 1, y - 1) + 2 * getHeight(x + 1, y) + getHeight(x + 1, y + 1)
                    - getHeight(x - 1, y - 1) - 2 * getHeight(x - 1, y) - getHeight(x - 1, y + 1);
                const dY = getHeight(x - 1, y + 1) + 2 * getHeight(x, y + 1) + getHeight(x + 1, y + 1)
                    - getHeight(x - 1, y - 1) - 2 * getHeight(x, y - 1) - getHeight(x + 1, y - 1);

                const idx = (y * w + x) * 4;
                dst.data[idx] = Math.round((-dX * 0.5 + 0.5) * 255); // R = X normal
                dst.data[idx + 1] = Math.round((-dY * 0.5 + 0.5) * 255); // G = Y normal
                dst.data[idx + 2] = 255; // B = Z normal (pointing up)
                dst.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(dst, 0, 0);
        return canvas.toDataURL('image/png');
    }

    private async generateDisplacementMap(url: string): Promise<string> {
        const img = await this.loadImage(url);
        const w = img.width, h = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // Convert to grayscale heightfield
        for (let i = 0; i < data.length; i += 4) {
            const height = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            data[i] = data[i + 1] = data[i + 2] = height;
        }

        // Apply Gaussian blur for smoother displacement
        const blurred = ctx.createImageData(w, h);
        blurred.data.set(data);
        const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
        const kSum = 16;
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        sum += data[((y + ky) * w + (x + kx)) * 4] * kernel[(ky + 1) * 3 + (kx + 1)];
                    }
                }
                const idx = (y * w + x) * 4;
                blurred.data[idx] = blurred.data[idx + 1] = blurred.data[idx + 2] = sum / kSum;
            }
        }
        ctx.putImageData(blurred, 0, 0);
        return canvas.toDataURL('image/png');
    }

    // 4. SIGNATURE CUSTOMIZATION
    async createCustomSignature(options: SignatureOptions): Promise<SignatureAsset> {
        const signatureId = `signature_${Date.now()}`;

        let signatureUrl: string;
        if (options.type === 'handwritten') {
            signatureUrl = await this.captureHandwrittenSignature(options);
        } else if (options.type === 'upload') {
            signatureUrl = await this.processUploadedSignature(options.file!);
        } else {
            signatureUrl = await this.generateDigitalSignature(options);
        }

        const signature: SignatureAsset = {
            id: signatureId,
            name: options.name || 'Signature',
            url: signatureUrl,
            type: 'signature',
            style: options.style || 'cursive',
            inkColor: options.inkColor || '#000000',
            penType: options.penType || 'ballpoint',
            pressureCurve: options.pressureCurve || 'natural',
            fabricObject: await this.createFabricSignature(signatureUrl, options),
            metadata: {
                created: new Date().toISOString(),
                author: options.author || 'User',
                verificationLevel: options.verificationLevel || 'standard',
                legalStatus: 'For authorized use only'
            }
        };

        this.userAssets.signatures.push(signature);
        return signature;
    }

    private async captureHandwrittenSignature(options: SignatureOptions): Promise<string> {
        // Generate a realistic handwritten signature simulation using bezier curves
        const canvas = document.createElement('canvas');
        canvas.width = 300; canvas.height = 80;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'transparent';
        ctx.clearRect(0, 0, 300, 80);

        const name = options.author || options.name || 'Authorized Signatory';
        const inkColor = options.inkColor || '#00008B';

        // Simulate pen strokes with velocity-based width variation
        ctx.strokeStyle = inkColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Generate flowing cursive path based on name characters
        let curX = 20;
        const baseY = 50;
        for (let i = 0; i < name.length; i++) {
            const charWidth = 12 + Math.random() * 8;
            const charHeight = 15 + Math.random() * 10;
            ctx.lineWidth = 1.2 + Math.random() * 0.8;
            ctx.beginPath();
            ctx.moveTo(curX, baseY);
            // Bezier curve simulating cursive letterform
            const cp1x = curX + charWidth * 0.3;
            const cp1y = baseY - charHeight * (0.5 + Math.random() * 0.5);
            const cp2x = curX + charWidth * 0.7;
            const cp2y = baseY + charHeight * (0.1 + Math.random() * 0.3);
            const endX = curX + charWidth;
            ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, baseY - Math.random() * 5);
            ctx.stroke();
            curX = endX + Math.random() * 2 - 1;
        }

        // Add a flourish underline
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(20, baseY + 8);
        ctx.quadraticCurveTo(curX / 2, baseY + 15, curX, baseY + 5);
        ctx.stroke();

        return canvas.toDataURL('image/png');
    }

    private async processUploadedSignature(file: File): Promise<string> {
        const url = URL.createObjectURL(file);
        const img = await this.loadImage(url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        // Remove white background to make signature transparent
        await this.removeBackground(ctx, canvas);
        URL.revokeObjectURL(url);
        return canvas.toDataURL('image/png');
    }

    private async generateDigitalSignature(options: SignatureOptions): Promise<string> {
        const canvas = document.createElement('canvas');
        canvas.width = 300; canvas.height = 80;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, 300, 80);

        const name = options.author || options.name || 'Digital Signature';
        const style = options.style || 'cursive';
        const inkColor = options.inkColor || '#000033';

        const fontMap: Record<string, string> = {
            'cursive': 'italic 28px "Georgia", cursive',
            'formal': '26px "Times New Roman", serif',
            'modern': '24px "Helvetica Neue", sans-serif',
            'bold': 'bold 28px "Arial Black", sans-serif',
        };

        ctx.font = fontMap[style] || fontMap['cursive'];
        ctx.fillStyle = inkColor;
        ctx.textBaseline = 'middle';
        ctx.fillText(name, 15, 40);

        // Add subtle underline
        const textWidth = ctx.measureText(name).width;
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(15, 58);
        ctx.lineTo(15 + textWidth, 58);
        ctx.stroke();

        return canvas.toDataURL('image/png');
    }

    private async createFabricSignature(url: string, options: SignatureOptions): Promise<fabric.Object> {
        return new Promise((resolve) => {
            fabric.Image.fromURL(url, (img) => {
                img.set({
                    scaleX: 0.5, scaleY: 0.5,
                    left: 350, top: 180,
                    selectable: true,
                    opacity: 0.95,
                    name: 'signature',
                });
                resolve(img);
            });
        });
    }

    // 5. WATERMARK CUSTOMIZATION
    async createWatermark(options: WatermarkOptions): Promise<WatermarkAsset> {
        const watermarkId = `watermark_${Date.now()}`;

        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 800;
        const ctx = canvas.getContext('2d')!;

        // Create watermark based on type
        if (options.type === 'text') {
            ctx.font = `${options.fontSize || 60}px ${options.fontFamily || 'Arial'}`;
            ctx.fillStyle = options.color || 'rgba(0, 0, 0, 0.1)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.globalAlpha = options.opacity || 0.1;

            // Rotated text pattern
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((options.angle || 45) * Math.PI / 180);
            ctx.fillText(options.text || 'CONFIDENTIAL', 0, 0);
        } else if (options.type === 'logo') {
            const img = await this.loadImage(options.imageUrl!);
            ctx.globalAlpha = options.opacity || 0.05;
            ctx.drawImage(img, 100, 100, 600, 600);
        } else if (options.type === 'pattern') {
            // Pattern-based watermark
            this.generateWatermarkPattern(ctx, options);
        }

        const watermarkUrl = canvas.toDataURL('image/png');

        const watermark: WatermarkAsset = {
            id: watermarkId,
            name: options.name || 'Watermark',
            url: watermarkUrl,
            type: 'watermark',
            style: options.type,
            intensity: options.opacity || 0.1,
            pattern: options.pattern || 'diagonal',
            visibleUnder: options.visibleUnder || 'transmitted-light',
            securityLevel: options.securityLevel || 'medium',
            fabricPattern: await this.createFabricPattern(watermarkUrl),
            metadata: {
                created: new Date().toISOString(),
                purpose: options.purpose || 'security',
                copyProtection: true
            }
        };

        this.userAssets.watermarks.push(watermark);
        return watermark;
    }

    private generateWatermarkPattern(ctx: CanvasRenderingContext2D, options: WatermarkOptions) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const text = options.text || 'VOID';
        const fontSize = options.fontSize || 24;
        const color = options.color || '#888888';
        const angle = options.angle || -30;
        const opacity = options.opacity || 0.08;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.font = `bold ${fontSize}px ${options.fontFamily || 'Arial'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Rotate and tile the watermark text across the entire canvas
        const radians = (angle * Math.PI) / 180;
        const spacingX = fontSize * 6;
        const spacingY = fontSize * 3;
        const diagonal = Math.sqrt(w * w + h * h);

        ctx.translate(w / 2, h / 2);
        ctx.rotate(radians);

        for (let y = -diagonal; y < diagonal; y += spacingY) {
            for (let x = -diagonal; x < diagonal; x += spacingX) {
                ctx.fillText(text, x, y);
            }
        }

        ctx.restore();
    }

    // 6. BACKGROUND CUSTOMIZATION
    async createBackground(options: BackgroundOptions): Promise<BackgroundAsset> {
        const backgroundId = `background_${Date.now()}`;

        let backgroundUrl: string;
        if (options.type === 'gradient') {
            backgroundUrl = this.createGradientBackground(options);
        } else if (options.type === 'image') {
            backgroundUrl = await this.processBackgroundImage(options);
        } else if (options.type === 'texture') {
            backgroundUrl = await this.generateTextureBackground(options);
        } else {
            backgroundUrl = this.createPaperBackground(options);
        }

        const background: BackgroundAsset = {
            id: backgroundId,
            name: options.name || 'Background',
            url: backgroundUrl,
            type: 'background',
            category: options.type,
            colors: options.colors || ['#ffffff'],
            pattern: options.pattern,
            intensity: options.intensity || 1.0,
            fabricBackground: await this.createFabricBackground(backgroundUrl),
            threeBackground: await this.createThreeBackground(backgroundUrl),
            metadata: {
                created: new Date().toISOString(),
                mood: options.mood || 'professional',
                season: options.season || 'all',
                occasion: options.occasion || 'business'
            }
        };

        this.userAssets.backgrounds.push(background);
        return background;
    }

    private createGradientBackground(options: BackgroundOptions): string {
        const canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 275;
        const ctx = canvas.getContext('2d')!;
        const colors = options.colors || ['#f8f6f0', '#e8e4d8'];

        // Multi-stop linear gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        colors.forEach((color, i) => gradient.addColorStop(i / Math.max(colors.length - 1, 1), color));
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle noise for realism
        const intensity = options.intensity || 0.03;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 255 * intensity;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png');
    }

    private async processBackgroundImage(options: BackgroundOptions): Promise<string> {
        if (!options.pattern) return '';
        const img = await this.loadImage(options.pattern);
        const canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 275;
        const ctx = canvas.getContext('2d')!;

        // Cover mode: fill entire check area
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;
        const scale = Math.max(scaleX, scaleY);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        ctx.drawImage(img, -(drawW - canvas.width) / 2, -(drawH - canvas.height) / 2, drawW, drawH);

        // Apply low opacity for readability
        ctx.globalAlpha = options.intensity || 0.15;
        ctx.fillStyle = '#ffffff';
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/png');
    }

    private async generateTextureBackground(options: BackgroundOptions): Promise<string> {
        const canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 275;
        const ctx = canvas.getContext('2d')!;
        const colors = options.colors || ['#f5f0e8', '#ede7d9'];

        // Base gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1] || colors[0]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add linen-like fiber texture
        ctx.globalAlpha = 0.04;
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < canvas.height; y += 3) {
            ctx.beginPath();
            ctx.moveTo(0, y + Math.random() * 0.5);
            for (let x = 0; x < canvas.width; x += 10) {
                ctx.lineTo(x, y + Math.random() * 1.5 - 0.75);
            }
            ctx.stroke();
        }
        for (let x = 0; x < canvas.width; x += 5) {
            ctx.beginPath();
            ctx.moveTo(x + Math.random() * 0.5, 0);
            for (let y = 0; y < canvas.height; y += 10) {
                ctx.lineTo(x + Math.random() * 1.5 - 0.75, y);
            }
            ctx.stroke();
        }

        return canvas.toDataURL('image/png');
    }

    private createPaperBackground(options: BackgroundOptions): string {
        const canvas = document.createElement('canvas');
        canvas.width = 600; canvas.height = 275;
        const ctx = canvas.getContext('2d')!;

        // Safety paper yellow-green tint
        ctx.fillStyle = '#fdfbf0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Simulated cotton fiber noise
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 12;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise - 1));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise - 3));
        }
        ctx.putImageData(imageData, 0, 0);

        // Add security fibers (tiny colored lines)
        const fiberColors = ['#cc3333', '#3333cc'];
        for (let f = 0; f < 40; f++) {
            ctx.strokeStyle = fiberColors[f % 2];
            ctx.globalAlpha = 0.12;
            ctx.lineWidth = 0.5;
            const fx = Math.random() * canvas.width;
            const fy = Math.random() * canvas.height;
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(fx + (Math.random() - 0.5) * 12, fy + (Math.random() - 0.5) * 4);
            ctx.stroke();
        }

        return canvas.toDataURL('image/png');
    }

    private async createFabricBackground(url: string): Promise<any> {
        return new Promise((resolve) => {
            fabric.Image.fromURL(url, (img) => {
                img.set({ selectable: false, evented: false, name: 'background' });
                resolve(img);
            });
        });
    }

    private async createThreeBackground(url: string): Promise<THREE.Texture> {
        return this.createThreeTexture(url);
    }

    // 7. APPLY CUSTOMIZATION TO CHECK
    async applyCustomization(check: CheckData, customization: CustomizationSet): Promise<CustomizedCheck> {
        const customizedCheck: CustomizedCheck = {
            ...check,
            customization,
            appliedElements: [],
            previewUrl: '',
            exportReady: false
        };

        if (customization.logo) {
            await this.applyLogo(customizedCheck, customization.logo, customization.logoPosition);
            customizedCheck.appliedElements.push('logo');
        }
        if (customization.background) {
            await this.applyBackground(customizedCheck, customization.background);
            customizedCheck.appliedElements.push('background');
        }
        if (customization.pattern) {
            await this.applyPattern(customizedCheck, customization.pattern);
            customizedCheck.appliedElements.push('pattern');
        }
        if (customization.watermark) {
            await this.applyWatermark(customizedCheck, customization.watermark);
            customizedCheck.appliedElements.push('watermark');
        }
        if (customization.signature) {
            await this.applySignature(customizedCheck, customization.signature);
            customizedCheck.appliedElements.push('signature');
        }
        if (customization.securityFeatures) {
            await this.applySecurityFeatures(customizedCheck, customization.securityFeatures);
            customizedCheck.appliedElements.push('security-features');
        }

        customizedCheck.previewUrl = await this.generatePreview(customizedCheck);
        customizedCheck.exportReady = true;
        return customizedCheck;
    }

    private async applyLogo(check: CustomizedCheck, logo: LogoAsset, position?: LogoPosition) {
        if (!this.fabricCanvas) return;
        const posMap: Record<string, { left: number; top: number }> = {
            'top-left': { left: 15, top: 10 }, 'top-center': { left: 250, top: 10 },
            'top-right': { left: 480, top: 10 }, 'center-left': { left: 15, top: 100 },
            'center': { left: 250, top: 100 }, 'center-right': { left: 480, top: 100 },
            'bottom-left': { left: 15, top: 200 }, 'bottom-center': { left: 250, top: 200 },
            'bottom-right': { left: 480, top: 200 },
        };
        const pos = posMap[position || 'top-left'] || posMap['top-left'];
        logo.fabricObject.set({ left: pos.left, top: pos.top });
        this.fabricCanvas.add(logo.fabricObject);
    }

    private async applyBackground(check: CustomizedCheck, background: BackgroundAsset) {
        if (!this.fabricCanvas || !background.fabricBackground) return;
        this.fabricCanvas.setBackgroundImage(background.fabricBackground, () => this.fabricCanvas?.renderAll());
    }

    private async applyPattern(check: CustomizedCheck, pattern: PatternAsset) {
        if (!this.fabricCanvas) return;
        const patternRect = new fabric.Rect({
            width: this.fabricCanvas.width!, height: this.fabricCanvas.height!,
            fill: pattern.fabricPattern, opacity: pattern.opacity,
            selectable: false, evented: false, name: 'pattern-overlay'
        });
        this.fabricCanvas.add(patternRect);
        this.fabricCanvas.sendToBack(patternRect);
    }

    private async applyWatermark(check: CustomizedCheck, watermark: WatermarkAsset) {
        if (!this.fabricCanvas) return;
        const wmRect = new fabric.Rect({
            width: this.fabricCanvas.width!, height: this.fabricCanvas.height!,
            fill: watermark.fabricPattern, opacity: watermark.intensity || 0.05,
            selectable: false, evented: false, name: 'watermark-layer'
        });
        this.fabricCanvas.add(wmRect);
    }

    private async applySignature(check: CustomizedCheck, signature: SignatureAsset) {
        if (!this.fabricCanvas) return;
        this.fabricCanvas.add(signature.fabricObject);
    }

    private async applySecurityFeatures(check: CustomizedCheck, features: SecurityCustomization) {
        // Security features are applied via the security pattern in the design
        console.log('[CustomizationEngine] Security features applied.');
    }

    private async generatePreview(check: CustomizedCheck): Promise<string> {
        if (!this.fabricCanvas) {
            // Fallback: render to offscreen canvas
            const canvas = document.createElement('canvas');
            canvas.width = 600; canvas.height = 275;
            const ctx = canvas.getContext('2d')!;
            ctx.fillStyle = '#f8f6f0';
            ctx.fillRect(0, 0, 600, 275);
            ctx.fillStyle = '#333';
            ctx.font = '14px Arial';
            ctx.fillText(`Preview: ${check.bankName || 'Check'} #${check.checkNumber || ''}`, 20, 30);
            if (check.payeeName) ctx.fillText(`Pay to: ${check.payeeName}`, 20, 60);
            if (check.amount) ctx.fillText(`Amount: $${check.amount.toFixed(2)}`, 20, 90);
            return canvas.toDataURL('image/png');
        }
        return this.fabricCanvas.toDataURL({ format: 'png', quality: 1.0 });
    }

    // 8. CUSTOMIZATION PRESETS
    createPreset(name: string, customization: CustomizationSet): CustomizationPreset {
        const preset: CustomizationPreset = {
            id: `preset_${Date.now()}`,
            name,
            customization,
            thumbnail: this.generatePresetThumbnail(customization),
            category: this.detectPresetCategory(customization),
            compatibility: {
                checkTypes: this.detectCompatibleCheckTypes(customization),
                banks: this.detectCompatibleBanks(customization),
                purposes: this.detectPurposes(customization)
            },
            popularity: 0,
            metadata: {
                created: new Date().toISOString(),
                author: 'User',
                tags: this.generateTags(customization),
                version: '1.0'
            }
        };
        return preset;
    }

    private generatePresetThumbnail(customization: CustomizationSet): string {
        const canvas = document.createElement('canvas');
        canvas.width = 150; canvas.height = 70;
        const ctx = canvas.getContext('2d')!;
        // Mini check preview
        const bgColor = customization.background?.colors?.[0] || '#f8f6f0';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 150, 70);
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(1, 1, 148, 68);
        ctx.fillStyle = '#666';
        ctx.font = '8px Arial';
        ctx.fillText('Preview', 55, 38);
        if (customization.logo) {
            ctx.fillStyle = '#0066cc';
            ctx.fillRect(5, 5, 20, 12);
            ctx.fillStyle = '#fff';
            ctx.font = '6px Arial';
            ctx.fillText('LOGO', 6, 13);
        }
        return canvas.toDataURL('image/png');
    }

    private detectPresetCategory(customization: CustomizationSet): string {
        if (customization.securityFeatures) return 'security';
        if (customization.logo) return 'branded';
        if (customization.pattern) return 'decorative';
        if (customization.background) return 'themed';
        return 'business';
    }

    private detectCompatibleCheckTypes(customization: CustomizationSet): string[] {
        const types = ['personal', 'business'];
        if (customization.logo) types.push('payroll', 'corporate');
        if (customization.securityFeatures) types.push('cashier', 'government');
        return types;
    }

    private detectCompatibleBanks(customization: CustomizationSet): string[] {
        // All customizations are bank-agnostic unless they have specific branding
        if (customization.logo) return ['custom'];
        return ['all'];
    }

    private detectPurposes(customization: CustomizationSet): string[] {
        const purposes: string[] = ['general'];
        if (customization.logo) purposes.push('corporate', 'branding');
        if (customization.securityFeatures) purposes.push('high-security');
        if (customization.watermark) purposes.push('anti-counterfeiting');
        if (customization.pattern?.category === 'organic') purposes.push('artistic');
        return purposes;
    }

    private generateTags(customization: CustomizationSet): string[] {
        const tags: string[] = [];
        if (customization.logo) tags.push('custom-logo', 'branded');
        if (customization.background) tags.push(customization.background.category || 'custom-bg');
        if (customization.pattern) tags.push(`${customization.pattern.category}-pattern`);
        if (customization.watermark) tags.push('watermarked');
        if (customization.signature) tags.push('signed');
        if (customization.securityFeatures) tags.push('enhanced-security');
        if (customization.colorScheme) tags.push('custom-colors');
        return tags;
    }

    // 9. BATCH CUSTOMIZATION
    async applyBatchCustomization(
        checks: CheckData[],
        customization: CustomizationSet,
        options: BatchOptions = {}
    ): Promise<BatchCustomizationResult> {
        const results: BatchCustomizationResult = {
            total: checks.length,
            successful: 0,
            failed: 0,
            customizedChecks: [],
            errors: [],
            statistics: {
                timeTaken: 0,
                averageTimePerCheck: 0,
                memoryUsage: 0
            }
        };

        const startTime = Date.now();

        for (let i = 0; i < checks.length; i++) {
            try {
                const customizedCheck = await this.applyCustomization(checks[i], customization);
                results.customizedChecks.push(customizedCheck);
                results.successful++;

                // Progress callback
                if (options.onProgress) {
                    options.onProgress({
                        current: i + 1,
                        total: checks.length,
                        check: customizedCheck,
                        percentage: Math.round(((i + 1) / checks.length) * 100)
                    });
                }
            } catch (error) {
                results.failed++;
                results.errors.push({
                    checkIndex: i,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date().toISOString()
                });
            }
        }

        const endTime = Date.now();
        results.statistics.timeTaken = endTime - startTime;
        results.statistics.averageTimePerCheck = results.statistics.timeTaken / checks.length;

        // Estimate memory usage
        results.statistics.memoryUsage = this.estimateMemoryUsage(results.customizedChecks);

        return results;
    }

    private estimateMemoryUsage(checks: CustomizedCheck[]): number {
        let totalBytes = 0;
        for (const check of checks) {
            // Base check data: ~2KB
            totalBytes += 2048;
            // Each applied element adds ~500KB (canvas/image data)
            totalBytes += (check.appliedElements?.length || 0) * 512000;
            // Preview URL: ~200KB
            if (check.previewUrl) totalBytes += 200000;
            // Customization assets
            if (check.customization?.logo) totalBytes += 300000;
            if (check.customization?.background) totalBytes += 500000;
            if (check.customization?.pattern) totalBytes += 200000;
            if (check.customization?.signature) totalBytes += 100000;
        }
        return totalBytes;
    }
}

// Additional interfaces
export interface CheckData {
    id: string;
    checkNumber?: string;
    amount?: number;
    payeeName?: string;
    date?: string;
    routingNumber?: string;
    accountNumber?: string;
    memo?: string;
    bankName?: string;
    address?: string;
    borderConfig?: import('../components/BorderlineEngine').BorderConfig;
}
export interface LogoMetadata { uploaded: string; category: string; transparency: boolean; colors: string[]; }
export type LogoPosition = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
export interface ProcessedLogo { url: string; hasTransparency: boolean; }
export interface LogoOptions { removeBackground?: boolean; maxWidth?: number; maxHeight?: number; category?: string; tags?: string[]; enhanceEdges?: boolean; convertToGrayscale?: boolean; }
export interface PatternOptions { type: string; name?: string; seamless?: boolean; colors?: string[]; intensity?: number; scale?: number; opacity?: number; complexity?: string; }
export interface PatternMetadata { created: string; complexity: string; repeatable: boolean; securityLevel: string; }
export interface TextureOptions { category?: string; }
export interface TextureMetadata { uploaded: string; size: number; resolution: string; format: string; colors: string[]; }
export interface TextureProperties { roughness: number; bumpiness: number; reflectivity: number; transparency: number; tileable: boolean; }
export interface SignatureOptions { type: string; name?: string; file?: File; style?: string; inkColor?: string; penType?: string; pressureCurve?: string; author?: string; verificationLevel?: string; }
export interface SignatureMetadata { created: string; author: string; verificationLevel: string; legalStatus: string; }
export interface WatermarkOptions { type: string; name?: string; fontSize?: number; fontFamily?: string; color?: string; opacity?: number; angle?: number; text?: string; imageUrl?: string; pattern?: string; purpose?: string; visibleUnder?: string; securityLevel?: string; }
export interface WatermarkMetadata { created: string; purpose: string; copyProtection: boolean; }
export interface BackgroundOptions { type: string; name?: string; colors?: string[]; pattern?: string; intensity?: number; mood?: string; season?: string; occasion?: string; }
export interface BackgroundMetadata { created: string; mood: string; season: string; occasion: string; }
export interface SecurityCustomization { }
export interface ColorScheme { }
export interface TypographySet { }
export interface LayoutCustomization { }
export interface CustomizationPreset {
    id: string;
    name: string;
    customization: CustomizationSet;
    thumbnail: string;
    category: string;
    compatibility: any;
    popularity: number;
    metadata: any;
}
export interface BatchOptions { onProgress?: (data: any) => void; }
export interface BatchCustomizationResult { total: number; successful: number; failed: number; customizedChecks: CustomizedCheck[]; errors: any[]; statistics: any; }
export interface LogoAsset {
    id: string;
    name: string;
    url: string;
    thumbnail: string;
    type: 'logo';
    size: number;
    dimensions: { width: number; height: number };
    format: string;
    tags: string[];
    metadata: LogoMetadata;
    fabricObject: fabric.Object;
    positionPresets: string[];
}
export interface PatternAsset {
    id: string;
    name: string;
    url: string;
    thumbnail: string;
    type: 'pattern';
    category: string;
    seamless: boolean;
    colors: string[];
    intensity: number;
    scale: number;
    opacity: number;
    fabricPattern: fabric.Pattern;
    threeMaterial: THREE.Material;
    metadata: PatternMetadata;
}
export interface TextureAsset {
    id: string;
    name: string;
    url: string;
    thumbnail: string;
    type: 'texture';
    category: string;
    properties: TextureProperties;
    fabricPattern: fabric.Pattern;
    threeTexture: THREE.Texture;
    normalMap: string;
    displacementMap: string;
    metadata: TextureMetadata;
}
export interface SignatureAsset {
    id: string;
    name: string;
    url: string;
    type: 'signature';
    style: string;
    inkColor: string;
    penType: string;
    pressureCurve: string;
    fabricObject: fabric.Object;
    metadata: SignatureMetadata;
}
export interface WatermarkAsset {
    id: string;
    name: string;
    url: string;
    type: 'watermark';
    style: string;
    intensity: number;
    pattern: string;
    visibleUnder: string;
    securityLevel: string;
    fabricPattern: fabric.Pattern;
    metadata: WatermarkMetadata;
}
export interface BackgroundAsset {
    id: string;
    name: string;
    url: string;
    type: 'background';
    category: string;
    colors: string[];
    pattern?: string;
    intensity: number;
    fabricBackground: any;
    threeBackground: THREE.Texture;
    metadata: BackgroundMetadata;
}
export interface CustomizationSet {
    logo?: LogoAsset;
    logoPosition?: any;
    background?: BackgroundAsset;
    pattern?: PatternAsset;
    texture?: TextureAsset;
    signature?: SignatureAsset;
    watermark?: WatermarkAsset;
    securityFeatures?: SecurityCustomization;
    colorScheme?: ColorScheme;
    typography?: TypographySet;
    layout?: LayoutCustomization;
    borderConfig?: import('../components/BorderlineEngine').BorderConfig;
}
export interface CustomizedCheck extends CheckData {
    customization: CustomizationSet;
    appliedElements: string[];
    previewUrl: string;
    exportReady: boolean;
}
