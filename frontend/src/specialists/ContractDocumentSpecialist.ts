
import { DocumentDetails, ExportFormat } from '../engines/UniversalDocumentCloneEngine';
import jsPDF from 'jspdf';

// ============== INTERFACES ==============

export interface ContractData {
    title: string;
    parties: Party[];
    clauses: Clause[];
    signatures: SignatureBlock[];
    effectiveDate: string;
    expirationDate?: string;
    jurisdiction: string;
    governingLaw: string;
    witnesses?: Witness[];
    notarization?: NotarizationBlock;
    exhibits?: Exhibit[];
    amendments?: Amendment[];
    metadata: ContractMetadata;
}

export interface Party {
    id: string;
    name: string;
    type: 'individual' | 'corporation' | 'llc' | 'partnership' | 'government';
    role: 'first_party' | 'second_party' | 'third_party';
    address: Address;
    representative?: string;
    title?: string;
    identificationNumber?: string;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface Clause {
    id: string;
    number: string;
    title: string;
    content: string;
    subClauses?: SubClause[];
    isBoilerplate: boolean;
    category: ClauseCategory;
}

export interface SubClause {
    id: string;
    number: string;
    content: string;
}

export type ClauseCategory =
    | 'definitions'
    | 'obligations'
    | 'payment'
    | 'confidentiality'
    | 'termination'
    | 'liability'
    | 'indemnification'
    | 'dispute_resolution'
    | 'miscellaneous'
    | 'general';

export interface SignatureBlock {
    partyId: string;
    signatureData?: string;
    signedDate?: string;
    printedName: string;
    title: string;
    position: { x: number; y: number };
}

export interface Witness {
    name: string;
    signature?: string;
    date?: string;
}

export interface NotarizationBlock {
    notaryName: string;
    notarySignature?: string;
    commission: string;
    commissionExpiry: string;
    county: string;
    state: string;
    seal?: string;
    date?: string;
}

export interface Exhibit {
    id: string;
    label: string;
    title: string;
    description: string;
    attachmentUrl?: string;
}

export interface Amendment {
    id: string;
    date: string;
    description: string;
    affectedClauses: string[];
    parties: string[];
}

export interface ContractMetadata {
    contractNumber: string;
    version: string;
    createdAt: string;
    modifiedAt: string;
    status: 'draft' | 'pending' | 'executed' | 'terminated' | 'expired';
    tags: string[];
}

export interface ContractTemplate {
    type: 'contract';
    layout: ContractLayout;
    sections: ContractSections;
    styling: ContractStyling;
    security: ContractSecurity;
    exportOptions: ExportOptions;
}

interface ContractLayout {
    pageSize: 'letter' | 'legal' | 'a4';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    lineSpacing: number;
    paragraphSpacing: number;
}

interface ContractSections {
    header: boolean;
    preamble: boolean;
    recitals: boolean;
    definitions: boolean;
    mainBody: boolean;
    signatures: boolean;
    witnesses: boolean;
    notarization: boolean;
    exhibits: boolean;
}

interface ContractStyling {
    fontFamily: string;
    fontSize: number;
    headingFont: string;
    headingSize: number;
    clauseNumbering: 'numeric' | 'roman' | 'alphabetic';
    lineNumbers: boolean;
    watermark: WatermarkConfig | null;
}

interface WatermarkConfig {
    text: string;
    opacity: number;
    angle: number;
    fontSize: number;
    color: string;
}

interface ContractSecurity {
    digitalSignature: boolean;
    timestamping: boolean;
    hashVerification: boolean;
    versionControl: boolean;
}

interface ExportOptions {
    formats: ExportFormat[];
    dpi: number;
    archiveFormat: boolean;
}

export interface ExportedContract {
    data: Blob;
    mimeType: string;
    filename: string;
    format: ExportFormat;
    size: number;
    metadata: ExportMetadata;
}

interface ExportMetadata {
    contractNumber: string;
    pageCount: number;
    hash: string;
    timestamp: string;
}

// ============== CONSTANTS ==============

const CLAUSE_CATEGORIES_ORDER: ClauseCategory[] = [
    'definitions',
    'obligations',
    'payment',
    'confidentiality',
    'termination',
    'liability',
    'indemnification',
    'dispute_resolution',
    'miscellaneous',
    'general'
];

const BOILERPLATE_CLAUSES: Record<string, Clause> = {
    severability: {
        id: 'boiler-sev',
        number: '',
        title: 'Severability',
        content: 'If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
        isBoilerplate: true,
        category: 'miscellaneous'
    },
    entireAgreement: {
        id: 'boiler-entire',
        number: '',
        title: 'Entire Agreement',
        content: 'This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, understandings, and agreements.',
        isBoilerplate: true,
        category: 'miscellaneous'
    },
    amendments: {
        id: 'boiler-amend',
        number: '',
        title: 'Amendments',
        content: 'This Agreement may not be amended except by a written instrument signed by both parties.',
        isBoilerplate: true,
        category: 'miscellaneous'
    },
    notices: {
        id: 'boiler-notice',
        number: '',
        title: 'Notices',
        content: 'All notices required under this Agreement shall be in writing and delivered personally, by certified mail, or by overnight courier to the addresses set forth above.',
        isBoilerplate: true,
        category: 'miscellaneous'
    },
    waiver: {
        id: 'boiler-waiver',
        number: '',
        title: 'Waiver',
        content: 'The failure of either party to enforce any provision shall not constitute a waiver of that party\'s right to enforce such provision in the future.',
        isBoilerplate: true,
        category: 'miscellaneous'
    }
};

// ============== MAIN CLASS ==============

export class ContractDocumentSpecialist {

