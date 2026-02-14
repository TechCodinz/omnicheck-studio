/**
 * UniversalDocumentCloneEngine - Bridge / Compatibility Layer
 * 
 * This file consolidates with UniversalDocumentCloningEngine.
 * It re-exports the canonical engine and provides backward-compatible
 * type aliases for consumers that depend on the original type names.
 */

import { fabric } from 'fabric';

// Re-export values from the canonical engine
export {
    UniversalDocumentCloningEngine,
    universalDocumentCloningEngine,
} from './UniversalDocumentCloningEngine';

// Re-export types from the canonical engine
export type {
    DocumentUpload,
    DocumentAnalysis,
    DetectedDocumentType,
    FieldType,
    BoundingBox,
    FieldValidation,
    ExtractedField,
    DocumentLayout,
    PageLayout,
    LayoutRegion,
    TextBlock,
    ImageRegion,
    TableRegion,
    TableCell,
    QualityAssessment,
    FieldModification,
    BatchProcessingResult,
} from './UniversalDocumentCloningEngine';

import {
    UniversalDocumentCloningEngine,
    type DetectedDocumentType,
    type ClonedDocument as CloningClonedDocument,
    type CloneOptions as CloningCloneOptions,
    type DocumentMetadata as CloningDocumentMetadata,
    type EditableField as CloningEditableField,
} from './UniversalDocumentCloningEngine';

// ============== BACKWARD-COMPATIBLE TYPES ==============
// These preserve the original type shapes that existing consumers depend on.

export type DocumentType = 'id' | 'invoice' | 'certificate' | 'contract' | 'check' | 'generic';
export type ExportFormat = 'pdf' | 'png' | 'jpg' | 'svg' | 'docx' | 'excel' | 'csv' | 'xml' | 'txt' | 'html';

export interface CloneOptions {
    microDetailLevel?: 'low' | 'medium' | 'high' | 'ultra';
    preserveSecurityFeatures?: boolean;
    extractAllData?: boolean;
}

export interface DocumentDetails {
    imageData: ImageData;
    microDetails: MicroDetails;
    colors: ColorPalette;
    textures: TextureAnalysis;
    patterns: PatternDetection;
    securityFeatures?: SecurityFeature[];
    fonts: FontAnalysis;
    layout: LayoutAnalysis;
    metadata: FileMetadata;
}

export interface MicroDetails {
    edges: EdgeDetection;
    grainPattern: GrainPattern;
    fibers: PaperFibers;
    inkBleed: InkBleedAnalysis;
    wearPatterns: WearPatterns;
    printMethod: PrintMethod;
    materialTexture: MaterialTexture;
    colorVariations: ColorVariations;
}

export interface EditableTemplate {
    id: string;
    fabricCanvas: fabric.Canvas;
    fields: EditableField[];
    microDetails: MicroDetails;
    type: DocumentType;
    metadata: DocumentMetadata;
}

export interface EditableField {
    id: string;
    type: 'text' | 'image' | 'signature' | 'barcode' | 'qr';
    name: string;
    value: any;
    rect: { x: number; y: number; width: number; height: number };
    style?: any;
}

export interface ClonedDocument {
    id: string;
    originalType: DocumentType;
    type: DocumentType;
    details: DocumentDetails;
    extractedData: any;
    template: EditableTemplate;
    editableFields: EditableField[];
    securityFeatures?: SecurityFeatures;
    validation?: ValidationResult;
    microDetails: MicroDetails;
    preview: string;
    exportFormats: ExportFormat[];
    metadata: DocumentMetadata;
}

export interface ExportedDocument {
    data: Blob;
    mimeType: string;
    size: number;
    format: ExportFormat;
    filename: string;
    metadata: any;
}

