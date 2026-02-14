/**
 * PrintPreviewEngine - Print-Ready Output Optimization v1.0
 * 
 * Features:
 * - Exact 1:1 scale preview for physical printing
 * - Check alignment guides
 * - Multi-check per page layouts
 * - Perforated edge simulation
 * - Print margin calculations
 * - Color profile optimization (CMYK simulation)
 * - Check stock paper size templates
 */

import { fabric } from 'fabric';
import jsPDF from 'jspdf';

// Standard check and paper sizes
const PAPER_SIZES = {
    letter: { width: 8.5, height: 11, unit: 'inches' },
    legal: { width: 8.5, height: 14, unit: 'inches' },
    a4: { width: 8.27, height: 11.69, unit: 'inches' }
};

const CHECK_SIZES = {
    personal: { width: 6, height: 2.75 },
    business: { width: 8.5, height: 3.5 },
    wallet: { width: 6, height: 2.5 },
    voucher: { width: 8.5, height: 11 } // 3-part check
};

const LAYOUT_TEMPLATES = {
    single: { checksPerPage: 1, orientation: 'landscape' },
    triple: { checksPerPage: 3, orientation: 'portrait' },
    wallet: { checksPerPage: 3, orientation: 'portrait' }
};

export interface PrintConfig {
    paperSize: keyof typeof PAPER_SIZES;
    checkSize: keyof typeof CHECK_SIZES;
    layout: keyof typeof LAYOUT_TEMPLATES;
    dpi: number;
    showCutLines: boolean;
    showAlignmentMarks: boolean;
    margins: { top: number; right: number; bottom: number; left: number };
    bleed: number;
}

export interface PrintPreviewData {
    pages: Array<{
        canvas: fabric.Canvas;
        checkPositions: Array<{ x: number; y: number; index: number }>;
    }>;
    totalPages: number;
    checksPerPage: number;
}

const DEFAULT_PRINT_CONFIG: PrintConfig = {
    paperSize: 'letter',
    checkSize: 'business',
    layout: 'single',
    dpi: 300,
    showCutLines: true,
    showAlignmentMarks: true,
    margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    bleed: 0.125
};

export class PrintPreviewEngine {

    // ============== CALCULATE LAYOUT ==============

    static calculateLayout(config: PrintConfig = DEFAULT_PRINT_CONFIG): {
        checksPerPage: number;
        checkPositions: Array<{ x: number; y: number }>;
        pageSize: { width: number; height: number };
        checkSize: { width: number; height: number };
    } {
        const paper = PAPER_SIZES[config.paperSize];
        const check = CHECK_SIZES[config.checkSize];
        const layout = LAYOUT_TEMPLATES[config.layout];

        const printableWidth = paper.width - config.margins.left - config.margins.right;
        const printableHeight = paper.height - config.margins.top - config.margins.bottom;

        let checksPerPage = 1;
        const positions: Array<{ x: number; y: number }> = [];

        if (layout.orientation === 'landscape') {
            checksPerPage = 1;
            positions.push({
                x: config.margins.left,
                y: config.margins.top
            });
        } else {
            // Calculate how many checks fit vertically
            checksPerPage = Math.floor(printableHeight / (check.height + 0.25));
            checksPerPage = Math.min(checksPerPage, layout.checksPerPage);

            const totalCheckHeight = checksPerPage * check.height;
            const spacing = (printableHeight - totalCheckHeight) / (checksPerPage + 1);

            for (let i = 0; i < checksPerPage; i++) {
                positions.push({
                    x: config.margins.left,
                    y: config.margins.top + spacing + i * (check.height + spacing)
                });
            }
        }

        return {
            checksPerPage,
            checkPositions: positions,
            pageSize: { width: paper.width, height: paper.height },
            checkSize: check
        };
    }

    // ============== GENERATE CUT LINES ==============