    async extractContractData(file: File): Promise<ContractData> {
        const fileContent = await this.readFileContent(file);

        // Advanced parsing to extract contract structure
        const parsedData = await this.parseContractDocument(fileContent);

        return {
            title: parsedData.title || 'Service Agreement',
            parties: parsedData.parties || this.generateDefaultParties(),
            clauses: parsedData.clauses || [],
            signatures: parsedData.signatures || [],
            effectiveDate: parsedData.effectiveDate || new Date().toISOString().split('T')[0],
            jurisdiction: parsedData.jurisdiction || 'State of Delaware',
            governingLaw: parsedData.governingLaw || 'Delaware',
            metadata: {
                contractNumber: this.generateContractNumber(),
                version: '1.0',
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                status: 'draft',
                tags: []
            }
        };
    }

    createContractTemplate(details: DocumentDetails, data: ContractData): ContractTemplate {
        return {
            type: 'contract',
            layout: {
                pageSize: 'letter',
                orientation: 'portrait',
                margins: { top: 72, right: 72, bottom: 72, left: 72 },
                lineSpacing: 1.5,
                paragraphSpacing: 12
            },
            sections: {
                header: true,
                preamble: true,
                recitals: true,
                definitions: data.clauses.some(c => c.category === 'definitions'),
                mainBody: true,
                signatures: true,
                witnesses: !!data.witnesses?.length,
                notarization: !!data.notarization,
                exhibits: !!data.exhibits?.length
            },
            styling: {
                fontFamily: 'Times New Roman',
                fontSize: 12,
                headingFont: 'Arial',
                headingSize: 14,
                clauseNumbering: 'numeric',
                lineNumbers: false,
                watermark: data.metadata.status === 'draft' ? {
                    text: 'DRAFT',
                    opacity: 0.1,
                    angle: -45,
                    fontSize: 72,
                    color: '#FF0000'
                } : null
            },
            security: {
                digitalSignature: true,
                timestamping: true,
                hashVerification: true,
                versionControl: true
            },
            exportOptions: {
                formats: ['pdf', 'docx', 'txt'],
                dpi: 300,
                archiveFormat: true
            }
        };
    }

    async generateUltraRealisticContract(data: ContractData, template: ContractTemplate): Promise<string> {
        const canvas = document.createElement('canvas');
        const pageWidth = 816; // 8.5" at 96 DPI
        const pageHeight = 1056; // 11" at 96 DPI
        canvas.width = pageWidth * 2;
        canvas.height = pageHeight * 2;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(2, 2);

        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, pageWidth, pageHeight);

