
import { DocumentDetails, ExportFormat } from '../engines/UniversalDocumentCloneEngine';
import jsPDF from 'jspdf';

// ============== INTERFACES ==============

export interface InvoiceData {
    header: InvoiceHeader;
    parties: InvoiceParties;
    lineItems: LineItem[];
    financial: FinancialSummary;
    dates: InvoiceDates;
    terms: InvoiceTerms;
    payment: PaymentDetails;
    branding: BrandingConfig;
    validation: InvoiceValidation;
    metadata: InvoiceMetadata;
}

export interface InvoiceHeader {
    invoiceNumber: string;
    title: string;
    type: 'invoice' | 'quote' | 'estimate' | 'credit_note' | 'proforma';
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    purchaseOrderNumber?: string;
    projectName?: string;
}

export interface InvoiceParties {
    issuer: BusinessEntity;
    recipient: BusinessEntity;
    shipping?: ShippingAddress;
}

export interface BusinessEntity {
    name: string;
    address: Address;
    email: string;
    phone: string;
    taxId?: string;
    logo?: string;
    website?: string;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface ShippingAddress extends Address {
    recipientName: string;
    deliveryInstructions?: string;
}

export interface LineItem {
    id: string;
    sku?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    taxRate: number;
    discount: number;
    discountType: 'percentage' | 'fixed';
    amount: number;
    notes?: string;
}

export interface FinancialSummary {
    subtotal: number;
    discountTotal: number;
    taxableAmount: number;
    taxes: TaxBreakdown[];
    taxTotal: number;
    shippingCost: number;
    handlingFee: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    currency: Currency;
}

export interface TaxBreakdown {
    name: string;
    rate: number;
    amount: number;
}

export interface Currency {
    code: string;
    symbol: string;
    name: string;
    decimals: number;
}

export interface InvoiceDates {
    issueDate: string;
    dueDate: string;
    deliveryDate?: string;
    serviceStartDate?: string;
    serviceEndDate?: string;
}

export interface InvoiceTerms {
    paymentTerms: PaymentTerm;
    lateFeePolicy?: string;
    earlyPaymentDiscount?: EarlyPaymentDiscount;
    notes: string;
    termsAndConditions?: string;
}

export type PaymentTerm = 'due_on_receipt' | 'net_7' | 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'net_90' | 'custom';

export interface EarlyPaymentDiscount {
    percentage: number;
    daysWithin: number;
}

export interface PaymentDetails {
    methods: PaymentMethod[];
    qrCode?: QRCodePayment;
    bankDetails?: BankDetails;
    onlinePaymentUrl?: string;
}

export interface PaymentMethod {
    type: 'bank_transfer' | 'credit_card' | 'paypal' | 'stripe' | 'check' | 'cash' | 'crypto';
    enabled: boolean;
    details?: string;
}

export interface QRCodePayment {
    enabled: boolean;
    type: 'upi' | 'bitcoin' | 'paypal' | 'custom';
    data: string;
}

export interface BankDetails {
    bankName: string;
    accountName: string;
    accountNumber: string;
    routingNumber: string;
    swiftCode?: string;
    iban?: string;
}

export interface BrandingConfig {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    template: InvoiceStyle;
}

export type InvoiceStyle = 'classic' | 'modern' | 'minimal' | 'professional' | 'creative' | 'corporate';

export interface InvoiceValidation {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationWarning {
    field: string;
    message: string;
}

export interface InvoiceMetadata {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    version: number;
    tags: string[];
}

export interface InvoiceTemplate {
    type: 'invoice';
    layout: InvoiceLayout;
    sections: InvoiceSections;
    design: InvoiceDesign;
    calculations: CalculationRules;
    exportOptions: ExportOptions;
}

interface InvoiceLayout {
    pageSize: 'letter' | 'a4';
    orientation: 'portrait';
    margins: { top: number; right: number; bottom: number; left: number };
    headerHeight: number;
    footerHeight: number;
}

interface InvoiceSections {
    header: boolean;
    billTo: boolean;
    shipTo: boolean;
    lineItems: boolean;
    summary: boolean;
    paymentInfo: boolean;
    notes: boolean;
    qrCode: boolean;
    terms: boolean;
}

interface InvoiceDesign {
    style: InvoiceStyle;
    colorScheme: ColorScheme;
    typography: Typography;
    tableStyle: TableStyle;
}

interface ColorScheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    headerBg: string;
    alternateBg: string;
}

interface Typography {
    headingFont: string;
    bodyFont: string;
    headingSize: number;
    bodySize: number;
}

interface TableStyle {
    headerBg: string;
    headerColor: string;
    rowAlternate: boolean;
    borders: 'all' | 'horizontal' | 'none';
}

interface CalculationRules {
    autoCalculate: boolean;
    roundingMode: 'up' | 'down' | 'nearest';
    taxInclusive: boolean;
}

interface ExportOptions {
    formats: ExportFormat[];
    watermark: boolean;
    includePaymentQR: boolean;
}

export interface ExportedInvoice {
    data: Blob;
    mimeType: string;
    filename: string;
    format: ExportFormat;
    size: number;
    metadata: ExportMetadata;
}

interface ExportMetadata {
    invoiceNumber: string;
    total: number;
    currency: string;
    generatedAt: string;
}

// ============== STYLE PRESETS ==============

const STYLE_PRESETS: Record<InvoiceStyle, ColorScheme> = {
    classic: {
        primary: '#2c3e50',
        secondary: '#34495e',
        accent: '#3498db',
        background: '#ffffff',
        text: '#333333',
        headerBg: '#2c3e50',
        alternateBg: '#f8f9fa'
    },
    modern: {
        primary: '#1a1a2e',
        secondary: '#16213e',
        accent: '#0f3460',
        background: '#ffffff',
        text: '#1a1a2e',
        headerBg: '#1a1a2e',
        alternateBg: '#f0f4f8'
    },
    minimal: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#000000',
        background: '#ffffff',
        text: '#000000',
        headerBg: '#ffffff',
        alternateBg: '#fafafa'
    },
    professional: {
        primary: '#003366',
        secondary: '#004080',
        accent: '#0066cc',
        background: '#ffffff',
        text: '#333333',
        headerBg: '#003366',
        alternateBg: '#e6f2ff'
    },
    creative: {
        primary: '#6c5ce7',
        secondary: '#a29bfe',
        accent: '#fd79a8',
        background: '#ffffff',
        text: '#2d3436',
        headerBg: '#6c5ce7',
        alternateBg: '#f5f3ff'
    },
    corporate: {
        primary: '#1e3a5f',
        secondary: '#2e5077',
        accent: '#4da8da',
        background: '#ffffff',
        text: '#1e3a5f',
        headerBg: '#1e3a5f',
        alternateBg: '#edf4f9'
    }
};

