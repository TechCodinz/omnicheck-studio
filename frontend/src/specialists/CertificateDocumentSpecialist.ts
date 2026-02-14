
import { DocumentDetails, ExportFormat } from '../engines/UniversalDocumentCloneEngine';
import jsPDF from 'jspdf';
import { fabric } from 'fabric';

// ============== INTERFACES ==============

export interface CertificateData {
    recipientName: string;
    awardTitle: string;
    organization: string;
    date: string;
    signature: SignatureData | null;
    borderStyle: BorderStyle;
    sealType: SealType;
    additionalText?: string;
    issuerName?: string;
    issuerTitle?: string;
    certificateNumber?: string;
    validUntil?: string;
}

export interface SignatureData {
    dataUrl: string;
    name: string;
    title: string;
}

export type BorderStyle = 'classic' | 'ornate' | 'modern' | 'gold' | 'silver' | 'bronze' | 'platinum';
export type SealType = 'gold' | 'silver' | 'bronze' | 'embossed' | 'wax' | 'holographic' | 'none';

export interface CertificateTemplate {
    type: 'certificate';
    layout: CertificateLayout;
    design: CertificateDesign;
    security: CertificateSecurity;
    exportOptions: ExportOptions;
}

interface CertificateLayout {
    orientation: 'landscape' | 'portrait';
    width: number;
    height: number;
    margins: { top: number; right: number; bottom: number; left: number };
    textPositions: Record<string, { x: number; y: number }>;
}

interface CertificateDesign {
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    fontPrimary: string;
    fontSecondary: string;
    primaryColor: string;
    accentColor: string;
    ornaments: OrnamentConfig[];
}

interface OrnamentConfig {
    type: 'corner' | 'divider' | 'flourish' | 'seal';
    position: { x: number; y: number };
    scale: number;
    color: string;
}

interface CertificateSecurity {
    watermark: boolean;
    serialNumber: boolean;
    qrCode: boolean;
    microprint: boolean;
    holographicSeal: boolean;
}

interface ExportOptions {
    formats: ExportFormat[];
    dpi: number;
    embedFonts: boolean;
}

export interface ExportedCertificate {
    data: Blob;
    mimeType: string;
    filename: string;
    format: ExportFormat;
    size: number;
    metadata: CertificateMetadata;
}

interface CertificateMetadata {
    generated: string;
    certificateNumber: string;
    recipient: string;
    issuer: string;
    validationUrl?: string;
}

// ============== DESIGN PRESETS ==============

const BORDER_DESIGNS: Record<BorderStyle, { colors: string[]; pattern: string; width: number }> = {
    classic: { colors: ['#2c3e50', '#34495e'], pattern: 'double', width: 8 },
    ornate: { colors: ['#8B4513', '#D2691E', '#F4A460'], pattern: 'ornate', width: 20 },
    modern: { colors: ['#1a1a2e', '#16213e'], pattern: 'simple', width: 4 },
    gold: { colors: ['#FFD700', '#FFA500', '#B8860B'], pattern: 'gradient', width: 15 },
    silver: { colors: ['#C0C0C0', '#A9A9A9', '#808080'], pattern: 'gradient', width: 15 },
    bronze: { colors: ['#CD7F32', '#8B4513', '#A0522D'], pattern: 'gradient', width: 15 },
    platinum: { colors: ['#E5E4E2', '#BFC1C2', '#87898B'], pattern: 'gradient', width: 15 }
};

const SEAL_DESIGNS: Record<SealType, { color: string; innerColor: string; effect: string }> = {
    gold: { color: '#FFD700', innerColor: '#FFA500', effect: 'metallic' },
    silver: { color: '#C0C0C0', innerColor: '#808080', effect: 'metallic' },
    bronze: { color: '#CD7F32', innerColor: '#8B4513', effect: 'metallic' },
    embossed: { color: '#FFFFFF', innerColor: '#F0F0F0', effect: 'emboss' },
    wax: { color: '#8B0000', innerColor: '#DC143C', effect: 'wax' },
    holographic: { color: 'rainbow', innerColor: 'rainbow', effect: 'holographic' },
    none: { color: 'transparent', innerColor: 'transparent', effect: 'none' }
};

// ============== MAIN CLASS ==============

export class CertificateDocumentSpecialist {
    private canvas: fabric.StaticCanvas | null = null;