        // Draw watermark if draft
        if (template.styling.watermark) {
            this.drawWatermark(ctx, template.styling.watermark, pageWidth, pageHeight);
        }

        // Draw header
        let yPos = template.layout.margins.top;
        yPos = this.drawContractHeader(ctx, data, template, yPos, pageWidth);

        // Draw preamble
        yPos = this.drawPreamble(ctx, data, template, yPos, pageWidth);

        // Draw recitals (WHEREAS clauses)
        yPos = this.drawRecitals(ctx, data, template, yPos, pageWidth);

        // Draw numbered clauses
        yPos = this.drawClauses(ctx, data.clauses, template, yPos, pageWidth);

        // Draw signature blocks
        this.drawSignatureBlocks(ctx, data, template, pageWidth, pageHeight);

        return canvas.toDataURL('image/png', 1.0);
    }

    async exportContract(data: ContractData, template: ContractTemplate, format: ExportFormat): Promise<ExportedContract> {
        let blob: Blob;
        let mimeType = 'application/pdf';
        let pageCount = 1;

        if (format === 'pdf') {
            const pdf = await this.generatePDFContract(data, template);
            blob = pdf.output('blob');
            pageCount = pdf.getNumberOfPages();
        } else if (format === 'txt') {
            const text = this.generatePlainTextContract(data);
            blob = new Blob([text], { type: 'text/plain' });
            mimeType = 'text/plain';
        } else {
            const preview = await this.generateUltraRealisticContract(data, template);
            const res = await fetch(preview);
            blob = await res.blob();
            mimeType = 'image/png';
        }

        return {
            data: blob,
            mimeType,
            filename: `${data.title.replace(/\s+/g, '_')}_${data.metadata.contractNumber}.${format}`,
            format,
            size: blob.size,
            metadata: {
                contractNumber: data.metadata.contractNumber,
                pageCount,
                hash: await this.calculateHash(blob),
                timestamp: new Date().toISOString()
            }
        };
    }

    // ============== PDF GENERATION ==============