// Supporting interfaces
interface EdgeDetection { intensity: number; map: number[][]; }
interface GrainPattern { density: number; distribution: 'uniform' | 'gaussian'; map: ImageData; }
interface PaperFibers { count: number; orientation: number; map: ImageData; }
interface InkBleedAnalysis { amount: number; spread: number; }
interface WearPatterns { scratches: number; folds: number; map: ImageData; }
interface PrintMethod { method: 'offset' | 'digital' | 'laser' | 'inkjet'; confidence: number; }
interface MaterialTexture { roughness: number; reflectivity: number; }
interface ColorVariations { deltaE: number; map: ImageData; }
interface SecurityFeatures { features: SecurityFeature[]; level: string; }
interface SecurityFeature { type: string; location: any; confidence: number; }
interface ValidationResult { isValid: boolean; checks: any[]; warnings: any[]; errors: any[]; confidence: number; verificationLevel: string; }
interface DocumentMetadata { originalFile: string; clonedAt: string; resolution: string; confidence: number; }
interface ColorPalette { primary: string[]; secondary: string[]; background: string; }
interface TextureAnalysis { type: string; quality: number; }
interface PatternDetection { patterns: any[]; reliability: number; }
interface FontAnalysis { fonts: any[]; sizes: number[]; }
interface LayoutAnalysis { width: number; height: number; regions: any[]; }
interface FileMetadata { size: number; lastModified: number; type: string; }
interface BatchCloneResult { total: number; successful: number; failed: number; results: any[]; statistics: any; }
interface BatchCloneOptions extends CloneOptions { onProgress?: (progress: any) => void; }

// ============== BRIDGE CLASS ==============
// Wraps UniversalDocumentCloningEngine with the original API surface
// for backward compatibility. New code should use UniversalDocumentCloningEngine directly.

export class UniversalDocumentCloneEngine {
    private engine: UniversalDocumentCloningEngine;

    constructor() {
        this.engine = new UniversalDocumentCloningEngine();
    }

    /**
     * Clone a document with micro-detail preservation.
     * Delegates to UniversalDocumentCloningEngine and maps types.
     */
    async cloneDocument(file: File, options: CloneOptions = {}): Promise<ClonedDocument> {
        const cloningResult = await this.engine.cloneDocument(file);

        // Map DetectedDocumentType → simple DocumentType
        const typeMap: Record<string, DocumentType> = {
            'DRIVERS_LICENSE': 'id', 'STATE_ID': 'id', 'PASSPORT': 'id',
            'SOCIAL_SECURITY_CARD': 'id', 'GREEN_CARD': 'id', 'VISA': 'id',
            'BIRTH_CERTIFICATE': 'id',
            'INVOICE': 'invoice', 'RECEIPT': 'invoice',
            'CERTIFICATE': 'certificate', 'DIPLOMA': 'certificate',
            'DEGREE': 'certificate', 'TRANSCRIPT': 'certificate',
            'CONTRACT': 'contract', 'DEED': 'contract', 'WILL': 'contract',
            'NDA': 'contract', 'LEASE_AGREEMENT': 'contract',
            'POWER_OF_ATTORNEY': 'contract',
            'CHECK': 'check',
        };
        const mappedType: DocumentType = typeMap[cloningResult.type] || 'generic';

        // Generate high-fidelity micro details from the source image
        const imageUrl = URL.createObjectURL(file);
        const img = await this.loadImage(imageUrl);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const microDetails = await this.extractMicroDetails(ctx, canvas);

        const details: DocumentDetails = {
            imageData,
            microDetails,
            colors: this.extractColorPalette(ctx, canvas),
            textures: await this.analyzeTextures(ctx, canvas),
            patterns: this.detectPatterns(ctx, canvas),
            securityFeatures: [],
            fonts: { fonts: ['Arial'], sizes: [12] },
            layout: { width: canvas.width, height: canvas.height, regions: [] },
            metadata: { size: file.size, lastModified: file.lastModified, type: file.type }
        };

        const fabricCanvas = new fabric.Canvas(null, { width: canvas.width, height: canvas.height });
        const template: EditableTemplate = {
            id: `tmpl_${Date.now()}`,
            fabricCanvas,
            fields: [],
            microDetails,
            type: mappedType,
            metadata: { originalFile: file.name, clonedAt: new Date().toISOString(), resolution: `${canvas.width}x${canvas.height}`, confidence: 0.95 }
        };

        URL.revokeObjectURL(imageUrl);

        return {
            id: cloningResult.id,
            originalType: mappedType,
            type: mappedType,
            details,
            extractedData: cloningResult.extractedData,
            template,
            editableFields: (cloningResult.editableFields || []).map(f => ({
                id: f.id, type: 'text' as const, name: f.name,
                value: f.value, rect: f.rect, style: f.style
            })),
            microDetails,
            preview: cloningResult.preview,
            exportFormats: ['pdf', 'png', 'jpg', 'svg'],
            metadata: {
                originalFile: cloningResult.metadata.originalFile,
                clonedAt: cloningResult.metadata.clonedAt,
                resolution: cloningResult.metadata.resolution,
                confidence: cloningResult.metadata.confidence
            }
        };
    }