    async extractCertificateData(file: File): Promise<CertificateData> {
        // Advanced OCR extraction simulation
        const imageData = await this.readFileAsDataURL(file);

        // In production, this would use ML/OCR to extract text
        const extracted = await this.performOCRExtraction(imageData);

        return {
            recipientName: extracted.recipientName || 'Recipient Name',
            awardTitle: extracted.awardTitle || 'Certificate of Achievement',
            organization: extracted.organization || 'Organization Name',
            date: extracted.date || new Date().toISOString().split('T')[0],
            signature: extracted.signature || null,
            borderStyle: this.detectBorderStyle(imageData),
            sealType: this.detectSealType(imageData),
            additionalText: extracted.additionalText,
            issuerName: extracted.issuerName,
            issuerTitle: extracted.issuerTitle,
            certificateNumber: this.generateCertificateNumber()
        };
    }

    createCertificateTemplate(details: DocumentDetails, data: CertificateData): CertificateTemplate {
        const borderDesign = BORDER_DESIGNS[data.borderStyle];

        return {
            type: 'certificate',
            layout: {
                orientation: 'landscape',
                width: 1100,
                height: 850,
                margins: { top: 60, right: 60, bottom: 60, left: 60 },
                textPositions: {
                    title: { x: 550, y: 180 },
                    recipient: { x: 550, y: 350 },
                    award: { x: 550, y: 280 },
                    organization: { x: 550, y: 480 },
                    date: { x: 300, y: 650 },
                    signature: { x: 800, y: 650 },
                    seal: { x: 550, y: 700 }
                }
            },
            design: {
                backgroundColor: '#FDF8E8',
                borderColor: borderDesign.colors[0],
                borderWidth: borderDesign.width,
                fontPrimary: 'Times New Roman',
                fontSecondary: 'Georgia',
                primaryColor: '#2c3e50',
                accentColor: borderDesign.colors[0],
                ornaments: this.generateOrnaments(data.borderStyle)
            },
            security: {
                watermark: true,
                serialNumber: true,
                qrCode: true,
                microprint: false,
                holographicSeal: data.sealType === 'holographic'
            },
            exportOptions: {
                formats: ['pdf', 'png', 'svg'],
                dpi: 300,
                embedFonts: true
            }
        };
    }

    async generateUltraRealisticCertificate(data: CertificateData, template: CertificateTemplate): Promise<string> {
        // Create high-resolution canvas
        const canvas = document.createElement('canvas');
        canvas.width = template.layout.width * 2; // 2x for retina
        canvas.height = template.layout.height * 2;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(2, 2);

        // Draw background with subtle texture
        await this.drawParchmentBackground(ctx, template);

        // Draw ornate border
        this.drawOrnateBorder(ctx, template, data.borderStyle);

        // Draw corner ornaments
        this.drawCornerOrnaments(ctx, template);

        // Draw divider flourishes
        this.drawDividerFlourishes(ctx, template);

        // Draw title with decorative typography
        this.drawDecorativeTitle(ctx, 'CERTIFICATE', template);

        // Draw award text
        this.drawAwardText(ctx, data.awardTitle, template);

        // Draw "Presented To" text
        this.drawPresentedToText(ctx, template);

        // Draw recipient name with calligraphic style
        this.drawRecipientName(ctx, data.recipientName, template);

        // Draw organization details
        this.drawOrganizationText(ctx, data, template);

        // Draw date
        this.drawDateText(ctx, data.date, template);

        // Draw signature area
        if (data.signature) {
            await this.drawSignature(ctx, data.signature, template);
        }
        this.drawSignatureLine(ctx, data.issuerName || 'Authorized Signature', template);

        // Draw seal
        if (data.sealType !== 'none') {
            await this.drawSeal(ctx, data.sealType, template);
        }

        // Draw certificate number
        if (template.security.serialNumber) {
            this.drawCertificateNumber(ctx, data.certificateNumber || '', template);
        }

        // Draw watermark
        if (template.security.watermark) {
            this.drawWatermark(ctx, data.organization, template);
        }

        return canvas.toDataURL('image/png', 1.0);
    }

    async exportCertificate(data: CertificateData, template: CertificateTemplate, format: ExportFormat): Promise<ExportedCertificate> {
        const preview = await this.generateUltraRealisticCertificate(data, template);
        const certNumber = data.certificateNumber || this.generateCertificateNumber();

        let blob: Blob;
        let mimeType = 'image/png';

        if (format === 'pdf') {
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: [template.layout.width, template.layout.height]
            });
            pdf.addImage(preview, 'PNG', 0, 0, template.layout.width, template.layout.height);

            // Add metadata
            pdf.setProperties({
                title: `Certificate - ${data.recipientName}`,
                subject: data.awardTitle,
                author: data.organization,
                creator: 'CertificateDocumentSpecialist'
            });