    private async generatePDFContract(data: ContractData, template: ContractTemplate): Promise<jsPDF> {
        const pdf = new jsPDF({
            orientation: template.layout.orientation,
            unit: 'pt',
            format: template.layout.pageSize
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margins = template.layout.margins;
        const contentWidth = pageWidth - margins.left - margins.right;

        let y = margins.top;

        // Watermark on each page
        if (template.styling.watermark) {
            this.addPDFWatermark(pdf, template.styling.watermark);
        }

        // Title
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text(data.title.toUpperCase(), pageWidth / 2, y, { align: 'center' });
        y += 30;

        // Contract number
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(`Contract No: ${data.metadata.contractNumber}`, pageWidth / 2, y, { align: 'center' });
        y += 30;

        // Preamble
        pdf.setFontSize(12);
        const preamble = this.generatePreambleText(data);
        const preambleLines = pdf.splitTextToSize(preamble, contentWidth);
        pdf.text(preambleLines, margins.left, y);
        y += preambleLines.length * 14 + 20;

        // Recitals
        y = this.addRecitalsToPDF(pdf, data, y, margins, contentWidth, pageHeight);

        // Clauses
        y = this.addClausesToPDF(pdf, data.clauses, y, margins, contentWidth, pageHeight, template);

        // Add boilerplate clauses
        const boilerplateClauses = Object.values(BOILERPLATE_CLAUSES);
        const allClauses = [...data.clauses, ...boilerplateClauses];

        // Re-number boilerplate
        let lastNum = data.clauses.length;
        boilerplateClauses.forEach(clause => {
            lastNum++;
            clause.number = lastNum.toString();
        });

        // Signature page
        pdf.addPage();
        this.addSignaturePageToPDF(pdf, data, template);

        return pdf;
    }

    private addPDFWatermark(pdf: jsPDF, watermark: WatermarkConfig) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.saveGraphicsState();
        pdf.setTextColor(watermark.color);
        pdf.setFontSize(watermark.fontSize);

        // Rotate and position watermark
        const centerX = pageWidth / 2;
        const centerY = pageHeight / 2;

        // Note: jsPDF doesn't have direct rotation, so we draw at an angle using multiple positioned texts
        pdf.setTextColor(255, 0, 0);
        const gState = pdf.GState({ opacity: watermark.opacity });
        pdf.setGState(gState);

        pdf.text(watermark.text, centerX, centerY, {
            align: 'center',
            angle: watermark.angle
        });

        pdf.restoreGraphicsState();
    }

    private addRecitalsToPDF(pdf: jsPDF, data: ContractData, y: number, margins: any, contentWidth: number, pageHeight: number): number {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('RECITALS', margins.left, y);
        y += 20;

        pdf.setFont('helvetica', 'normal');

        const recitals = [
            `WHEREAS, ${data.parties[0]?.name || 'First Party'} desires to enter into this Agreement;`,
            `WHEREAS, ${data.parties[1]?.name || 'Second Party'} agrees to the terms set forth herein;`,
            `NOW, THEREFORE, in consideration of the mutual covenants contained herein, the parties agree as follows:`
        ];

        recitals.forEach(recital => {
            if (y > pageHeight - margins.bottom - 50) {
                pdf.addPage();
                y = margins.top;
            }
            const lines = pdf.splitTextToSize(recital, contentWidth);
            pdf.text(lines, margins.left, y);
            y += lines.length * 14 + 10;
        });

        return y + 20;
    }

    private addClausesToPDF(pdf: jsPDF, clauses: Clause[], y: number, margins: any, contentWidth: number, pageHeight: number, template: ContractTemplate): number {
        clauses.forEach((clause, index) => {
            // Check for page break
            if (y > pageHeight - margins.bottom - 100) {
                pdf.addPage();
                y = margins.top;
                if (template.styling.watermark) {
                    this.addPDFWatermark(pdf, template.styling.watermark);
                }
            }

            // Clause number and title
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(12);
            const clauseNum = this.formatClauseNumber(index + 1, template.styling.clauseNumbering);
            pdf.text(`${clauseNum}. ${clause.title.toUpperCase()}`, margins.left, y);
            y += 18;

            // Clause content
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(11);
            const contentLines = pdf.splitTextToSize(clause.content, contentWidth);

            contentLines.forEach((line: string) => {
                if (y > pageHeight - margins.bottom) {
                    pdf.addPage();
                    y = margins.top;
                }
                pdf.text(line, margins.left, y);
                y += 14;
            });

            // Sub-clauses
            if (clause.subClauses) {
                clause.subClauses.forEach((sub, subIndex) => {
                    if (y > pageHeight - margins.bottom - 30) {
                        pdf.addPage();
                        y = margins.top;
                    }
                    pdf.setFont('helvetica', 'normal');
                    const subLines = pdf.splitTextToSize(`(${String.fromCharCode(97 + subIndex)}) ${sub.content}`, contentWidth - 20);
                    subLines.forEach((line: string) => {
                        pdf.text(line, margins.left + 20, y);
                        y += 14;
                    });
                });
            }

            y += template.layout.paragraphSpacing;
        });

        return y;
    }

    private addSignaturePageToPDF(pdf: jsPDF, data: ContractData, template: ContractTemplate) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margins = template.layout.margins;
        let y = margins.top;

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.text('SIGNATURE PAGE', pageWidth / 2, y, { align: 'center' });
        y += 40;

        pdf.setFontSize(11);
        pdf.text('IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.', margins.left, y);
        y += 60;

        // Signature blocks for each party
        data.parties.forEach((party, index) => {
            const xPos = index % 2 === 0 ? margins.left : pageWidth / 2 + 20;
            const yPos = y + Math.floor(index / 2) * 150;

            pdf.setFont('helvetica', 'bold');
            pdf.text(party.name.toUpperCase(), xPos, yPos);

            pdf.setFont('helvetica', 'normal');
            pdf.text('By: _________________________', xPos, yPos + 40);
            pdf.text('Name: ________________________', xPos, yPos + 60);
            pdf.text('Title: ________________________', xPos, yPos + 80);
            pdf.text('Date: ________________________', xPos, yPos + 100);
        });
    }

