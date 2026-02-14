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

    private async removeBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) { /* Placeholder */ }
    private enhanceEdges(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) { /* Placeholder */ }
    private convertToGrayscale(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) { /* Placeholder */ }
    private hasTransparency(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): boolean { return false; }
    private async createThumbnail(url: string): Promise<string> { return url; }
    private async extractColors(url: string): Promise<string[]> { return ['#000000']; }
    private generateLogoPositions(): LogoPosition[] { return ['top-left']; }


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

    private async generateGeometricPattern(options: PatternOptions): Promise<string> { return ''; }
    private async generateOrganicPattern(options: PatternOptions): Promise<string> { return ''; }
    private async generateCustomPattern(options: PatternOptions): Promise<string> { return ''; }

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

    private async analyzeTexture(url: string, options: TextureOptions): Promise<any> { return {}; }
    private async createThreeTexture(url: string): Promise<THREE.Texture> { return new THREE.Texture(); }
    private async generateNormalMap(url: string): Promise<string> { return ''; }
    private async generateDisplacementMap(url: string): Promise<string> { return ''; }

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

    private async captureHandwrittenSignature(options: SignatureOptions): Promise<string> { return ''; }
    private async processUploadedSignature(file: File): Promise<string> { return URL.createObjectURL(file); }
    private async generateDigitalSignature(options: SignatureOptions): Promise<string> { return ''; }
    private async createFabricSignature(url: string, options: SignatureOptions): Promise<fabric.Object> { return {} as any; }

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

    private generateWatermarkPattern(ctx: CanvasRenderingContext2D, options: WatermarkOptions) { /* Placeholder */ }

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

    private createGradientBackground(options: BackgroundOptions): string { return ''; }
    private async processBackgroundImage(options: BackgroundOptions): Promise<string> { return ''; }
    private async generateTextureBackground(options: BackgroundOptions): Promise<string> { return ''; }
    private createPaperBackground(options: BackgroundOptions): string { return ''; }

    private async createFabricBackground(url: string): Promise<any> {
        // fabric.Background does not exist as a class, likely meant a fabric.Image or patterns used as background
        // Returning any for now
        return {} as any;
    }
    private async createThreeBackground(url: string): Promise<THREE.Texture> { return new THREE.Texture(); }

    // 7. APPLY CUSTOMIZATION TO CHECK
    async applyCustomization(check: CheckData, customization: CustomizationSet): Promise<CustomizedCheck> {
        const customizedCheck: CustomizedCheck = {
            ...check,
            customization,
            appliedElements: [],
            previewUrl: '',
            exportReady: false
        };

        // Apply logo if provided
        if (customization.logo) {
            await this.applyLogo(customizedCheck, customization.logo, customization.logoPosition);
            customizedCheck.appliedElements.push('logo');
        }

        // Apply background
        if (customization.background) {
            await this.applyBackground(customizedCheck, customization.background);
            customizedCheck.appliedElements.push('background');
        }

        // Apply pattern
        if (customization.pattern) {
            await this.applyPattern(customizedCheck, customization.pattern);
            customizedCheck.appliedElements.push('pattern');
        }

        // Apply watermark
        if (customization.watermark) {
            await this.applyWatermark(customizedCheck, customization.watermark);
            customizedCheck.appliedElements.push('watermark');
        }

        // Apply signature
        if (customization.signature) {
            await this.applySignature(customizedCheck, customization.signature);
            customizedCheck.appliedElements.push('signature');
        }

        // Apply security features
        if (customization.securityFeatures) {
            await this.applySecurityFeatures(customizedCheck, customization.securityFeatures);
            customizedCheck.appliedElements.push('security-features');
        }

        // Generate preview
        customizedCheck.previewUrl = await this.generatePreview(customizedCheck);
        customizedCheck.exportReady = true;

        return customizedCheck;
    }

    private async applyLogo(check: CustomizedCheck, logo: LogoAsset, position?: LogoPosition) { }
    private async applyBackground(check: CustomizedCheck, background: BackgroundAsset) { }
    private async applyPattern(check: CustomizedCheck, pattern: PatternAsset) { }
    private async applyWatermark(check: CustomizedCheck, watermark: WatermarkAsset) { }
    private async applySignature(check: CustomizedCheck, signature: SignatureAsset) { }
    private async applySecurityFeatures(check: CustomizedCheck, features: SecurityCustomization) { }
    private async generatePreview(check: CustomizedCheck): Promise<string> { return ''; }

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

    private generatePresetThumbnail(customization: CustomizationSet): string { return ''; }
    private detectPresetCategory(customization: CustomizationSet): string { return 'business'; }
    private detectCompatibleCheckTypes(customization: CustomizationSet): string[] { return ['business']; }
    private detectCompatibleBanks(customization: CustomizationSet): string[] { return ['all']; }
    private detectPurposes(customization: CustomizationSet): string[] { return ['general']; }
    private generateTags(customization: CustomizationSet): string[] { return []; }

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

    private estimateMemoryUsage(checks: CustomizedCheck[]): number { return 0; }
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
}
export interface CustomizedCheck extends CheckData {
    customization: CustomizationSet;
    appliedElements: string[];
    previewUrl: string;
    exportReady: boolean;
}