    static generateCutLines(
        pageWidth: number,
        pageHeight: number,
        checkPositions: Array<{ x: number; y: number }>,
        checkSize: { width: number; height: number },
        dpi: number
    ): fabric.Group {
        const scale = dpi;
        const group = new fabric.Group([], {
            selectable: false,
            evented: false,
            name: 'cut-lines'
        });

        checkPositions.forEach(pos => {
            const x = pos.x * scale;
            const y = pos.y * scale;
            const w = checkSize.width * scale;
            const h = checkSize.height * scale;

            // Dashed cut lines
            const lines = [
                new fabric.Line([x - 20, y, x + w + 20, y], {
                    stroke: '#999',
                    strokeWidth: 0.5,
                    strokeDashArray: [10, 5]
                }),
                new fabric.Line([x - 20, y + h, x + w + 20, y + h], {
                    stroke: '#999',
                    strokeWidth: 0.5,
                    strokeDashArray: [10, 5]
                }),
                new fabric.Line([x, y - 20, x, y + h + 20], {
                    stroke: '#999',
                    strokeWidth: 0.5,
                    strokeDashArray: [10, 5]
                }),
                new fabric.Line([x + w, y - 20, x + w, y + h + 20], {
                    stroke: '#999',
                    strokeWidth: 0.5,
                    strokeDashArray: [10, 5]
                })
            ];

            lines.forEach(line => group.add(line));

            // Corner marks (crop marks)
            const markLength = 15;
            const cornerMarks = [
                // Top-left
                new fabric.Line([x - 25, y, x - 10, y], { stroke: '#000', strokeWidth: 1 }),
                new fabric.Line([x, y - 25, x, y - 10], { stroke: '#000', strokeWidth: 1 }),
                // Top-right
                new fabric.Line([x + w + 10, y, x + w + 25, y], { stroke: '#000', strokeWidth: 1 }),
                new fabric.Line([x + w, y - 25, x + w, y - 10], { stroke: '#000', strokeWidth: 1 }),
                // Bottom-left
                new fabric.Line([x - 25, y + h, x - 10, y + h], { stroke: '#000', strokeWidth: 1 }),
                new fabric.Line([x, y + h + 10, x, y + h + 25], { stroke: '#000', strokeWidth: 1 }),
                // Bottom-right
                new fabric.Line([x + w + 10, y + h, x + w + 25, y + h], { stroke: '#000', strokeWidth: 1 }),
                new fabric.Line([x + w, y + h + 10, x + w, y + h + 25], { stroke: '#000', strokeWidth: 1 })
            ];

            cornerMarks.forEach(mark => group.add(mark));
        });

        return group;
    }

    // ============== ALIGNMENT TARGETS ==============

    static generateAlignmentMarks(
        pageWidth: number,
        pageHeight: number,
        dpi: number
    ): fabric.Group {
        const scale = dpi;
        const group = new fabric.Group([], {
            selectable: false,
            evented: false,
            name: 'alignment-marks'
        });

        // Registration targets at corners
        const targetPositions = [
            { x: 0.25, y: 0.25 },
            { x: pageWidth - 0.25, y: 0.25 },
            { x: 0.25, y: pageHeight - 0.25 },
            { x: pageWidth - 0.25, y: pageHeight - 0.25 }
        ];

        targetPositions.forEach(pos => {
            const cx = pos.x * scale;
            const cy = pos.y * scale;
            const r = 8;

            // Target circle
            group.add(new fabric.Circle({
                left: cx - r,
                top: cy - r,
                radius: r,
                fill: 'transparent',
                stroke: '#000',
                strokeWidth: 0.5
            }));

            // Crosshair
            group.add(new fabric.Line([cx - r - 5, cy, cx + r + 5, cy], {
                stroke: '#000',
                strokeWidth: 0.5
            }));
            group.add(new fabric.Line([cx, cy - r - 5, cx, cy + r + 5], {
                stroke: '#000',
                strokeWidth: 0.5
            }));
        });

        // Color calibration bars (CMYK)
        const barWidth = 0.25 * scale;
        const barHeight = 0.1 * scale;
        const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#000000'];

        colors.forEach((color, i) => {
            group.add(new fabric.Rect({
                left: (0.5 + i * 0.3) * scale,
                top: (pageHeight - 0.4) * scale,
                width: barWidth,
                height: barHeight,
                fill: color
            }));
        });

        return group;
    }

    // ============== PERFORATION SIMULATION ==============

    static generatePerforationLine(
        x1: number, y1: number,
        x2: number, y2: number,
        dpi: number
    ): fabric.Line {
        return new fabric.Line([x1 * dpi, y1 * dpi, x2 * dpi, y2 * dpi], {
            stroke: '#ccc',
            strokeWidth: 1,
            strokeDashArray: [2, 4], // Simulate perforation holes
            selectable: false,
            evented: false,
            name: 'perforation'
        });
    }