    // ============== CANVAS RENDERING ==============

    private drawWatermark(ctx: CanvasRenderingContext2D, watermark: WatermarkConfig, width: number, height: number) {
        ctx.save();
        ctx.globalAlpha = watermark.opacity;
        ctx.font = `bold ${watermark.fontSize}px Arial`;
        ctx.fillStyle = watermark.color;
        ctx.textAlign = 'center';
        ctx.translate(width / 2, height / 2);
        ctx.rotate(watermark.angle * Math.PI / 180);
        ctx.fillText(watermark.text, 0, 0);
        ctx.restore();
    }

    private drawContractHeader(ctx: CanvasRenderingContext2D, data: ContractData, template: ContractTemplate, y: number, width: number): number {
        const centerX = width / 2;

        // Title
        ctx.font = 'bold 24px "Times New Roman", serif';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(data.title.toUpperCase(), centerX, y);
        y += 25;

        // Contract number
        ctx.font = '12px "Times New Roman", serif';
        ctx.fillText(`Contract No: ${data.metadata.contractNumber}`, centerX, y);
        y += 30;

        // Decorative line
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(template.layout.margins.left, y);
        ctx.lineTo(width - template.layout.margins.right, y);
        ctx.stroke();

        return y + 30;
    }

    private drawPreamble(ctx: CanvasRenderingContext2D, data: ContractData, template: ContractTemplate, y: number, width: number): number {
        ctx.font = '12px "Times New Roman", serif';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'left';

        const preamble = this.generatePreambleText(data);
        const lines = this.wrapText(ctx, preamble, width - template.layout.margins.left - template.layout.margins.right);

        lines.forEach(line => {
            ctx.fillText(line, template.layout.margins.left, y);
            y += 18;
        });

        return y + 20;
    }

    private drawRecitals(ctx: CanvasRenderingContext2D, data: ContractData, template: ContractTemplate, y: number, width: number): number {
        ctx.font = 'bold 14px "Times New Roman", serif';
        ctx.fillText('RECITALS', template.layout.margins.left, y);
        y += 25;

        ctx.font = '12px "Times New Roman", serif';
        const recitals = [
            `WHEREAS, ${data.parties[0]?.name} desires to enter into this Agreement;`,
            `WHEREAS, ${data.parties[1]?.name} agrees to the terms set forth herein;`
        ];

        recitals.forEach(recital => {
            const lines = this.wrapText(ctx, recital, width - template.layout.margins.left - template.layout.margins.right);
            lines.forEach(line => {
                ctx.fillText(line, template.layout.margins.left, y);
                y += 18;
            });
            y += 10;
        });

        ctx.font = 'italic 12px "Times New Roman", serif';
        ctx.fillText('NOW, THEREFORE, in consideration of the mutual covenants, the parties agree:', template.layout.margins.left, y);

        return y + 30;
    }

    private drawClauses(ctx: CanvasRenderingContext2D, clauses: Clause[], template: ContractTemplate, y: number, width: number): number {
        const contentWidth = width - template.layout.margins.left - template.layout.margins.right;

        clauses.forEach((clause, index) => {
            // Clause header
            ctx.font = 'bold 12px "Times New Roman", serif';
            const clauseNum = this.formatClauseNumber(index + 1, template.styling.clauseNumbering);
            ctx.fillText(`${clauseNum}. ${clause.title.toUpperCase()}`, template.layout.margins.left, y);
            y += 20;

            // Clause content
            ctx.font = '12px "Times New Roman", serif';
            const lines = this.wrapText(ctx, clause.content, contentWidth);
            lines.forEach(line => {
                ctx.fillText(line, template.layout.margins.left, y);
                y += 16;
            });

            y += template.layout.paragraphSpacing;
        });

        return y;
    }