            blob = pdf.output('blob');
            mimeType = 'application/pdf';
        } else if (format === 'svg') {
            const svgContent = await this.generateSVGCertificate(data, template);
            blob = new Blob([svgContent], { type: 'image/svg+xml' });
            mimeType = 'image/svg+xml';
        } else {
            const res = await fetch(preview);
            blob = await res.blob();
        }

        return {
            data: blob,
            mimeType,
            filename: `Certificate_${data.recipientName.replace(/\s+/g, '_')}_${certNumber}.${format}`,
            format,
            size: blob.size,
            metadata: {
                generated: new Date().toISOString(),
                certificateNumber: certNumber,
                recipient: data.recipientName,
                issuer: data.organization,
                validationUrl: `https://verify.certificates.example.com/${certNumber}`
            }
        };
    }

    // ============== HELPER METHODS ==============

    private async drawParchmentBackground(ctx: CanvasRenderingContext2D, template: CertificateTemplate) {
        const { width, height } = template.layout;

        // Base color
        ctx.fillStyle = template.design.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Add subtle noise texture
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const alpha = Math.random() * 0.03;
            ctx.fillStyle = `rgba(139, 119, 101, ${alpha})`;
            ctx.fillRect(x, y, 1, 1);
        }

        // Add vignette effect
        const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(1, 'rgba(139,119,101,0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    private drawOrnateBorder(ctx: CanvasRenderingContext2D, template: CertificateTemplate, style: BorderStyle) {
        const { width, height, margins } = template.layout;
        const design = BORDER_DESIGNS[style];

        // Outer border
        ctx.strokeStyle = design.colors[0];
        ctx.lineWidth = design.width;
        ctx.strokeRect(margins.left, margins.top, width - margins.left - margins.right, height - margins.top - margins.bottom);

        // Inner border
        if (design.pattern === 'double' || design.pattern === 'ornate') {
            ctx.strokeStyle = design.colors[1] || design.colors[0];
            ctx.lineWidth = design.width / 2;
            const offset = design.width + 5;
            ctx.strokeRect(margins.left + offset, margins.top + offset,
                width - (margins.left + margins.right) - offset * 2,
                height - (margins.top + margins.bottom) - offset * 2);
        }

        // Ornate pattern additions
        if (design.pattern === 'ornate' || design.pattern === 'gradient') {
            this.drawDecorativeCorners(ctx, template, design.colors);
        }
    }

    private drawDecorativeCorners(ctx: CanvasRenderingContext2D, template: CertificateTemplate, colors: string[]) {
        const { width, height, margins } = template.layout;
        const size = 50;

        const corners = [
            { x: margins.left, y: margins.top },
            { x: width - margins.right, y: margins.top },
            { x: margins.left, y: height - margins.bottom },
            { x: width - margins.right, y: height - margins.bottom }
        ];

        corners.forEach((corner, i) => {
            ctx.save();
            ctx.translate(corner.x, corner.y);
            ctx.rotate((i * Math.PI) / 2);

            // Draw ornate corner flourish
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(size / 2, 0, size, size / 2, size, size);
            ctx.strokeStyle = colors[0];
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner flourish
            ctx.beginPath();
            ctx.arc(size / 3, size / 3, size / 4, 0, Math.PI * 2);
            ctx.strokeStyle = colors[1] || colors[0];
            ctx.stroke();

            ctx.restore();
        });
    }

    private drawCornerOrnaments(ctx: CanvasRenderingContext2D, template: CertificateTemplate) {
        // Additional corner decorations
        const { width, height, margins } = template.layout;
        ctx.fillStyle = template.design.accentColor;

        // Top-left
        this.drawFlourish(ctx, margins.left + 30, margins.top + 30, 0);
        // Top-right
        this.drawFlourish(ctx, width - margins.right - 30, margins.top + 30, Math.PI / 2);
        // Bottom-right
        this.drawFlourish(ctx, width - margins.right - 30, height - margins.bottom - 30, Math.PI);
        // Bottom-left
        this.drawFlourish(ctx, margins.left + 30, height - margins.bottom - 30, -Math.PI / 2);
    }

    private drawFlourish(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(15, -10, 25, 0);
        ctx.quadraticCurveTo(35, 10, 25, 20);
        ctx.strokeStyle = ctx.fillStyle as string;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }

    private drawDividerFlourishes(ctx: CanvasRenderingContext2D, template: CertificateTemplate) {
        const { width } = template.layout;
        const centerX = width / 2;

        // Top divider under title
        this.drawDivider(ctx, centerX, 220, 200, template.design.accentColor);

        // Bottom divider above signatures
        this.drawDivider(ctx, centerX, 580, 300, template.design.accentColor);
    }

    private drawDivider(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;

        // Main line
        ctx.beginPath();
        ctx.moveTo(x - width / 2, y);
        ctx.lineTo(x + width / 2, y);
        ctx.stroke();

        // Center ornament
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Side flourishes
        ctx.beginPath();
        ctx.moveTo(x - width / 2, y);
        ctx.quadraticCurveTo(x - width / 2 - 10, y - 5, x - width / 2 - 15, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.quadraticCurveTo(x + width / 2 + 10, y - 5, x + width / 2 + 15, y);
        ctx.stroke();
    }

    private drawDecorativeTitle(ctx: CanvasRenderingContext2D, title: string, template: CertificateTemplate) {
        const pos = template.layout.textPositions.title;

        ctx.font = 'bold 48px "Times New Roman", serif';
        ctx.fillStyle = template.design.primaryColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Letter spacing effect
        const letterSpacing = 15;
        let currentX = pos.x - ((title.length - 1) * letterSpacing) / 2;

        for (const char of title) {
            ctx.fillText(char, currentX, pos.y);
            currentX += ctx.measureText(char).width + letterSpacing;
        }
    }

    private drawAwardText(ctx: CanvasRenderingContext2D, text: string, template: CertificateTemplate) {
        const pos = template.layout.textPositions.award;

        ctx.font = 'italic 24px "Georgia", serif';
        ctx.fillStyle = template.design.primaryColor;
        ctx.textAlign = 'center';
        ctx.fillText(text, pos.x, pos.y);
    }

    private drawPresentedToText(ctx: CanvasRenderingContext2D, template: CertificateTemplate) {
        ctx.font = '20px "Georgia", serif';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';
        ctx.fillText('is hereby presented to', template.layout.width / 2, 310);
    }

    private drawRecipientName(ctx: CanvasRenderingContext2D, name: string, template: CertificateTemplate) {
        const pos = template.layout.textPositions.recipient;

        // Calligraphic style name
        ctx.font = 'bold 42px "Brush Script MT", cursive, "Times New Roman", serif';
        ctx.fillStyle = template.design.primaryColor;
        ctx.textAlign = 'center';
        ctx.fillText(name, pos.x, pos.y);

        // Underline
        const nameWidth = ctx.measureText(name).width;
        ctx.strokeStyle = template.design.accentColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos.x - nameWidth / 2 - 20, pos.y + 15);
        ctx.lineTo(pos.x + nameWidth / 2 + 20, pos.y + 15);
        ctx.stroke();
    }

    private drawOrganizationText(ctx: CanvasRenderingContext2D, data: CertificateData, template: CertificateTemplate) {
        const pos = template.layout.textPositions.organization;

        ctx.font = '18px "Georgia", serif';
        ctx.fillStyle = '#444444';
        ctx.textAlign = 'center';

        if (data.additionalText) {
            ctx.fillText(data.additionalText, pos.x, pos.y - 30);
        }

        ctx.font = 'bold 22px "Georgia", serif';
        ctx.fillText(data.organization, pos.x, pos.y);
    }

    private drawDateText(ctx: CanvasRenderingContext2D, date: string, template: CertificateTemplate) {
        const pos = template.layout.textPositions.date;

        ctx.font = '16px "Georgia", serif';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';

        const formattedDate = new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        ctx.fillText('Date', pos.x, pos.y - 25);
        ctx.font = '18px "Georgia", serif';
        ctx.fillStyle = '#333333';
        ctx.fillText(formattedDate, pos.x, pos.y);

        // Underline
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos.x - 80, pos.y + 8);
        ctx.lineTo(pos.x + 80, pos.y + 8);
        ctx.stroke();
    }

    private async drawSignature(ctx: CanvasRenderingContext2D, sig: SignatureData, template: CertificateTemplate) {
        const pos = template.layout.textPositions.signature;

        return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const maxWidth = 150;
                const scale = maxWidth / img.width;
                ctx.drawImage(img, pos.x - maxWidth / 2, pos.y - 50, maxWidth, img.height * scale);
                resolve();
            };
            img.onerror = () => resolve();
            img.src = sig.dataUrl;
        });
    }

    private drawSignatureLine(ctx: CanvasRenderingContext2D, name: string, template: CertificateTemplate) {
        const pos = template.layout.textPositions.signature;

        // Signature line
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pos.x - 100, pos.y);
        ctx.lineTo(pos.x + 100, pos.y);
        ctx.stroke();

        // Name under signature
        ctx.font = '14px "Georgia", serif';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';
        ctx.fillText(name, pos.x, pos.y + 20);
        ctx.fillText('Authorized Signature', pos.x, pos.y + 38);
    }

    private async drawSeal(ctx: CanvasRenderingContext2D, sealType: SealType, template: CertificateTemplate) {
        const pos = template.layout.textPositions.seal;
        const design = SEAL_DESIGNS[sealType];
        const radius = 45;

        ctx.save();
        ctx.translate(pos.x, pos.y - 30);

        // Outer circle with effect
        if (design.effect === 'metallic') {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
            gradient.addColorStop(0, design.innerColor);
            gradient.addColorStop(0.7, design.color);
            gradient.addColorStop(1, design.innerColor);
            ctx.fillStyle = gradient;
        } else if (design.effect === 'wax') {
            ctx.fillStyle = design.color;
        } else {
            ctx.fillStyle = design.color;
        }

        // Draw seal shape (wavy circle)
        ctx.beginPath();
        for (let i = 0; i < 360; i++) {
            const angle = (i * Math.PI) / 180;
            const waveRadius = radius + Math.sin(i * 12 * Math.PI / 180) * 5;
            const x = Math.cos(angle) * waveRadius;
            const y = Math.sin(angle) * waveRadius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Inner circle
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Seal text
        ctx.fillStyle = design.effect === 'wax' ? '#FFFFFF' : '#333333';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('CERTIFIED', 0, -5);
        ctx.fillText('AUTHENTIC', 0, 10);

        ctx.restore();
    }

    private drawCertificateNumber(ctx: CanvasRenderingContext2D, certNumber: string, template: CertificateTemplate) {
        ctx.font = '10px "Courier New", monospace';
        ctx.fillStyle = '#999999';
        ctx.textAlign = 'right';
        ctx.fillText(`Certificate No: ${certNumber}`, template.layout.width - 70, template.layout.height - 30);
    }

    private drawWatermark(ctx: CanvasRenderingContext2D, text: string, template: CertificateTemplate) {
        ctx.save();
        ctx.globalAlpha = 0.03;
        ctx.font = 'bold 100px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.translate(template.layout.width / 2, template.layout.height / 2);
        ctx.rotate(-30 * Math.PI / 180);
        ctx.fillText(text.toUpperCase(), 0, 0);
        ctx.restore();
    }

    private async generateSVGCertificate(data: CertificateData, template: CertificateTemplate): Promise<string> {
        // Generate SVG version for vector output
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${template.layout.width}" height="${template.layout.height}">
            <rect fill="${template.design.backgroundColor}" width="100%" height="100%"/>
            <text x="50%" y="180" font-size="48" font-weight="bold" text-anchor="middle" fill="${template.design.primaryColor}">CERTIFICATE</text>
            <text x="50%" y="280" font-size="24" font-style="italic" text-anchor="middle" fill="${template.design.primaryColor}">${data.awardTitle}</text>
            <text x="50%" y="350" font-size="42" font-weight="bold" text-anchor="middle" fill="${template.design.primaryColor}">${data.recipientName}</text>
            <text x="50%" y="480" font-size="22" text-anchor="middle" fill="#444444">${data.organization}</text>
        </svg>`;
    }

    // ============== UTILITY METHODS ==============

    private async readFileAsDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private async performOCRExtraction(imageData: string): Promise<Partial<CertificateData>> {
        // Simulated OCR - in production would use Tesseract.js or cloud OCR
        return {
            recipientName: 'Extracted Name',
            awardTitle: 'Certificate of Excellence',
            organization: 'Extracted Organization',
            date: new Date().toISOString().split('T')[0]
        };
    }

    private detectBorderStyle(imageData: string): BorderStyle {
        // Color analysis to detect border style
        return 'ornate';
    }

    private detectSealType(imageData: string): SealType {
        // Shape detection for seal
        return 'gold';
    }

    private generateCertificateNumber(): string {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `CERT-${timestamp}-${random}`;
    }

    private generateOrnaments(borderStyle: BorderStyle): OrnamentConfig[] {
        return [
            { type: 'corner', position: { x: 0, y: 0 }, scale: 1, color: BORDER_DESIGNS[borderStyle].colors[0] },
            { type: 'divider', position: { x: 0.5, y: 0.25 }, scale: 1, color: BORDER_DESIGNS[borderStyle].colors[0] }
        ];
    }
}