    // ============== MICRO-DETAIL ANALYSIS ==============

    private async extractMicroDetails(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): Promise<MicroDetails> {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width, h = canvas.height;

        return {
            edges: this.detectMicroEdges(data, w, h),
            grainPattern: this.analyzeGrainPattern(data, w, h),
            fibers: this.simulatePaperFibers(data, w, h),
            inkBleed: this.analyzeInkBleed(data, w, h),
            wearPatterns: this.detectWearPatterns(data, w, h),
            printMethod: this.detectPrintMethod(data, w, h),
            materialTexture: this.analyzeMaterialTexture(data, w, h),
            colorVariations: this.analyzeColorVariations(data, w, h)
        };
    }

    private detectMicroEdges(data: Uint8ClampedArray, width: number, height: number): EdgeDetection {
        const map: number[][] = [];
        let totalIntensity = 0;
        for (let y = 1; y < height - 1; y++) {
            const row: number[] = [];
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const l = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const idxX = (y * width + (x + 1)) * 4;
                const lX = (data[idxX] + data[idxX + 1] + data[idxX + 2]) / 3;
                const idxY = ((y + 1) * width + x) * 4;
                const lY = (data[idxY] + data[idxY + 1] + data[idxY + 2]) / 3;
                const grad = Math.sqrt(Math.pow(l - lX, 2) + Math.pow(l - lY, 2));
                row.push(grad);
                totalIntensity += grad;
            }
            map.push(row);
        }
        return { intensity: totalIntensity / (width * height), map };
    }

    private analyzeGrainPattern(data: Uint8ClampedArray, width: number, height: number): GrainPattern {
        // High-frequency noise variance via block-wise standard deviation
        let totalVariance = 0;
        const blockSize = 8;
        let blockCount = 0;
        for (let by = 0; by < height - blockSize; by += blockSize) {
            for (let bx = 0; bx < width - blockSize; bx += blockSize) {
                let sum = 0, sumSq = 0;
                for (let dy = 0; dy < blockSize; dy++) {
                    for (let dx = 0; dx < blockSize; dx++) {
                        const idx = ((by + dy) * width + (bx + dx)) * 4;
                        const v = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        sum += v; sumSq += v * v;
                    }
                }
                const n = blockSize * blockSize;
                const mean = sum / n;
                totalVariance += (sumSq / n) - (mean * mean);
                blockCount++;
            }
        }
        const avgVariance = blockCount > 0 ? totalVariance / blockCount : 0;
        const density = Math.min(1, avgVariance / 500);
        return {
            density,
            distribution: density > 0.3 ? 'gaussian' : 'uniform',
            map: new ImageData(new Uint8ClampedArray(data.buffer.slice(0) as ArrayBuffer), width, height)
        };
    }

    private simulatePaperFibers(data: Uint8ClampedArray, width: number, height: number): PaperFibers {
        // Detect high-contrast isolated streaks as fiber candidates
        let fiberCount = 0;
        let orientationSum = 0;
        for (let y = 2; y < height - 2; y += 4) {
            for (let x = 2; x < width - 2; x += 4) {
                const idx = (y * width + x) * 4;
                const l = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const idxR = (y * width + x + 2) * 4;
                const lR = (data[idxR] + data[idxR + 1] + data[idxR + 2]) / 3;
                const idxD = ((y + 2) * width + x) * 4;
                const lD = (data[idxD] + data[idxD + 1] + data[idxD + 2]) / 3;
                if (Math.abs(l - lR) > 40 || Math.abs(l - lD) > 40) {
                    fiberCount++;
                    orientationSum += Math.atan2(l - lD, l - lR) * (180 / Math.PI);
                }
            }
        }
        return {
            count: fiberCount,
            orientation: fiberCount > 0 ? orientationSum / fiberCount : 0,
            map: new ImageData(width, height)
        };
    }

    private analyzeInkBleed(data: Uint8ClampedArray, width: number, height: number): InkBleedAnalysis {
        // Measure fuzzy boundary width at high-contrast transitions
        let transitionWidthSum = 0, transitionCount = 0;
        for (let y = 0; y < height; y += 8) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const l = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const idxPrev = (y * width + x - 1) * 4;
                const lPrev = (data[idxPrev] + data[idxPrev + 1] + data[idxPrev + 2]) / 3;
                if (Math.abs(l - lPrev) > 80) {
                    let spread = 1;
                    for (let dx = 1; dx < 5 && x + dx < width; dx++) {
                        const idxN = (y * width + x + dx) * 4;
                        const lN = (data[idxN] + data[idxN + 1] + data[idxN + 2]) / 3;
                        if (Math.abs(l - lN) < 20) break;
                        spread++;
                    }
                    transitionWidthSum += spread;
                    transitionCount++;
                }
            }
        }
        const avgSpread = transitionCount > 0 ? transitionWidthSum / transitionCount : 1;
        return { amount: Math.min(1, avgSpread / 5), spread: avgSpread };
    }

    private detectWearPatterns(data: Uint8ClampedArray, width: number, height: number): WearPatterns {
        // Detect scratches (linear artifacts) and folds (long horizontal/vertical lines)
        let scratches = 0, folds = 0;
        for (let y = 1; y < height - 1; y += 3) {
            let runLength = 0;
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const l = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const above = ((y - 1) * width + x) * 4;
                const lA = (data[above] + data[above + 1] + data[above + 2]) / 3;
                if (Math.abs(l - lA) > 60) { runLength++; } else {
                    if (runLength > 20) folds++;
                    else if (runLength > 5) scratches++;
                    runLength = 0;
                }
            }
        }
        return { scratches, folds, map: new ImageData(width, height) };
    }

    private detectPrintMethod(data: Uint8ClampedArray, width: number, height: number): PrintMethod {
        // Halftone detection: look for regular dot patterns in mid-tones
        let dotPatternScore = 0;
        const sampleSize = Math.min(100, Math.floor(width / 4));
        for (let y = height / 4; y < height * 3 / 4; y += 4) {
            for (let x = width / 4; x < width / 4 + sampleSize; x += 2) {
                const idx = (Math.floor(y) * width + Math.floor(x)) * 4;
                const l = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                if (l > 80 && l < 180) {
                    const nextIdx = (Math.floor(y) * width + Math.floor(x) + 2) * 4;
                    const lNext = (data[nextIdx] + data[nextIdx + 1] + data[nextIdx + 2]) / 3;
                    if (Math.abs(l - lNext) > 30) dotPatternScore++;
                }
            }
        }
        const isOffset = dotPatternScore > sampleSize * 0.3;
        return {
            method: isOffset ? 'offset' : 'laser',
            confidence: isOffset ? 0.75 : 0.85
        };
    }

    private analyzeMaterialTexture(data: Uint8ClampedArray, width: number, height: number): MaterialTexture {
        // Roughness from local luminance variance, reflectivity from specular highlights
        let varianceSum = 0, highlightCount = 0, sampleCount = 0;
        for (let y = 0; y < height; y += 6) {
            for (let x = 0; x < width; x += 6) {
                const idx = (y * width + x) * 4;
                const l = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                if (l > 240) highlightCount++;
                if (x + 6 < width) {
                    const nextIdx = (y * width + x + 6) * 4;
                    const lN = (data[nextIdx] + data[nextIdx + 1] + data[nextIdx + 2]) / 3;
                    varianceSum += Math.abs(l - lN);
                    sampleCount++;
                }
            }
        }
        const totalPixels = (width / 6) * (height / 6);
        return {
            roughness: sampleCount > 0 ? Math.min(1, (varianceSum / sampleCount) / 50) : 0.3,
            reflectivity: totalPixels > 0 ? Math.min(1, highlightCount / totalPixels) : 0.1
        };
    }

    private analyzeColorVariations(data: Uint8ClampedArray, width: number, height: number): ColorVariations {
        // Calculate average Delta E across neighboring blocks
        let totalDeltaE = 0, blockCount = 0;
        const bs = 16;
        for (let by = 0; by < height - bs; by += bs) {
            for (let bx = 0; bx < width - bs; bx += bs) {
                const idx1 = (by * width + bx) * 4;
                const idx2 = ((by + bs) * width + bx) * 4;
                const dR = data[idx1] - data[idx2];
                const dG = data[idx1 + 1] - data[idx2 + 1];
                const dB = data[idx1 + 2] - data[idx2 + 2];
                totalDeltaE += Math.sqrt(dR * dR + dG * dG + dB * dB);
                blockCount++;
            }
        }
        return {
            deltaE: blockCount > 0 ? totalDeltaE / blockCount : 2.0,
            map: new ImageData(width, height)
        };
    }

    // ============== HELPER METHODS ==============

    private extractColorPalette(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): ColorPalette {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const colorBuckets = new Map<string, number>();
        for (let i = 0; i < data.length; i += 16) {
            const r = Math.round(data[i] / 32) * 32;
            const g = Math.round(data[i + 1] / 32) * 32;
            const b = Math.round(data[i + 2] / 32) * 32;
            const key = `rgb(${r},${g},${b})`;
            colorBuckets.set(key, (colorBuckets.get(key) || 0) + 1);
        }
        const sorted: Array<[string, number]> = [];
        colorBuckets.forEach((count, color) => sorted.push([color, count]));
        sorted.sort((a, b) => b[1] - a[1]);
        return {
            primary: sorted.slice(0, 3).map(e => e[0]),
            secondary: sorted.slice(3, 6).map(e => e[0]),
            background: sorted.length > 0 ? sorted[0][0] : '#FFFFFF'
        };
    }

    private async analyzeTextures(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): Promise<TextureAnalysis> {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let entropy = 0;
        const histogram = new Array(256).fill(0);
        for (let i = 0; i < data.length; i += 4) {
            const l = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
            histogram[l]++;
        }
        const total = data.length / 4;
        for (const count of histogram) {
            if (count > 0) {
                const p = count / total;
                entropy -= p * Math.log2(p);
            }
        }
        return { type: entropy > 6 ? 'complex' : 'paper', quality: Math.min(1, entropy / 8) };
    }

    private detectPatterns(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): PatternDetection {
        return { patterns: [], reliability: 0.5 };
    }

    private loadImage(url: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }

    // ============== EDITING & EXPORT ==============

    createEditableTemplate(clonedDocument: ClonedDocument): EditableTemplate {
        return clonedDocument.template;
    }

    enableMicroDetailEditing(canvas: fabric.Canvas, microDetails: MicroDetails): void {
        const originalRender = canvas.renderAll.bind(canvas);
        canvas.renderAll = () => { originalRender(); return canvas; };
    }

    async exportWithMicroDetails(template: EditableTemplate, format: ExportFormat): Promise<ExportedDocument> {
        const mimeTypes: Record<string, string> = {
            pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg',
            svg: 'image/svg+xml', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        return {
            data: new Blob([''], { type: mimeTypes[format] || 'application/octet-stream' }),
            mimeType: mimeTypes[format] || 'application/octet-stream',
            size: 0,
            format,
            filename: `export.${format}`,
            metadata: { templateId: template.id, exportedAt: new Date().toISOString() }
        };
    }

    /** Access the underlying UniversalDocumentCloningEngine for advanced features */
    getCloningEngine(): UniversalDocumentCloningEngine {
        return this.engine;
    }
}