    // ============== GENERATE PRINT-READY PDF ==============

    static async generatePrintPDF(
        checkImages: string[],
        config: PrintConfig = DEFAULT_PRINT_CONFIG
    ): Promise<Blob> {
        const layout = this.calculateLayout(config);
        const paper = PAPER_SIZES[config.paperSize];

        const pdf = new jsPDF({
            orientation: LAYOUT_TEMPLATES[config.layout].orientation as 'portrait' | 'landscape',
            unit: 'in',
            format: [paper.width, paper.height]
        });

        let checkIndex = 0;
        let pageIndex = 0;

        while (checkIndex < checkImages.length) {
            if (pageIndex > 0) {
                pdf.addPage();
            }

            // Add checks to page
            for (const pos of layout.checkPositions) {
                if (checkIndex >= checkImages.length) break;

                pdf.addImage(
                    checkImages[checkIndex],
                    'PNG',
                    pos.x,
                    pos.y,
                    layout.checkSize.width,
                    layout.checkSize.height
                );

                // Add cut lines if enabled
                if (config.showCutLines) {
                    pdf.setDrawColor(150, 150, 150);
                    pdf.setLineDashPattern([2, 2], 0);
                    pdf.rect(pos.x, pos.y, layout.checkSize.width, layout.checkSize.height);
                    pdf.setLineDashPattern([], 0);
                }

                checkIndex++;
            }

            pageIndex++;
        }

        return pdf.output('blob');
    }

    // ============== 1:1 SCALE PREVIEW ==============

    static create1to1Preview(
        checkCanvas: fabric.Canvas,
        screenDPI: number = 96
    ): { scale: number; instructions: string } {
        const printDPI = 300;
        const scale = screenDPI / printDPI;

        return {
            scale,
            instructions: `For accurate 1:1 preview, your screen DPI is ${screenDPI}. ` +
                `The check will print at ${printDPI} DPI. ` +
                `Current preview is at ${Math.round(scale * 100)}% of actual print size.`
        };
    }

    // ============== CHECK STOCK TEMPLATES ==============

    static getCheckStockTemplates(): Record<string, {
        name: string;
        description: string;
        checksPerPage: number;
        checkSize: { width: number; height: number };
        compatibility: string[];
    }> {
        return {
            deluxe: {
                name: 'Deluxe Business Checks',
                description: '3 checks per page with perforated stubs',
                checksPerPage: 3,
                checkSize: { width: 8.5, height: 3.5 },
                compatibility: ['QuickBooks', 'Quicken', 'Sage']
            },
            wallet: {
                name: 'Wallet Checks',
                description: 'Personal wallet-size checks',
                checksPerPage: 3,
                checkSize: { width: 6, height: 2.75 },
                compatibility: ['Personal use', 'Banks']
            },
            voucher: {
                name: 'Voucher Checks',
                description: 'Single check with 2 voucher stubs',
                checksPerPage: 1,
                checkSize: { width: 8.5, height: 11 },
                compatibility: ['QuickBooks', 'Accounting software']
            },
            laser: {
                name: 'Laser Checks (Top)',
                description: 'Check on top, stubs below',
                checksPerPage: 1,
                checkSize: { width: 8.5, height: 3.5 },
                compatibility: ['QuickBooks', 'Most printers']
            }
        };
    }

    // ============== PRINTER COMPATIBILITY CHECK ==============

    static getPrinterRequirements(): {
        requiredFeatures: string[];
        recommendedSettings: Record<string, string>;
        warnings: string[];
    } {
        return {
            requiredFeatures: [
                'Minimum 600 DPI printing',
                'MICR toner support (for magnetic ink)',
                'Manual feed tray for check stock',
                'Edge-to-edge printing capability'
            ],
            recommendedSettings: {
                quality: 'High / Best',
                paperType: 'Heavy / Card Stock',
                colorMode: 'Grayscale for MICR line',
                scaling: 'Actual Size (100%)'
            },
            warnings: [
                'Do not use inkjet for official checks',
                'MICR toner required for bank processing',
                'Always print on security check paper'
            ]
        };
    }
}
