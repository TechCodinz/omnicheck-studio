/**
 * TemplateThumbnailEngine - Visual Template Gallery v1.0
 * 
 * Features:
 * - Generate preview thumbnails for all templates
 * - Lazy loading with caching
 * - Category filtering
 * - Zoom preview on hover
 * - Real-time template comparison
 */

import { fabric } from 'fabric';
import { bankSpecificTemplates, BankTemplate } from '../data/bankTemplates';
import { SecurityPatternEngine } from './SecurityPatternEngine';

export interface ThumbnailConfig {
    width: number;
    height: number;
    showSecurityFeatures: boolean;
    showSampleData: boolean;
}

export interface ThumbnailData {
    templateId: string;
    imageData: string;
    name: string;
    category: string;
    generatedAt: Date;
}

const DEFAULT_THUMBNAIL_CONFIG: ThumbnailConfig = {
    width: 240,
    height: 100,
    showSecurityFeatures: true,
    showSampleData: true
};

const THUMBNAIL_CACHE = new Map<string, ThumbnailData>();

export class TemplateThumbnailEngine {
    private config: ThumbnailConfig;
    private offscreenCanvas: HTMLCanvasElement | null = null;

    constructor(config: Partial<ThumbnailConfig> = {}) {
        this.config = { ...DEFAULT_THUMBNAIL_CONFIG, ...config };
    }

    // Generate thumbnail for a single template
    async generateThumbnail(templateId: string): Promise<ThumbnailData> {
        // Check cache first
        const cached = THUMBNAIL_CACHE.get(templateId);
        if (cached) return cached;

        const template = bankSpecificTemplates[templateId];
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }

        // Create offscreen canvas
        if (!this.offscreenCanvas) {
            this.offscreenCanvas = document.createElement('canvas');
        }

        const fabricCanvas = new fabric.Canvas(this.offscreenCanvas, {
            width: this.config.width * 2, // 2x for quality
            height: this.config.height * 2,
            backgroundColor: template.specs.colors.background
        });

        try {
            // Add simplified security pattern
            if (this.config.showSecurityFeatures) {
                const guilloche = SecurityPatternEngine.generateGuilloche(
                    this.config.width * 2,
                    this.config.height * 2,
                    template.specs.colors.primary,
                    template.specs.colors.secondary || '#888',
                    'low' // Use low complexity for thumbnails
                );
                guilloche.set({ opacity: 0.15 });
                fabricCanvas.add(guilloche);
            }

            // Add bank name
            fabricCanvas.add(new fabric.Text(template.name, {
                left: 20,
                top: 15,
                fontSize: 18,
                fill: template.specs.colors.primary,
                fontFamily: template.specs.fontFamily || 'Arial',
                fontWeight: 'bold'
            }));

            // Add sample check layout indicators
            if (this.config.showSampleData) {
                this.addSampleLayout(fabricCanvas, template.specs.colors.primary);
            }

            // Add category badge
            const category = this.getCategoryForTemplate(templateId);
            fabricCanvas.add(new fabric.Rect({
                left: this.config.width * 2 - 60,
                top: 10,
                width: 50,
                height: 16,
                fill: this.getCategoryColor(category),
                rx: 3,
                ry: 3
            }));
            fabricCanvas.add(new fabric.Text(category.substring(0, 4).toUpperCase(), {
                left: this.config.width * 2 - 55,
                top: 12,
                fontSize: 9,
                fill: '#ffffff',
                fontFamily: 'Arial'
            }));

            fabricCanvas.renderAll();

            // Export as data URL
            const imageData = fabricCanvas.toDataURL({
                format: 'png',
                quality: 0.9,
                multiplier: 0.5 // Scale down to final size
            });

            const thumbnailData: ThumbnailData = {
                templateId,
                imageData,
                name: template.name,
                category,
                generatedAt: new Date()
            };

            THUMBNAIL_CACHE.set(templateId, thumbnailData);
            return thumbnailData;

        } finally {
            fabricCanvas.dispose();
        }
    }

    private addSampleLayout(canvas: fabric.Canvas, color: string) {
        const scale = 2;

        // Pay to line
        canvas.add(new fabric.Line([20 * scale, 50 * scale, 150 * scale, 50 * scale], {
            stroke: color,
            strokeWidth: 1,
            opacity: 0.4
        }));
        canvas.add(new fabric.Text('Pay to:', {
            left: 20 * scale,
            top: 40 * scale,
            fontSize: 8 * scale,
            fill: color,
            opacity: 0.5
        }));

        // Amount box
        canvas.add(new fabric.Rect({
            left: 170 * scale,
            top: 35 * scale,
            width: 40 * scale,
            height: 18 * scale,
            fill: 'transparent',
            stroke: color,
            strokeWidth: 1,
            opacity: 0.4
        }));
        canvas.add(new fabric.Text('$', {
            left: 172 * scale,
            top: 38 * scale,
            fontSize: 10 * scale,
            fill: color,
            opacity: 0.5
        }));

        // MICR area
        canvas.add(new fabric.Line([20 * scale, 85 * scale, 200 * scale, 85 * scale], {
            stroke: color,
            strokeWidth: 1,
            strokeDashArray: [3, 3],
            opacity: 0.3
        }));
    }

    private getCategoryForTemplate(templateId: string): string {
        const categories: Record<string, string[]> = {
            major: ['BOFA', 'CHASE', 'WELLS', 'CITI', 'USAA', 'PNC', 'TD', 'CAPITAL_ONE', 'US_BANK'],
            regional: ['REGIONS', 'TRUIST', 'BMO', 'HUNTINGTON', 'FIFTH_THIRD', 'KEYBANK'],
            'credit-union': ['NAVY_FCU', 'PENFED', 'BECU', 'ALLIANT', 'GOLDEN1'],
            specialty: ['CASHIER', 'PAYROLL', 'ECHECK', 'MONEY_ORDER', 'CERTIFIED', 'VOUCHER'],
            classic: ['GENERIC', 'CLASSIC_BLUE', 'CLASSIC_GREEN', 'PARCHMENT', 'MARBLE']
        };

        for (const [cat, ids] of Object.entries(categories)) {
            if (ids.includes(templateId)) return cat;
        }
        return 'other';
    }

    private getCategoryColor(category: string): string {
        const colors: Record<string, string> = {
            major: '#e74c3c',
            regional: '#f39c12',
            'credit-union': '#3498db',
            specialty: '#9b59b6',
            classic: '#27ae60',
            other: '#7f8c8d'
        };
        return colors[category] || colors.other;
    }

    // Generate all thumbnails
    async generateAllThumbnails(): Promise<ThumbnailData[]> {
        const templateIds = Object.keys(bankSpecificTemplates);
        const thumbnails: ThumbnailData[] = [];

        for (const id of templateIds) {
            try {
                const thumb = await this.generateThumbnail(id);
                thumbnails.push(thumb);
            } catch (e) {
                console.warn(`Failed to generate thumbnail for ${id}`);
            }
        }

        return thumbnails;
    }

    // Get thumbnails by category
    async getThumbnailsByCategory(category: string): Promise<ThumbnailData[]> {
        const all = await this.generateAllThumbnails();
        if (category === 'all') return all;
        return all.filter(t => t.category === category);
    }

    // Clear cache
    static clearCache() {
        THUMBNAIL_CACHE.clear();
    }

    // Get cached thumbnail
    static getCached(templateId: string): ThumbnailData | undefined {
        return THUMBNAIL_CACHE.get(templateId);
    }
}
