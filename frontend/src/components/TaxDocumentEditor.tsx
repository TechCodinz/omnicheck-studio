/**
 * TaxDocumentEditor - UI Component for Tax Document Editing
 * 
 * Features:
 * - Upload and OCR any tax document
 * - Auto-detect document type (W-2, 1099, 1040, etc.)
 * - Field extraction and editing
 * - Real-time preview
 * - Tax calculations
 * - Export to PDF
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import TaxFormRenderer from './TaxFormRenderer';
import IDFormRenderer from './IDFormRenderer';
import DeliveryModal, { CheckDeliveryOptions } from './DeliveryModal';
import { BorderConfig } from './BorderlineEngine';
import UltimateCustomizationPanel from './UltimateCustomizationPanel';

// ============== TYPES ==============

type TaxDocumentType =
    | 'W2'
    | '1099-NEC'
    | '1099-MISC'
    | '1099-INT'
    | '1099-DIV'
    | '1099-K'
    | '1040'
    | 'TAX_REFUND'
    | 'DL'
    | 'PASSPORT'
    | 'SSN';

interface ExtractedField {
    id: string;
    name: string;
    label: string;
    value: string;
    type: 'text' | 'currency' | 'ssn' | 'ein' | 'date' | 'percentage';
    required: boolean;
    validation?: {
        isValid: boolean;
        message?: string;
    };
}

interface DocumentState {
    uploadId?: string;
    originalFile?: File;
    previewUrl?: string;
    documentType?: TaxDocumentType;
    confidence?: number;
    fields: ExtractedField[];
    isProcessing: boolean;
    isModified: boolean;
}

interface TaxDocumentEditorProps {
    onDocumentGenerated?: (doc: { type: TaxDocumentType; pdfUrl: string }) => void;
    theme?: 'light' | 'dark';
}

// ============== FIELD TEMPLATES ==============

const DOCUMENT_FIELDS: Record<TaxDocumentType, ExtractedField[]> = {
    'W2': [
        { id: 'employerEIN', name: 'employerEIN', label: 'Employer EIN (Box b)', value: '', type: 'ein', required: true },
        { id: 'employerName', name: 'employerName', label: 'Employer Name (Box c)', value: '', type: 'text', required: true },
        { id: 'employerAddress', name: 'employerAddress', label: 'Employer Address', value: '', type: 'text', required: true },
        { id: 'employeeSSN', name: 'employeeSSN', label: 'Employee SSN (Box a)', value: '', type: 'ssn', required: true },
        { id: 'employeeName', name: 'employeeName', label: 'Employee Name (Box e)', value: '', type: 'text', required: true },
        { id: 'employeeAddress', name: 'employeeAddress', label: 'Employee Address (Box f)', value: '', type: 'text', required: true },
        { id: 'wages', name: 'wages', label: 'Wages (Box 1)', value: '', type: 'currency', required: true },
        { id: 'federalTax', name: 'federalTax', label: 'Federal Tax Withheld (Box 2)', value: '', type: 'currency', required: true },
        { id: 'ssWages', name: 'ssWages', label: 'Social Security Wages (Box 3)', value: '', type: 'currency', required: true },
        { id: 'ssTax', name: 'ssTax', label: 'Social Security Tax (Box 4)', value: '', type: 'currency', required: true },
        { id: 'medicareWages', name: 'medicareWages', label: 'Medicare Wages (Box 5)', value: '', type: 'currency', required: true },
        { id: 'medicareTax', name: 'medicareTax', label: 'Medicare Tax (Box 6)', value: '', type: 'currency', required: true },
        { id: 'stateWages', name: 'stateWages', label: 'State Wages (Box 16)', value: '', type: 'currency', required: false },
        { id: 'stateTax', name: 'stateTax', label: 'State Tax (Box 17)', value: '', type: 'currency', required: false },
        { id: 'state', name: 'state', label: 'State (Box 15)', value: '', type: 'text', required: false },
        { id: 'taxYear', name: 'taxYear', label: 'Tax Year', value: new Date().getFullYear().toString(), type: 'text', required: true }
    ],
    '1099-NEC': [
        { id: 'payerTIN', name: 'payerTIN', label: 'Payer TIN', value: '', type: 'ein', required: true },
        { id: 'payerName', name: 'payerName', label: 'Payer Name', value: '', type: 'text', required: true },
        { id: 'payerAddress', name: 'payerAddress', label: 'Payer Address', value: '', type: 'text', required: true },
        { id: 'recipientTIN', name: 'recipientTIN', label: 'Recipient TIN', value: '', type: 'ssn', required: true },
        { id: 'recipientName', name: 'recipientName', label: 'Recipient Name', value: '', type: 'text', required: true },
        { id: 'recipientAddress', name: 'recipientAddress', label: 'Recipient Address', value: '', type: 'text', required: true },
        { id: 'compensation', name: 'compensation', label: 'Nonemployee Compensation (Box 1)', value: '', type: 'currency', required: true },
        { id: 'federalTax', name: 'federalTax', label: 'Federal Tax Withheld (Box 4)', value: '', type: 'currency', required: false },
        { id: 'taxYear', name: 'taxYear', label: 'Tax Year', value: new Date().getFullYear().toString(), type: 'text', required: true }
    ],
    '1099-MISC': [
        { id: 'payerTIN', name: 'payerTIN', label: 'Payer TIN', value: '', type: 'ein', required: true },
        { id: 'payerName', name: 'payerName', label: 'Payer Name', value: '', type: 'text', required: true },
        { id: 'recipientTIN', name: 'recipientTIN', label: 'Recipient TIN', value: '', type: 'ssn', required: true },
        { id: 'recipientName', name: 'recipientName', label: 'Recipient Name', value: '', type: 'text', required: true },
        { id: 'rents', name: 'rents', label: 'Rents (Box 1)', value: '', type: 'currency', required: false },
        { id: 'royalties', name: 'royalties', label: 'Royalties (Box 2)', value: '', type: 'currency', required: false },
        { id: 'otherIncome', name: 'otherIncome', label: 'Other Income (Box 3)', value: '', type: 'currency', required: false },
        { id: 'federalTax', name: 'federalTax', label: 'Federal Tax Withheld (Box 4)', value: '', type: 'currency', required: false },
        { id: 'taxYear', name: 'taxYear', label: 'Tax Year', value: new Date().getFullYear().toString(), type: 'text', required: true }
    ],
    '1099-INT': [
        { id: 'payerTIN', name: 'payerTIN', label: 'Payer TIN', value: '', type: 'ein', required: true },
        { id: 'payerName', name: 'payerName', label: 'Payer Name', value: '', type: 'text', required: true },
        { id: 'recipientTIN', name: 'recipientTIN', label: 'Recipient TIN', value: '', type: 'ssn', required: true },
        { id: 'recipientName', name: 'recipientName', label: 'Recipient Name', value: '', type: 'text', required: true },
        { id: 'interestIncome', name: 'interestIncome', label: 'Interest Income (Box 1)', value: '', type: 'currency', required: true },
        { id: 'earlyWithdrawalPenalty', name: 'earlyWithdrawalPenalty', label: 'Early Withdrawal Penalty (Box 2)', value: '', type: 'currency', required: false },
        { id: 'federalTax', name: 'federalTax', label: 'Federal Tax Withheld (Box 4)', value: '', type: 'currency', required: false },
        { id: 'taxYear', name: 'taxYear', label: 'Tax Year', value: new Date().getFullYear().toString(), type: 'text', required: true }
    ],
    '1099-DIV': [
        { id: 'payerTIN', name: 'payerTIN', label: 'Payer TIN', value: '', type: 'ein', required: true },
        { id: 'payerName', name: 'payerName', label: 'Payer Name', value: '', type: 'text', required: true },
        { id: 'recipientTIN', name: 'recipientTIN', label: 'Recipient TIN', value: '', type: 'ssn', required: true },
        { id: 'recipientName', name: 'recipientName', label: 'Recipient Name', value: '', type: 'text', required: true },
        { id: 'ordinaryDividends', name: 'ordinaryDividends', label: 'Ordinary Dividends (Box 1a)', value: '', type: 'currency', required: true },
        { id: 'qualifiedDividends', name: 'qualifiedDividends', label: 'Qualified Dividends (Box 1b)', value: '', type: 'currency', required: false },
        { id: 'capitalGain', name: 'capitalGain', label: 'Capital Gain Distribution (Box 2a)', value: '', type: 'currency', required: false },
        { id: 'federalTax', name: 'federalTax', label: 'Federal Tax Withheld (Box 4)', value: '', type: 'currency', required: false },
        { id: 'taxYear', name: 'taxYear', label: 'Tax Year', value: new Date().getFullYear().toString(), type: 'text', required: true }
    ],
    '1099-K': [
        { id: 'pseName', name: 'pseName', label: 'PSE Name', value: '', type: 'text', required: true },
        { id: 'pseTIN', name: 'pseTIN', label: 'PSE TIN', value: '', type: 'ein', required: true },
        { id: 'payeeTIN', name: 'payeeTIN', label: 'Payee TIN', value: '', type: 'ssn', required: true },
        { id: 'payeeName', name: 'payeeName', label: 'Payee Name', value: '', type: 'text', required: true },
        { id: 'grossAmount', name: 'grossAmount', label: 'Gross Amount (Box 1a)', value: '', type: 'currency', required: true },
        { id: 'transactions', name: 'transactions', label: 'Number of Transactions (Box 5a)', value: '', type: 'text', required: false },
        { id: 'federalTax', name: 'federalTax', label: 'Federal Tax Withheld (Box 4)', value: '', type: 'currency', required: false },
        { id: 'taxYear', name: 'taxYear', label: 'Tax Year', value: new Date().getFullYear().toString(), type: 'text', required: true }
    ],
    '1040': [
        { id: 'taxpayerName', name: 'taxpayerName', label: 'Taxpayer Name', value: '', type: 'text', required: true },
        { id: 'taxpayerSSN', name: 'taxpayerSSN', label: 'Taxpayer SSN', value: '', type: 'ssn', required: true },
        { id: 'spouseName', name: 'spouseName', label: 'Spouse Name', value: '', type: 'text', required: false },
        { id: 'spouseSSN', name: 'spouseSSN', label: 'Spouse SSN', value: '', type: 'ssn', required: false },
        { id: 'address', name: 'address', label: 'Address', value: '', type: 'text', required: true },
        { id: 'totalIncome', name: 'totalIncome', label: 'Total Income', value: '', type: 'currency', required: true },
        { id: 'agi', name: 'agi', label: 'Adjusted Gross Income', value: '', type: 'currency', required: true },
        { id: 'standardDeduction', name: 'standardDeduction', label: 'Standard Deduction', value: '', type: 'currency', required: true },
        { id: 'taxableIncome', name: 'taxableIncome', label: 'Taxable Income', value: '', type: 'currency', required: true },
        { id: 'totalTax', name: 'totalTax', label: 'Total Tax', value: '', type: 'currency', required: true },
        { id: 'totalPayments', name: 'totalPayments', label: 'Total Payments', value: '', type: 'currency', required: true },
        { id: 'refundOwed', name: 'refundOwed', label: 'Refund / Amount Owed', value: '', type: 'currency', required: true },
        { id: 'taxYear', name: 'taxYear', label: 'Tax Year', value: new Date().getFullYear().toString(), type: 'text', required: true }
    ],
    'TAX_REFUND': [
        { id: 'taxpayerName', name: 'taxpayerName', label: 'Taxpayer Name', value: '', type: 'text', required: true },
        { id: 'taxpayerSSN', name: 'taxpayerSSN', label: 'Taxpayer SSN', value: '', type: 'ssn', required: true },
        { id: 'refundAmount', name: 'refundAmount', label: 'Refund Amount', value: '', type: 'currency', required: true },
        { id: 'federalRefund', name: 'federalRefund', label: 'Federal Refund', value: '', type: 'currency', required: false },
        { id: 'stateRefund', name: 'stateRefund', label: 'State Refund', value: '', type: 'currency', required: false },
        { id: 'routingNumber', name: 'routingNumber', label: 'Routing Number', value: '', type: 'text', required: false },
        { id: 'accountNumber', name: 'accountNumber', label: 'Account Number', value: '', type: 'text', required: false },
        { id: 'accountType', name: 'accountType', label: 'Account Type', value: 'checking', type: 'text', required: false },
        { id: 'estimatedDate', name: 'estimatedDate', label: 'Estimated Deposit Date', value: '', type: 'date', required: false },
        { id: 'taxYear', name: 'taxYear', label: 'Tax Year', value: new Date().getFullYear().toString(), type: 'text', required: true }
    ],
    'DL': [
        { id: 'lastName', name: 'lastName', label: 'Surname (LN)', value: '', type: 'text', required: true },
        { id: 'firstName', name: 'firstName', label: 'First Name (FN)', value: '', type: 'text', required: true },
        { id: 'address', name: 'address', label: 'Address (ADR)', value: '', type: 'text', required: true },
        { id: 'dob', name: 'dob', label: 'Date of Birth (DOB)', value: '', type: 'date', required: true },
        { id: 'sex', name: 'sex', label: 'Sex', value: '', type: 'text', required: true },
        { id: 'height', name: 'height', label: 'Height (HGT)', value: '', type: 'text', required: true },
        { id: 'eyes', name: 'eyes', label: 'Eyes', value: '', type: 'text', required: true },
        { id: 'issued', name: 'issued', label: 'Issued (ISS)', value: '', type: 'date', required: true },
        { id: 'expires', name: 'expires', label: 'Expires (EXP)', value: '', type: 'date', required: true },
        { id: 'dlNumber', name: 'dlNumber', label: 'DL Number', value: '', type: 'text', required: true }
    ],
    'PASSPORT': [
        { id: 'surname', name: 'surname', label: 'Surname', value: '', type: 'text', required: true },
        { id: 'givenNames', name: 'givenNames', label: 'Given Names', value: '', type: 'text', required: true },
        { id: 'nationality', name: 'nationality', label: 'Nationality', value: 'USA', type: 'text', required: true },
        { id: 'dob', name: 'dob', label: 'Date of Birth', value: '', type: 'date', required: true },
        { id: 'placeOfBirth', name: 'placeOfBirth', label: 'Place of Birth', value: '', type: 'text', required: true },
        { id: 'sex', name: 'sex', label: 'Sex', value: '', type: 'text', required: true },
        { id: 'issued', name: 'issued', label: 'Date of Issue', value: '', type: 'date', required: true },
        { id: 'expires', name: 'expires', label: 'Date of Expiration', value: '', type: 'date', required: true },
        { id: 'passportNumber', name: 'passportNumber', label: 'Passport Card No', value: '', type: 'text', required: true }
    ],
    'SSN': [
        { id: 'name', name: 'name', label: 'Full Name', value: '', type: 'text', required: true },
        { id: 'ssn', name: 'ssn', label: 'Social Security Number', value: '', type: 'ssn', required: true },
        { id: 'signature', name: 'signature', label: 'Signature Name (Cursive)', value: '', type: 'text', required: true }
    ]
};

// ============== COMPONENT ==============

export const TaxDocumentEditor: React.FC<TaxDocumentEditorProps> = ({
    onDocumentGenerated,
    theme = 'light'
}) => {
    const [state, setState] = useState<DocumentState>({
        fields: [],
        isProcessing: false,
        isModified: false
    });
    const [selectedDocType, setSelectedDocType] = useState<TaxDocumentType | null>(null);
    const [activeTab, setActiveTab] = useState<'upload' | 'create' | 'history'>('upload');
    const [editorTab, setEditorTab] = useState<'fields' | 'design'>('fields');
    const [history, setHistory] = useState<any[]>([]);
    const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
    const [borderConfig, setBorderConfig] = useState<BorderConfig>({
        style: 'SOLID',
        color: '#222222',
        thickness: 2,
        cornerRadius: 0
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const userId = 'demo-user-123'; // In a real app, this would come from auth context

    const handleDeliver = async (method: string, options: CheckDeliveryOptions) => {
        console.log(`Delivering tax doc via ${method}`, options);
        await saveToDB('SENT');
        setIsDeliveryOpen(false);
        alert(`Your tax document has been sent via ${method}!`);
    };


    // Load history
    useEffect(() => {
        if (activeTab === 'history') {
            fetch(`/api/tax/documents/${userId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
                .then(res => res.json())
                .then(data => setHistory(data))
                .catch(err => console.error('Failed to load history', err));
        }
    }, [activeTab]);

    const saveToDB = async (status: string = 'DRAFT') => {
        const payload = {
            userId,
            templateId: `irs-${state.documentType?.toLowerCase()}-standard`,
            data: state.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {}),
            status
        };

        try {
            const res = await fetch('/api/tax/documents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                alert('Document saved successfully!');
                setState(prev => ({ ...prev, isModified: false }));
            }
        } catch (error) {
            console.error('Save failed', error);
        }
    };


    const colors = {
        bg: theme === 'dark' ? '#111827' : '#F9FAFB',
        card: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        text: theme === 'dark' ? '#FFFFFF' : '#111827',
        textSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        border: theme === 'dark' ? '#374151' : '#E5E7EB',
        primary: '#3B82F6',
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B'
    };

    // Handle file upload
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setState(prev => ({ ...prev, isProcessing: true, originalFile: file }));

        try {
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);

            // Simulate OCR processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Auto-detect document type (simulated)
            const detectedType = detectDocumentType(file.name);
            const fields = [...DOCUMENT_FIELDS[detectedType]];

            // Simulate extracted values
            fields.forEach(field => {
                field.value = generateMockValue(field);
                field.validation = validateField(field);
            });

            setState({
                uploadId: `upload_${Date.now()}`,
                originalFile: file,
                previewUrl,
                documentType: detectedType,
                confidence: 0.92,
                fields,
                isProcessing: false,
                isModified: false
            });

            setSelectedDocType(detectedType);

        } catch (error) {
            console.error('Upload failed:', error);
            setState(prev => ({ ...prev, isProcessing: false }));
        }
    }, []);

    // Handle field change
    const handleFieldChange = useCallback((fieldId: string, value: string) => {
        setState(prev => {
            const newFields = prev.fields.map(f => {
                if (f.id === fieldId) {
                    const updated = { ...f, value };
                    updated.validation = validateField(updated);
                    return updated;
                }
                return f;
            });
            return { ...prev, fields: newFields, isModified: true };
        });
    }, []);

    // Create new document
    const handleCreateNew = useCallback((docType: TaxDocumentType) => {
        setSelectedDocType(docType);
        const fields = DOCUMENT_FIELDS[docType].map(f => ({
            ...f,
            value: f.value || '',
            validation: { isValid: !f.required || !!f.value }
        }));

        setState({
            documentType: docType,
            fields,
            isProcessing: false,
            isModified: false
        });
    }, []);

    // Generate document
    const handleGenerate = useCallback(async () => {
        if (!state.documentType) return;

        setState(prev => ({ ...prev, isProcessing: true }));

        try {
            // Simulate document generation
            await new Promise(resolve => setTimeout(resolve, 1500));

            const pdfUrl = `data:application/pdf;base64,${btoa('Generated PDF content')}`;

            onDocumentGenerated?.({
                type: state.documentType,
                pdfUrl
            });

            alert('Document generated successfully!');

        } catch (error) {
            console.error('Generation failed:', error);
        } finally {
            setState(prev => ({ ...prev, isProcessing: false }));
        }
    }, [state.documentType, state.fields, onDocumentGenerated]);

    // Format field value for display
    const formatFieldValue = (value: string, type: ExtractedField['type']): string => {
        switch (type) {
            case 'currency':
                const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
                return isNaN(num) ? value : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
            case 'ssn':
                const ssn = value.replace(/\D/g, '');
                if (ssn.length === 9) return `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5)}`;
                return value;
            case 'ein':
                const ein = value.replace(/\D/g, '');
                if (ein.length === 9) return `${ein.slice(0, 2)}-${ein.slice(2)}`;
                return value;
            default:
                return value;
        }
    };

    // Render document type selector
    const renderDocTypeSelector = () => (
        <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: colors.text, marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                Select Document Type
            </h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '12px'
            }}>
                {(Object.keys(DOCUMENT_FIELDS) as TaxDocumentType[]).map(docType => (
                    <button
                        key={docType}
                        onClick={() => handleCreateNew(docType)}
                        style={{
                            padding: '16px',
                            background: selectedDocType === docType ? colors.primary : colors.card,
                            color: selectedDocType === docType ? '#FFFFFF' : colors.text,
                            border: `2px solid ${selectedDocType === docType ? colors.primary : colors.border}`,
                            borderRadius: '10px',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                            {getDocTypeIcon(docType)}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>
                            {docType.replace(/-/g, '-').replace(/_/g, ' ')}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );

    // Render upload zone
    const renderUploadZone = () => (
        <div
            onClick={() => fileInputRef.current?.click()}
            style={{
                border: `2px dashed ${colors.border}`,
                borderRadius: '12px',
                padding: '48px',
                textAlign: 'center',
                cursor: 'pointer',
                background: colors.card,
                transition: 'border-color 0.2s'
            }}
        >
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.tiff"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
            <div style={{ color: colors.text, fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
                Drop tax document here or click to upload
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '13px' }}>
                Supports W-2, 1099, 1040, and other tax forms (PDF, JPG, PNG)
            </div>
        </div>
    );

    // Render field editor
    const renderFieldEditor = () => (
        <div style={{
            background: colors.card,
            borderRadius: '12px',
            padding: '24px',
            border: `1px solid ${colors.border}`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                    📝 {state.documentType?.replace(/-/g, '-').replace(/_/g, ' ')} Fields
                </h3>
                {state.confidence && (
                    <span style={{
                        padding: '4px 12px',
                        background: `${colors.success}20`,
                        color: colors.success,
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}>
                        {(state.confidence * 100).toFixed(0)}% Confidence
                    </span>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
            }}>
                {state.fields.map(field => (
                    <div key={field.id}>
                        <label style={{
                            display: 'block',
                            color: colors.text,
                            fontSize: '13px',
                            fontWeight: '500',
                            marginBottom: '6px'
                        }}>
                            {field.label}
                            {field.required && <span style={{ color: colors.error }}> *</span>}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                value={field.value}
                                onChange={e => handleFieldChange(field.id, e.target.value)}
                                placeholder={getPlaceholder(field.type)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    paddingRight: field.validation && !field.validation.isValid ? '36px' : '12px',
                                    border: `1px solid ${field.validation?.isValid === false ? colors.error : colors.border}`,
                                    borderRadius: '8px',
                                    background: colors.bg,
                                    color: colors.text,
                                    fontSize: '14px'
                                }}
                            />
                            {field.validation && !field.validation.isValid && (
                                <span style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: colors.error
                                }}>
                                    ⚠️
                                </span>
                            )}
                        </div>
                        {field.validation?.message && (
                            <p style={{
                                margin: '4px 0 0',
                                fontSize: '11px',
                                color: field.validation.isValid ? colors.success : colors.error
                            }}>
                                {field.validation.message}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    // Render preview panel
    const renderPreview = () => {
        if (!state.previewUrl && !state.documentType) return null;

        return (
            <div style={{
                flex: 1,
                background: colors.card,
                borderRadius: '12px',
                padding: '24px',
                border: `1px solid ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                overflow: 'auto'
            }}>
                <h3 style={{ alignSelf: 'flex-start', margin: '0 0 20px', color: colors.text, fontSize: '16px', fontWeight: '600' }}>
                    👁️ Live Preview
                </h3>

                <div style={{
                    transform: 'scale(0.9)',
                    transformOrigin: 'top center',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}>
                    {(['DL', 'PASSPORT', 'SSN'].includes(state.documentType || '')) ? (
                        <IDFormRenderer
                            type={state.documentType as any}
                            data={state.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {})}
                            scale={1.2}
                            borderConfig={borderConfig}
                        />
                    ) : (
                        <TaxFormRenderer
                            type={state.documentType || 'W2'}
                            data={state.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), {})}
                            scale={state.documentType === '1040' ? 0.9 : 1}
                            borderConfig={borderConfig}
                        />
                    )}
                </div>
            </div>
        );
    };


    // Check if form is valid
    const isFormValid = state.fields.every(f => !f.required || (f.value && f.validation?.isValid !== false));
    const isComplete = state.fields.every(f => !f.required || !!f.value);

    return (
        <div style={{
            background: colors.bg,
            borderRadius: '16px',
            padding: '24px',
            minHeight: '600px'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px', color: colors.text, fontSize: '20px', fontWeight: '700' }}>
                    📋 Tax Document Editor
                </h2>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>
                    Upload, edit, and generate tax documents (W-2, 1099, 1040, etc.)
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button
                    onClick={() => setActiveTab('upload')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'upload' ? colors.primary : 'transparent',
                        color: activeTab === 'upload' ? '#FFFFFF' : colors.textSecondary,
                        border: `1px solid ${activeTab === 'upload' ? colors.primary : colors.border}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    📤 Upload & Edit
                </button>
                <button
                    onClick={() => setActiveTab('create')}
                    style={{
                        padding: '10px 20px',
                        background: activeTab === 'create' ? colors.primary : 'transparent',
                        color: activeTab === 'create' ? '#FFFFFF' : colors.textSecondary,
                        border: `1px solid ${activeTab === 'create' ? colors.primary : colors.border}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    ➕ Create New
                </button>
            </div>

            {/* Processing indicator */}
            {state.isProcessing && (
                <div style={{
                    background: `${colors.primary}10`,
                    border: `1px solid ${colors.primary}`,
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    <span style={{ color: colors.text }}>Processing document...</span>
                </div>
            )}

            {/* Content based on tab */}
            {activeTab === 'upload' && !state.documentType && renderUploadZone()}
            {activeTab === 'create' && !state.documentType && renderDocTypeSelector()}

            {activeTab === 'history' && (
                <div style={{ background: colors.card, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
                    <h3 style={{ color: colors.text, marginBottom: '16px' }}>Past Documents</h3>
                    {history.length === 0 ? (
                        <p style={{ color: colors.textSecondary }}>No documents found.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {history.map(doc => (
                                <div key={doc.id} style={{ padding: '16px', border: `1px solid ${colors.border}`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: colors.text, fontWeight: '600' }}>{doc.template_id.replace('irs-', '').replace('-standard', '').toUpperCase()}</div>
                                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>Updated: {new Date(doc.updated_at).toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', background: doc.status === 'SENT' ? '#c8e6c9' : '#fff9c4' }}>{doc.status}</span>
                                        <button
                                            onClick={() => {
                                                const fields = DOCUMENT_FIELDS[detectDocumentType(doc.template_id) as TaxDocumentType].map(f => ({
                                                    ...f,
                                                    value: doc.data[f.name] || ''
                                                }));
                                                setState({
                                                    documentType: detectDocumentType(doc.template_id) as TaxDocumentType,
                                                    fields,
                                                    isProcessing: false,
                                                    isModified: false
                                                });
                                                setActiveTab('upload');
                                            }}
                                            style={{ padding: '4px 12px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Load
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab Navigation (Phase 41 Enhancement) */}
            {state.documentType && (
                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '12px' }}>
                    <button
                        onClick={() => setEditorTab('fields')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: editorTab === 'fields' ? `3px solid ${colors.primary}` : 'none',
                            color: editorTab === 'fields' ? colors.primary : colors.textSecondary,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '700',
                            transition: 'all 0.2s'
                        }}
                    >
                        📝 Document Fields
                    </button>
                    <button
                        onClick={() => setEditorTab('design')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: editorTab === 'design' ? `3px solid ${colors.primary}` : 'none',
                            color: editorTab === 'design' ? colors.primary : colors.textSecondary,
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '700',
                            transition: 'all 0.2s'
                        }}
                    >
                        🎨 Border & Design
                    </button>
                </div>
            )}

            {/* Content Area */}
            {state.documentType && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                    {/* Left Column: Editor/Customizer */}
                    <div>
                        {editorTab === 'fields' ? (
                            <>
                                {state.fields.length > 0 && renderFieldEditor()}
                            </>
                        ) : (
                            <div style={{ background: colors.card, borderRadius: '12px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                                <div style={{ padding: '20px', borderBottom: `1px solid ${colors.border}`, background: `${colors.primary}05` }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', color: colors.text }}>Secure Border & Style Engine</h4>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: colors.textSecondary }}>
                                        Select from various high-security border patterns and styles.
                                    </p>
                                </div>
                                <div style={{ padding: '20px' }}>
                                    <UltimateCustomizationPanel
                                        checkData={state.fields.reduce((acc, f) => ({ ...acc, [f.name]: f.value }), { id: state.uploadId || 'temp' } as any)}
                                        onUpdate={(c) => {
                                            if (c.borderConfig) setBorderConfig(c.borderConfig);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Status/Validation (moved here) */}
                        <div style={{ marginTop: '24px' }}>
                            <div style={{ padding: '12px', borderRadius: '8px', background: isFormValid ? `${colors.success}15` : `${colors.border}50`, textAlign: 'center' }}>
                                <span style={{ color: isComplete ? colors.success : colors.textSecondary, fontSize: '12px' }}>
                                    {isComplete ? '✅ Document data is complete' : `⏳ ${state.fields.filter(f => f.required && !f.value).length} required fields remaining`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Live Perspective Preview */}
                    <div>
                        {renderPreview()}

                        {/* AGI Tools (mini version) */}
                        <div style={{ marginTop: '24px', background: colors.card, padding: '16px', borderRadius: '12px', border: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: colors.textSecondary }}>Estimated AGI</div>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: colors.success }}>{calculateAGI(state.fields, state.documentType)}</div>
                            </div>
                            <button style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${colors.border}`, background: colors.bg, fontSize: '12px', cursor: 'pointer' }}>View Details</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            {state.documentType && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '24px',
                    gap: '12px'
                }}>
                    <button
                        onClick={() => saveToDB()}
                        disabled={state.isProcessing || !state.isModified}
                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            color: colors.primary,
                            border: `1px solid ${colors.primary}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        💾 Save Draft
                    </button>
                    <button
                        onClick={() => {
                            setState({ fields: [], isProcessing: false, isModified: false });
                            setSelectedDocType(null);
                        }}

                        style={{
                            padding: '12px 24px',
                            background: 'transparent',
                            color: colors.textSecondary,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        ← Start Over
                    </button>
                    <button
                        onClick={() => setIsDeliveryOpen(true)}
                        disabled={!isFormValid || state.isProcessing}
                        style={{
                            padding: '12px 32px',
                            background: isFormValid ? colors.primary : colors.border,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isFormValid ? 'pointer' : 'not-allowed',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {state.isProcessing ? '⏳ Generating...' : '📄 Generate & Send'}
                    </button>
                </div>
            )}

            <DeliveryModal
                isOpen={isDeliveryOpen}
                onClose={() => setIsDeliveryOpen(false)}
                onDeliver={handleDeliver}
            />

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

// ============== HELPER FUNCTIONS ==============

function calculateAGI(fields: ExtractedField[], type: TaxDocumentType | undefined): string {
    if (!type) return '$0.00';

    let total = 0;
    const getValue = (name: string) => {
        const f = fields.find(f => f.name === name);
        return f ? parseFloat(f.value.replace(/[^0-9.-]/g, '')) || 0 : 0;
    };

    switch (type) {
        case 'W2':
            total += getValue('wages');
            break;
        case '1099-NEC':
            total += getValue('compensation');
            break;
        case '1099-MISC':
            total += getValue('rents') + getValue('royalties') + getValue('otherIncome');
            break;
        case '1099-INT':
            total += getValue('interestIncome');
            break;
        case '1099-DIV':
            total += getValue('ordinaryDividends');
            break;
        case '1099-K':
            total += getValue('grossAmount');
            break;
        case '1040':
            total += getValue('totalIncome'); // Already computed on form ideally
            break;
    }

    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
}

function detectDocumentType(filename: string): TaxDocumentType {
    const lower = filename.toLowerCase();
    if (lower.includes('w2') || lower.includes('w-2')) return 'W2';
    if (lower.includes('1099-nec') || lower.includes('1099nec')) return '1099-NEC';
    if (lower.includes('1099-misc') || lower.includes('1099misc')) return '1099-MISC';
    if (lower.includes('1099-int') || lower.includes('1099int')) return '1099-INT';
    if (lower.includes('1099-div') || lower.includes('1099div')) return '1099-DIV';
    if (lower.includes('1099-k') || lower.includes('1099k')) return '1099-K';
    if (lower.includes('1040')) return '1040';
    if (lower.includes('refund')) return 'TAX_REFUND';
    return 'W2'; // Default
}

function generateMockValue(field: ExtractedField): string {
    switch (field.type) {
        case 'currency':
            return (Math.random() * 50000 + 10000).toFixed(2);
        case 'ssn':
            return `${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000) + 1000}`;
        case 'ein':
            return `${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 9000000) + 1000000}`;
        case 'date':
            return new Date().toISOString().split('T')[0];
        default:
            return '';
    }
}

function validateField(field: ExtractedField): { isValid: boolean; message?: string } {
    if (field.required && !field.value) {
        return { isValid: false, message: 'This field is required' };
    }

    switch (field.type) {
        case 'ssn':
            const ssn = field.value.replace(/\D/g, '');
            if (field.value && ssn.length !== 9) {
                return { isValid: false, message: 'SSN must be 9 digits' };
            }
            break;
        case 'ein':
            const ein = field.value.replace(/\D/g, '');
            if (field.value && ein.length !== 9) {
                return { isValid: false, message: 'EIN must be 9 digits' };
            }
            break;
        case 'currency':
            if (field.value && isNaN(parseFloat(field.value.replace(/[^0-9.-]/g, '')))) {
                return { isValid: false, message: 'Must be a valid amount' };
            }
            break;
    }

    return { isValid: true };
}

function getDocTypeIcon(type: TaxDocumentType): string {
    const icons: Record<TaxDocumentType, string> = {
        'W2': '📝',
        '1099-NEC': '💼',
        '1099-MISC': '📋',
        '1099-INT': '🏦',
        '1099-DIV': '📈',
        '1099-K': '💳',
        '1040': '📑',
        'TAX_REFUND': '💰',
        'DL': '🪪',
        'PASSPORT': '🛂',
        'SSN': '🔢'
    };
    return icons[type] || '📄';
}

function getPlaceholder(type: ExtractedField['type']): string {
    const placeholders: Record<string, string> = {
        'ssn': 'XXX-XX-XXXX',
        'ein': 'XX-XXXXXXX',
        'currency': '$0.00',
        'date': 'YYYY-MM-DD',
        'percentage': '0%'
    };
    return placeholders[type] || '';
}

export default TaxDocumentEditor;