    private drawSignatureBlocks(ctx: CanvasRenderingContext2D, data: ContractData, template: ContractTemplate, width: number, height: number) {
        const y = height - 200;
        const leftX = template.layout.margins.left;
        const rightX = width / 2 + 30;

        data.parties.forEach((party, index) => {
            const xPos = index % 2 === 0 ? leftX : rightX;
            const yPos = y + Math.floor(index / 2) * 100;

            ctx.font = 'bold 12px "Times New Roman", serif';
            ctx.fillText(party.name.toUpperCase(), xPos, yPos);

            ctx.font = '11px "Times New Roman", serif';
            ctx.fillText('By: _________________________', xPos, yPos + 30);
            ctx.fillText('Name: ________________________', xPos, yPos + 50);
            ctx.fillText('Title: ________________________', xPos, yPos + 70);
        });
    }

    // ============== UTILITY METHODS ==============

    private generatePreambleText(data: ContractData): string {
        const party1 = data.parties[0];
        const party2 = data.parties[1];

        return `This ${data.title} ("Agreement") is entered into as of ${this.formatDate(data.effectiveDate)} by and between ${party1?.name || 'First Party'}, a ${party1?.type || 'entity'} with its principal place of business at ${this.formatAddress(party1?.address)} ("${party1?.role === 'first_party' ? 'First Party' : 'Party A'}"), and ${party2?.name || 'Second Party'}, a ${party2?.type || 'entity'} with its principal place of business at ${this.formatAddress(party2?.address)} ("${party2?.role === 'second_party' ? 'Second Party' : 'Party B'}").`;
    }

    private formatAddress(address?: Address): string {
        if (!address) return '[Address]';
        return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
    }

    private formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    private formatClauseNumber(num: number, style: 'numeric' | 'roman' | 'alphabetic'): string {
        if (style === 'roman') {
            return this.toRoman(num);
        } else if (style === 'alphabetic') {
            return String.fromCharCode(64 + num);
        }
        return num.toString();
    }

    private toRoman(num: number): string {
        const romanNumerals: [number, string][] = [
            [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
        ];
        let result = '';
        for (const [value, symbol] of romanNumerals) {
            while (num >= value) {
                result += symbol;
                num -= value;
            }
        }
        return result;
    }

    private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) lines.push(currentLine);

        return lines;
    }

    private generatePlainTextContract(data: ContractData): string {
        let text = '';
        text += `${data.title.toUpperCase()}\n`;
        text += `Contract No: ${data.metadata.contractNumber}\n\n`;
        text += `${this.generatePreambleText(data)}\n\n`;
        text += `RECITALS\n\n`;

        data.clauses.forEach((clause, index) => {
            text += `${index + 1}. ${clause.title.toUpperCase()}\n`;
            text += `${clause.content}\n\n`;
        });

        text += `\nSIGNATURE PAGE\n`;
        data.parties.forEach(party => {
            text += `\n${party.name.toUpperCase()}\n`;
            text += `By: _______________\n`;
            text += `Name: _____________\n`;
            text += `Title: ____________\n`;
            text += `Date: _____________\n`;
        });

        return text;
    }

    private async readFileContent(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    private async parseContractDocument(content: string): Promise<Partial<ContractData>> {
        // Simulated parsing - in production would use NLP/ML
        return {
            title: 'Service Agreement',
            parties: this.generateDefaultParties(),
            clauses: [
                {
                    id: '1',
                    number: '1',
                    title: 'Services',
                    content: 'The Service Provider agrees to provide the services described in Exhibit A.',
                    isBoilerplate: false,
                    category: 'obligations'
                },
                {
                    id: '2',
                    number: '2',
                    title: 'Compensation',
                    content: 'In consideration for the services, Client agrees to pay Service Provider the fees set forth in Exhibit B.',
                    isBoilerplate: false,
                    category: 'payment'
                }
            ]
        };
    }

    private generateDefaultParties(): Party[] {
        return [
            {
                id: 'party-1',
                name: 'Company A, Inc.',
                type: 'corporation',
                role: 'first_party',
                address: { street: '123 Business Ave', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' }
            },
            {
                id: 'party-2',
                name: 'Company B, LLC',
                type: 'llc',
                role: 'second_party',
                address: { street: '456 Commerce St', city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'USA' }
            }
        ];
    }

    private generateContractNumber(): string {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `CTR-${timestamp}-${random}`;
    }

    private async calculateHash(blob: Blob): Promise<string> {
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    }
}