const CURRENCIES: Record<string, Currency> = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2 },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2 },
    JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0 },
    CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2 },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2 }
};

// ============== MAIN CLASS ==============

export class InvoiceDocumentSpecialist {

    async extractInvoiceData(file: File): Promise<InvoiceData> {
        const content = await this.readFileContent(file);
        const parsed = await this.parseInvoiceDocument(content);

        return {
            header: parsed.header || this.generateDefaultHeader(),
            parties: parsed.parties || this.generateDefaultParties(),
            lineItems: parsed.lineItems || [],
            financial: this.calculateFinancials(parsed.lineItems || [], 'USD'),
            dates: parsed.dates || this.generateDefaultDates(),
            terms: { paymentTerms: 'net_30', notes: 'Thank you for your business!' },
            payment: this.generateDefaultPayment(),
            branding: { primaryColor: '#2c3e50', secondaryColor: '#34495e', accentColor: '#3498db', fontFamily: 'Arial', template: 'professional' },
            validation: { isValid: true, errors: [], warnings: [] },
            metadata: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'system', version: 1, tags: [] }
        };
    }

    createInvoiceTemplate(details: DocumentDetails, invoiceData: InvoiceData): InvoiceTemplate {
        const style = invoiceData.branding.template;
        const colors = STYLE_PRESETS[style];

        return {
            type: 'invoice',
            layout: {
                pageSize: 'letter',
                orientation: 'portrait',
                margins: { top: 40, right: 40, bottom: 40, left: 40 },
                headerHeight: 120,
                footerHeight: 80
            },
            sections: {
                header: true,
                billTo: true,
                shipTo: !!invoiceData.parties.shipping,
                lineItems: true,
                summary: true,
                paymentInfo: true,
                notes: !!invoiceData.terms.notes,
                qrCode: !!invoiceData.payment.qrCode?.enabled,
                terms: !!invoiceData.terms.termsAndConditions
            },
            design: {
                style,
                colorScheme: colors,
                typography: { headingFont: 'Arial', bodyFont: 'Arial', headingSize: 24, bodySize: 10 },
                tableStyle: { headerBg: colors.headerBg, headerColor: '#ffffff', rowAlternate: true, borders: 'horizontal' }
            },
            calculations: { autoCalculate: true, roundingMode: 'nearest', taxInclusive: false },
            exportOptions: { formats: ['pdf', 'png', 'csv'], watermark: invoiceData.header.status === 'draft', includePaymentQR: true }
        };
    }

    async generateUltraRealisticInvoice(invoiceData: InvoiceData, template: InvoiceTemplate): Promise<string> {
        const canvas = document.createElement('canvas');
        const width = 816;
        const height = 1056;
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(2, 2);

        const colors = template.design.colorScheme;
        const margins = template.layout.margins;

        // Background
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, width, height);

        // Draft watermark
        if (invoiceData.header.status === 'draft') {
            this.drawWatermark(ctx, 'DRAFT', width, height);
        }

        let y = margins.top;

        // Header with logo and company info
        y = this.drawHeader(ctx, invoiceData, template, y, width);

        // Invoice title and number
        y = this.drawInvoiceTitle(ctx, invoiceData, template, y, width);

        // Bill To / Ship To
        y = this.drawAddressBlocks(ctx, invoiceData, template, y, width);

        // Line items table
        y = this.drawLineItemsTable(ctx, invoiceData, template, y, width);

        // Financial summary
        y = this.drawFinancialSummary(ctx, invoiceData, template, y, width);

        // Payment info and QR code
        this.drawPaymentSection(ctx, invoiceData, template, y, width, height);

        // Footer
        this.drawFooter(ctx, invoiceData, template, width, height);

        return canvas.toDataURL('image/png', 1.0);
    }

    async exportInvoice(invoiceData: InvoiceData, template: InvoiceTemplate, format: ExportFormat): Promise<ExportedInvoice> {
        let blob: Blob;
        let mimeType = 'application/pdf';

        if (format === 'pdf') {
            const pdf = await this.generatePDFInvoice(invoiceData, template);
            blob = pdf.output('blob');
        } else if (format === 'csv') {
            const csv = this.generateCSVInvoice(invoiceData);
            blob = new Blob([csv], { type: 'text/csv' });
            mimeType = 'text/csv';
        } else {
            const preview = await this.generateUltraRealisticInvoice(invoiceData, template);
            const res = await fetch(preview);
            blob = await res.blob();
            mimeType = 'image/png';
        }

        return {
            data: blob,
            mimeType,
            filename: `Invoice_${invoiceData.header.invoiceNumber}.${format}`,
            format,
            size: blob.size,
            metadata: {
                invoiceNumber: invoiceData.header.invoiceNumber,
                total: invoiceData.financial.total,
                currency: invoiceData.financial.currency.code,
                generatedAt: new Date().toISOString()
            }
        };
    }

    // ============== CANVAS DRAWING ==============

    private drawWatermark(ctx: CanvasRenderingContext2D, text: string, width: number, height: number) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.font = 'bold 120px Arial';
        ctx.fillStyle = '#FF0000';
        ctx.textAlign = 'center';
        ctx.translate(width / 2, height / 2);
        ctx.rotate(-45 * Math.PI / 180);
        ctx.fillText(text, 0, 0);
        ctx.restore();
    }

    private drawHeader(ctx: CanvasRenderingContext2D, data: InvoiceData, template: InvoiceTemplate, y: number, width: number): number {
        const colors = template.design.colorScheme;
        const margins = template.layout.margins;
        const issuer = data.parties.issuer;

        // Company name
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = colors.primary;
        ctx.textAlign = 'left';
        ctx.fillText(issuer.name, margins.left, y + 30);

        // Company details on right
        ctx.font = '10px Arial';
        ctx.fillStyle = colors.secondary;
        ctx.textAlign = 'right';
        const rightX = width - margins.right;
        ctx.fillText(issuer.address.street, rightX, y + 10);
        ctx.fillText(`${issuer.address.city}, ${issuer.address.state} ${issuer.address.zipCode}`, rightX, y + 24);
        ctx.fillText(issuer.phone, rightX, y + 38);
        ctx.fillText(issuer.email, rightX, y + 52);
        if (issuer.website) ctx.fillText(issuer.website, rightX, y + 66);

        // Decorative line
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(margins.left, y + 85);
        ctx.lineTo(width - margins.right, y + 85);
        ctx.stroke();

        return y + 100;
    }

    private drawInvoiceTitle(ctx: CanvasRenderingContext2D, data: InvoiceData, template: InvoiceTemplate, y: number, width: number): number {
        const colors = template.design.colorScheme;
        const margins = template.layout.margins;

        // Invoice badge
        ctx.fillStyle = colors.primary;
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('INVOICE', margins.left, y + 40);

        // Invoice details on right
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        const rightX = width - margins.right;

        ctx.fillStyle = colors.text;
        ctx.fillText(`Invoice #: ${data.header.invoiceNumber}`, rightX, y + 15);
        ctx.fillText(`Date: ${this.formatDate(data.dates.issueDate)}`, rightX, y + 30);
        ctx.fillText(`Due Date: ${this.formatDate(data.dates.dueDate)}`, rightX, y + 45);

        // Status badge
        const status = data.header.status.toUpperCase();
        const statusColors: Record<string, string> = {
            DRAFT: '#6c757d',
            SENT: '#007bff',
            PAID: '#28a745',
            OVERDUE: '#dc3545',
            CANCELLED: '#343a40'
        };

        ctx.fillStyle = statusColors[status] || colors.secondary;
        const statusWidth = ctx.measureText(status).width + 20;
        ctx.fillRect(rightX - statusWidth, y + 52, statusWidth, 20);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(status, rightX - 10, y + 66);

        return y + 90;
    }

    private drawAddressBlocks(ctx: CanvasRenderingContext2D, data: InvoiceData, template: InvoiceTemplate, y: number, width: number): number {
        const colors = template.design.colorScheme;
        const margins = template.layout.margins;
        const recipient = data.parties.recipient;

        // Bill To
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = colors.primary;
        ctx.textAlign = 'left';
        ctx.fillText('BILL TO:', margins.left, y);

        ctx.font = '11px Arial';
        ctx.fillStyle = colors.text;
        ctx.fillText(recipient.name, margins.left, y + 16);
        ctx.fillText(recipient.address.street, margins.left, y + 30);
        ctx.fillText(`${recipient.address.city}, ${recipient.address.state} ${recipient.address.zipCode}`, margins.left, y + 44);
        ctx.fillText(recipient.email, margins.left, y + 58);

        // Ship To (if different)
        if (data.parties.shipping) {
            const shipX = width / 2;
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = colors.primary;
            ctx.fillText('SHIP TO:', shipX, y);

            ctx.font = '11px Arial';
            ctx.fillStyle = colors.text;
            ctx.fillText(data.parties.shipping.recipientName, shipX, y + 16);
            ctx.fillText(data.parties.shipping.street, shipX, y + 30);
            ctx.fillText(`${data.parties.shipping.city}, ${data.parties.shipping.state} ${data.parties.shipping.zipCode}`, shipX, y + 44);
        }

        return y + 80;
    }

    private drawLineItemsTable(ctx: CanvasRenderingContext2D, data: InvoiceData, template: InvoiceTemplate, y: number, width: number): number {
        const colors = template.design.colorScheme;
        const margins = template.layout.margins;
        const tableWidth = width - margins.left - margins.right;

        // Column definitions
        const columns = [
            { label: 'DESCRIPTION', width: 0.4, align: 'left' as CanvasTextAlign },
            { label: 'QTY', width: 0.1, align: 'center' as CanvasTextAlign },
            { label: 'RATE', width: 0.15, align: 'right' as CanvasTextAlign },
            { label: 'TAX', width: 0.1, align: 'center' as CanvasTextAlign },
            { label: 'DISCOUNT', width: 0.1, align: 'right' as CanvasTextAlign },
            { label: 'AMOUNT', width: 0.15, align: 'right' as CanvasTextAlign }
        ];

        // Header row
        ctx.fillStyle = colors.headerBg;
        ctx.fillRect(margins.left, y, tableWidth, 25);

        ctx.font = 'bold 9px Arial';
        ctx.fillStyle = '#ffffff';
        let xPos = margins.left + 5;
        columns.forEach(col => {
            const colWidth = tableWidth * col.width;
            ctx.textAlign = col.align;
            const textX = col.align === 'right' ? xPos + colWidth - 10 : col.align === 'center' ? xPos + colWidth / 2 : xPos + 5;
            ctx.fillText(col.label, textX, y + 16);
            xPos += colWidth;
        });
        y += 25;

        // Data rows
        ctx.font = '10px Arial';
        data.lineItems.forEach((item, index) => {
            // Alternate row background
            if (index % 2 === 1) {
                ctx.fillStyle = colors.alternateBg;
                ctx.fillRect(margins.left, y, tableWidth, 24);
            }

            ctx.fillStyle = colors.text;
            xPos = margins.left + 5;

            const rowData = [
                item.description,
                item.quantity.toString(),
                this.formatCurrency(item.unitPrice, data.financial.currency),
                `${item.taxRate}%`,
                item.discount > 0 ? (item.discountType === 'percentage' ? `${item.discount}%` : this.formatCurrency(item.discount, data.financial.currency)) : '-',
                this.formatCurrency(item.amount, data.financial.currency)
            ];

            columns.forEach((col, i) => {
                const colWidth = tableWidth * col.width;
                ctx.textAlign = col.align;
                const textX = col.align === 'right' ? xPos + colWidth - 10 : col.align === 'center' ? xPos + colWidth / 2 : xPos + 5;
                ctx.fillText(rowData[i], textX, y + 16);
                xPos += colWidth;
            });

            y += 24;
        });

        // Bottom border
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margins.left, y);
        ctx.lineTo(width - margins.right, y);
        ctx.stroke();

        return y + 15;
    }

    private drawFinancialSummary(ctx: CanvasRenderingContext2D, data: InvoiceData, template: InvoiceTemplate, y: number, width: number): number {
        const colors = template.design.colorScheme;
        const margins = template.layout.margins;
        const fin = data.financial;
        const currency = fin.currency;

        const summaryX = width - margins.right - 200;
        const valueX = width - margins.right;

        const lines = [
            { label: 'Subtotal:', value: this.formatCurrency(fin.subtotal, currency), bold: false },
            ...(fin.discountTotal > 0 ? [{ label: 'Discount:', value: `-${this.formatCurrency(fin.discountTotal, currency)}`, bold: false }] : []),
            ...fin.taxes.map(tax => ({ label: `${tax.name} (${tax.rate}%):`, value: this.formatCurrency(tax.amount, currency), bold: false })),
            ...(fin.shippingCost > 0 ? [{ label: 'Shipping:', value: this.formatCurrency(fin.shippingCost, currency), bold: false }] : []),
            { label: 'TOTAL:', value: this.formatCurrency(fin.total, currency), bold: true },
            ...(fin.amountPaid > 0 ? [{ label: 'Amount Paid:', value: `-${this.formatCurrency(fin.amountPaid, currency)}`, bold: false }] : []),
            ...(fin.amountDue > 0 && fin.amountDue !== fin.total ? [{ label: 'AMOUNT DUE:', value: this.formatCurrency(fin.amountDue, currency), bold: true }] : [])
        ];

        lines.forEach(line => {
            ctx.font = line.bold ? 'bold 12px Arial' : '11px Arial';
            ctx.fillStyle = line.bold ? colors.primary : colors.text;

            ctx.textAlign = 'right';
            ctx.fillText(line.label, summaryX + 90, y);
            ctx.fillText(line.value, valueX, y);

            y += 18;
        });

        return y + 20;
    }

    private drawPaymentSection(ctx: CanvasRenderingContext2D, data: InvoiceData, template: InvoiceTemplate, y: number, width: number, height: number) {
        const colors = template.design.colorScheme;
        const margins = template.layout.margins;

        // Payment info
        if (data.payment.bankDetails) {
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = colors.primary;
            ctx.textAlign = 'left';
            ctx.fillText('PAYMENT DETAILS', margins.left, y);

            ctx.font = '10px Arial';
            ctx.fillStyle = colors.text;
            const bank = data.payment.bankDetails;
            ctx.fillText(`Bank: ${bank.bankName}`, margins.left, y + 16);
            ctx.fillText(`Account: ${bank.accountNumber}`, margins.left, y + 30);
            ctx.fillText(`Routing: ${bank.routingNumber}`, margins.left, y + 44);
            if (bank.swiftCode) ctx.fillText(`SWIFT: ${bank.swiftCode}`, margins.left, y + 58);
        }

        // Notes
        if (data.terms.notes) {
            const notesY = y + 80;
            ctx.font = 'bold 11px Arial';
            ctx.fillStyle = colors.primary;
            ctx.fillText('NOTES', margins.left, notesY);

            ctx.font = '10px Arial';
            ctx.fillStyle = colors.text;
            ctx.fillText(data.terms.notes, margins.left, notesY + 16);
        }

        // QR Code placeholder (would use actual QR generation in production)
        if (data.payment.qrCode?.enabled) {
            const qrSize = 80;
            const qrX = width - margins.right - qrSize;
            const qrY = y;

            ctx.strokeStyle = colors.primary;
            ctx.lineWidth = 1;
            ctx.strokeRect(qrX, qrY, qrSize, qrSize);

            ctx.font = '8px Arial';
            ctx.fillStyle = colors.secondary;
            ctx.textAlign = 'center';
            ctx.fillText('Scan to Pay', qrX + qrSize / 2, qrY + qrSize + 12);
        }
    }

    private drawFooter(ctx: CanvasRenderingContext2D, data: InvoiceData, template: InvoiceTemplate, width: number, height: number) {
        const colors = template.design.colorScheme;
        const margins = template.layout.margins;
        const footerY = height - margins.bottom;

        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(margins.left, footerY - 20);
        ctx.lineTo(width - margins.right, footerY - 20);
        ctx.stroke();

        ctx.font = '9px Arial';
        ctx.fillStyle = colors.secondary;
        ctx.textAlign = 'center';
        ctx.fillText('Thank you for your business!', width / 2, footerY);
    }

    // ============== PDF GENERATION ==============

    private async generatePDFInvoice(data: InvoiceData, template: InvoiceTemplate): Promise<jsPDF> {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margins = { top: 40, right: 40, bottom: 40, left: 40 };
        const colors = template.design.colorScheme;

        let y = margins.top;

        // Header
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(colors.primary);
        pdf.text(data.parties.issuer.name, margins.left, y + 20);

        // Invoice title
        y += 60;
        pdf.setFontSize(32);
        pdf.text('INVOICE', margins.left, y);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`#${data.header.invoiceNumber}`, pageWidth - margins.right, y - 15, { align: 'right' });
        pdf.text(`Date: ${this.formatDate(data.dates.issueDate)}`, pageWidth - margins.right, y, { align: 'right' });
        pdf.text(`Due: ${this.formatDate(data.dates.dueDate)}`, pageWidth - margins.right, y + 15, { align: 'right' });

        // Bill To
        y += 40;
        pdf.setFont('helvetica', 'bold');
        pdf.text('BILL TO:', margins.left, y);
        pdf.setFont('helvetica', 'normal');
        pdf.text(data.parties.recipient.name, margins.left, y + 15);
        pdf.text(data.parties.recipient.address.street, margins.left, y + 28);
        pdf.text(`${data.parties.recipient.address.city}, ${data.parties.recipient.address.state} ${data.parties.recipient.address.zipCode}`, margins.left, y + 41);

        // Line items table
        y += 70;
        const tableHeaders = ['Description', 'Qty', 'Rate', 'Amount'];
        const colWidths = [250, 60, 100, 100];

        // Header row
        pdf.setFillColor(colors.headerBg);
        pdf.rect(margins.left, y, pageWidth - margins.left - margins.right, 20, 'F');
        pdf.setTextColor('#ffffff');
        pdf.setFont('helvetica', 'bold');

        let xPos = margins.left + 5;
        tableHeaders.forEach((header, i) => {
            pdf.text(header, xPos, y + 14);
            xPos += colWidths[i];
        });

        // Data rows
        y += 20;
        pdf.setTextColor(colors.text);
        pdf.setFont('helvetica', 'normal');

        data.lineItems.forEach(item => {
            xPos = margins.left + 5;
            pdf.text(item.description.substring(0, 40), xPos, y + 14);
            xPos += colWidths[0];
            pdf.text(item.quantity.toString(), xPos, y + 14);
            xPos += colWidths[1];
            pdf.text(this.formatCurrency(item.unitPrice, data.financial.currency), xPos, y + 14);
            xPos += colWidths[2];
            pdf.text(this.formatCurrency(item.amount, data.financial.currency), xPos, y + 14);
            y += 18;
        });

        // Total
        y += 20;
        pdf.setFont('helvetica', 'bold');
        pdf.text('TOTAL:', pageWidth - margins.right - 150, y);
        pdf.text(this.formatCurrency(data.financial.total, data.financial.currency), pageWidth - margins.right, y, { align: 'right' });

        return pdf;
    }

    private generateCSVInvoice(data: InvoiceData): string {
        let csv = 'Description,Quantity,Unit Price,Tax Rate,Discount,Amount\n';
        data.lineItems.forEach(item => {
            csv += `"${item.description}",${item.quantity},${item.unitPrice},${item.taxRate}%,${item.discount},${item.amount}\n`;
        });
        csv += `\n,,,,Subtotal,${data.financial.subtotal}\n`;
        csv += `,,,,Tax,${data.financial.taxTotal}\n`;
        csv += `,,,,Total,${data.financial.total}\n`;
        return csv;
    }

    // ============== UTILITY METHODS ==============

    private formatCurrency(amount: number, currency: Currency): string {
        return `${currency.symbol}${amount.toFixed(currency.decimals)}`;
    }

    private formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    private calculateFinancials(items: LineItem[], currencyCode: string): FinancialSummary {
        const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;

        let subtotal = 0;
        let discountTotal = 0;
        let taxTotal = 0;

        items.forEach(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const discount = item.discountType === 'percentage' ? itemSubtotal * (item.discount / 100) : item.discount;
            const taxableAmount = itemSubtotal - discount;
            const tax = taxableAmount * (item.taxRate / 100);

            subtotal += itemSubtotal;
            discountTotal += discount;
            taxTotal += tax;
            item.amount = taxableAmount + tax;
        });

        const total = subtotal - discountTotal + taxTotal;

        return {
            subtotal,
            discountTotal,
            taxableAmount: subtotal - discountTotal,
            taxes: [{ name: 'Sales Tax', rate: 8.875, amount: taxTotal }],
            taxTotal,
            shippingCost: 0,
            handlingFee: 0,
            total,
            amountPaid: 0,
            amountDue: total,
            currency
        };
    }

    private async readFileContent(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    private async parseInvoiceDocument(content: string): Promise<Partial<InvoiceData>> {
        return {
            header: this.generateDefaultHeader(),
            lineItems: [
                { id: '1', description: 'Professional Services', quantity: 10, unitPrice: 150, unit: 'hour', taxRate: 8.875, discount: 0, discountType: 'fixed', amount: 0 },
                { id: '2', description: 'Software License', quantity: 1, unitPrice: 499, unit: 'each', taxRate: 8.875, discount: 10, discountType: 'percentage', amount: 0 }
            ]
        };
    }

    private generateDefaultHeader(): InvoiceHeader {
        return {
            invoiceNumber: `INV-${Date.now().toString(36).toUpperCase()}`,
            title: 'Invoice',
            type: 'invoice',
            status: 'draft'
        };
    }

    private generateDefaultParties(): InvoiceParties {
        return {
            issuer: {
                name: 'Your Company Name',
                address: { street: '123 Business Ave', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
                email: 'billing@company.com',
                phone: '(555) 123-4567'
            },
            recipient: {
                name: 'Client Company',
                address: { street: '456 Client St', city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'USA' },
                email: 'accounts@client.com',
                phone: '(555) 987-6543'
            }
        };
    }

    private generateDefaultDates(): InvoiceDates {
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 30);

        return {
            issueDate: today.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0]
        };
    }

    private generateDefaultPayment(): PaymentDetails {
        return {
            methods: [
                { type: 'bank_transfer', enabled: true },
                { type: 'credit_card', enabled: true },
                { type: 'check', enabled: true }
            ],
            bankDetails: {
                bankName: 'First National Bank',
                accountName: 'Your Company Name',
                accountNumber: '****1234',
                routingNumber: '021000021'
            }
        };
    }
}
