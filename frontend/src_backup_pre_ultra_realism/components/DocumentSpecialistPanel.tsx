/**
 * DocumentSpecialistPanel - Unified UI for Document Specialists
 * 
 * Features:
 * - Certificate generation
 * - Contract creation
 * - Invoice builder
 * - ID document tools
 * - Template selection
 * - Preview and export
 */

import React, { useState, useCallback } from 'react';

// ============== TYPES ==============

type DocumentType = 'certificate' | 'contract' | 'invoice' | 'id';

interface TemplateOption {
    id: string;
    name: string;
    description: string;
    preview: string;
    category: string;
}

interface DocumentField {
    id: string;
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'file';
    required: boolean;
    options?: string[];
    placeholder?: string;
}

interface GeneratedDocument {
    id: string;
    type: DocumentType;
    previewUrl: string;
    downloadUrl: string;
    createdAt: string;
}

interface DocumentSpecialistPanelProps {
    onDocumentGenerated?: (doc: GeneratedDocument) => void;
    theme?: 'light' | 'dark';
}

// ============== DOCUMENT CONFIGS ==============

const DOCUMENT_TYPES: Record<DocumentType, { icon: string; label: string; description: string }> = {
    certificate: {
        icon: '🏆',
        label: 'Certificate',
        description: 'Awards, diplomas, and achievement certificates'
    },
    contract: {
        icon: '📜',
        label: 'Contract',
        description: 'Legal agreements and business contracts'
    },
    invoice: {
        icon: '🧾',
        label: 'Invoice',
        description: 'Professional invoices and billing statements'
    },
    id: {
        icon: '🪪',
        label: 'ID Document',
        description: 'ID cards and identity documents'
    }
};

const TEMPLATES: Record<DocumentType, TemplateOption[]> = {
    certificate: [
        { id: 'achievement', name: 'Achievement Award', description: 'Classic achievement certificate', preview: '🏅', category: 'Awards' },
        { id: 'completion', name: 'Course Completion', description: 'Educational completion certificate', preview: '📚', category: 'Education' },
        { id: 'excellence', name: 'Excellence Award', description: 'Premium excellence certificate', preview: '⭐', category: 'Awards' },
        { id: 'participation', name: 'Participation', description: 'Event participation certificate', preview: '🎯', category: 'Events' }
    ],
    contract: [
        { id: 'nda', name: 'Non-Disclosure Agreement', description: 'Standard NDA template', preview: '🔒', category: 'Legal' },
        { id: 'employment', name: 'Employment Contract', description: 'Employee agreement template', preview: '💼', category: 'HR' },
        { id: 'service', name: 'Service Agreement', description: 'Professional services contract', preview: '🤝', category: 'Business' },
        { id: 'freelance', name: 'Freelance Contract', description: 'Independent contractor agreement', preview: '💻', category: 'Business' }
    ],
    invoice: [
        { id: 'modern', name: 'Modern', description: 'Clean, contemporary design', preview: '✨', category: 'Style' },
        { id: 'classic', name: 'Classic', description: 'Traditional professional look', preview: '📋', category: 'Style' },
        { id: 'minimal', name: 'Minimal', description: 'Simple and elegant', preview: '⬜', category: 'Style' },
        { id: 'corporate', name: 'Corporate', description: 'Enterprise-ready template', preview: '🏢', category: 'Style' }
    ],
    id: [
        { id: 'drivers_license', name: "Driver's License", description: 'State driver license format', preview: '🚗', category: 'Government' },
        { id: 'state_id', name: 'State ID', description: 'Non-driver state ID', preview: '🆔', category: 'Government' },
        { id: 'employee', name: 'Employee Badge', description: 'Corporate employee ID', preview: '👔', category: 'Corporate' },
        { id: 'student', name: 'Student ID', description: 'Educational institution ID', preview: '🎓', category: 'Education' }
    ]
};

const DOCUMENT_FIELDS: Record<DocumentType, DocumentField[]> = {
    certificate: [
        { id: 'recipientName', name: 'recipientName', label: 'Recipient Name', type: 'text', required: true, placeholder: 'John Doe' },
        { id: 'title', name: 'title', label: 'Certificate Title', type: 'text', required: true, placeholder: 'Certificate of Achievement' },
        { id: 'description', name: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'For outstanding performance...' },
        { id: 'issueDate', name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
        { id: 'issuingOrg', name: 'issuingOrg', label: 'Issuing Organization', type: 'text', required: true, placeholder: 'Company Name' },
        { id: 'sealStyle', name: 'sealStyle', label: 'Seal Style', type: 'select', required: false, options: ['Gold', 'Silver', 'Bronze', 'Wax', 'Holographic'] }
    ],
    contract: [
        { id: 'partyA', name: 'partyA', label: 'First Party', type: 'text', required: true, placeholder: 'Company A' },
        { id: 'partyB', name: 'partyB', label: 'Second Party', type: 'text', required: true, placeholder: 'Company B' },
        { id: 'effectiveDate', name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
        { id: 'expirationDate', name: 'expirationDate', label: 'Expiration Date', type: 'date', required: false },
        { id: 'terms', name: 'terms', label: 'Key Terms', type: 'textarea', required: true, placeholder: 'Enter contract terms...' },
        { id: 'jurisdiction', name: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: false, placeholder: 'State of California' }
    ],
    invoice: [
        { id: 'invoiceNumber', name: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true, placeholder: 'INV-001' },
        { id: 'clientName', name: 'clientName', label: 'Client Name', type: 'text', required: true, placeholder: 'Client Company' },
        { id: 'clientEmail', name: 'clientEmail', label: 'Client Email', type: 'text', required: true, placeholder: 'client@example.com' },
        { id: 'dueDate', name: 'dueDate', label: 'Due Date', type: 'date', required: true },
        { id: 'amount', name: 'amount', label: 'Total Amount', type: 'number', required: true, placeholder: '1000.00' },
        { id: 'currency', name: 'currency', label: 'Currency', type: 'select', required: true, options: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] }
    ],
    id: [
        { id: 'fullName', name: 'fullName', label: 'Full Name', type: 'text', required: true, placeholder: 'John Doe' },
        { id: 'dateOfBirth', name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
        { id: 'documentNumber', name: 'documentNumber', label: 'Document Number', type: 'text', required: true, placeholder: 'D1234567' },
        { id: 'issueDate', name: 'issueDate', label: 'Issue Date', type: 'date', required: true },
        { id: 'expiryDate', name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
        { id: 'photo', name: 'photo', label: 'Photo', type: 'file', required: false }
    ]
};

// ============== COMPONENT ==============

export const DocumentSpecialistPanel: React.FC<DocumentSpecialistPanelProps> = ({
    onDocumentGenerated,
    theme = 'light'
}) => {
    const [selectedType, setSelectedType] = useState<DocumentType>('certificate');
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedDoc, setGeneratedDoc] = useState<GeneratedDocument | null>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select type, 2: Fill form, 3: Preview

    const colors = {
        bg: theme === 'dark' ? '#111827' : '#F9FAFB',
        card: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        text: theme === 'dark' ? '#FFFFFF' : '#111827',
        textSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        border: theme === 'dark' ? '#374151' : '#E5E7EB',
        primary: '#3B82F6',
        primaryHover: '#2563EB'
    };

    const handleTypeSelect = (type: DocumentType) => {
        setSelectedType(type);
        setSelectedTemplate(null);
        setFormData({});
        setPreviewUrl(null);
        setStep(1);
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        setStep(2);
    };

    const handleFieldChange = (fieldId: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleGenerate = useCallback(async () => {
        setIsGenerating(true);

        try {
            // Simulate document generation
            await new Promise(resolve => setTimeout(resolve, 2000));

            const docId = `doc_${Date.now()}`;
            const preview = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23f0f0f0" width="400" height="300"/><text x="200" y="150" text-anchor="middle" fill="%23333">${encodeURIComponent(selectedType.toUpperCase())}</text></svg>`;

            setPreviewUrl(preview);
            setStep(3);

            const doc: GeneratedDocument = {
                id: docId,
                type: selectedType,
                previewUrl: preview,
                downloadUrl: `/api/documents/${docId}/download`,
                createdAt: new Date().toISOString()
            };

            setGeneratedDoc(doc);
            onDocumentGenerated?.(doc);

        } catch (error) {
            console.error('Generation failed:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [selectedType, selectedTemplate, formData, onDocumentGenerated]);

    const renderTypeSelection = () => (
        <div style={{ marginBottom: '32px' }}>
            <h3 style={{
                color: colors.text,
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600'
            }}>
                Select Document Type
            </h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
            }}>
                {(Object.entries(DOCUMENT_TYPES) as [DocumentType, typeof DOCUMENT_TYPES[DocumentType]][]).map(([type, config]) => (
                    <div
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        style={{
                            background: selectedType === type ? colors.primary : colors.card,
                            color: selectedType === type ? '#FFFFFF' : colors.text,
                            border: `2px solid ${selectedType === type ? colors.primary : colors.border}`,
                            borderRadius: '12px',
                            padding: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{config.icon}</div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{config.label}</div>
                        <div style={{
                            fontSize: '12px',
                            opacity: selectedType === type ? 0.9 : 0.7
                        }}>
                            {config.description}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderTemplateSelection = () => (
        <div style={{ marginBottom: '32px' }}>
            <h3 style={{
                color: colors.text,
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600'
            }}>
                Choose Template
            </h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px'
            }}>
                {TEMPLATES[selectedType].map(template => (
                    <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        style={{
                            background: selectedTemplate === template.id ? `${colors.primary}20` : colors.card,
                            border: `2px solid ${selectedTemplate === template.id ? colors.primary : colors.border}`,
                            borderRadius: '10px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{template.preview}</div>
                        <div style={{ fontWeight: '500', color: colors.text, marginBottom: '4px' }}>
                            {template.name}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                            {template.description}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderForm = () => (
        <div style={{ marginBottom: '32px' }}>
            <h3 style={{
                color: colors.text,
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600'
            }}>
                Document Details
            </h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px'
            }}>
                {DOCUMENT_FIELDS[selectedType].map(field => (
                    <div key={field.id}>
                        <label style={{
                            display: 'block',
                            color: colors.text,
                            fontSize: '13px',
                            fontWeight: '500',
                            marginBottom: '6px'
                        }}>
                            {field.label}
                            {field.required && <span style={{ color: '#EF4444' }}> *</span>}
                        </label>

                        {field.type === 'textarea' ? (
                            <textarea
                                value={formData[field.id] || ''}
                                onChange={e => handleFieldChange(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '8px',
                                    background: colors.card,
                                    color: colors.text,
                                    fontSize: '14px',
                                    minHeight: '80px',
                                    resize: 'vertical'
                                }}
                            />
                        ) : field.type === 'select' ? (
                            <select
                                value={formData[field.id] || ''}
                                onChange={e => handleFieldChange(field.id, e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '8px',
                                    background: colors.card,
                                    color: colors.text,
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">Select...</option>
                                {field.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : field.type === 'file' ? (
                            <input
                                type="file"
                                accept="image/*"
                                onChange={e => handleFieldChange(field.id, e.target.files?.[0])}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '8px',
                                    background: colors.card,
                                    color: colors.text,
                                    fontSize: '14px'
                                }}
                            />
                        ) : (
                            <input
                                type={field.type}
                                value={formData[field.id] || ''}
                                onChange={e => handleFieldChange(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: `1px solid ${colors.border}`,
                                    borderRadius: '8px',
                                    background: colors.card,
                                    color: colors.text,
                                    fontSize: '14px'
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );

    const renderPreview = () => (
        <div style={{ marginBottom: '32px' }}>
            <h3 style={{
                color: colors.text,
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600'
            }}>
                Preview
            </h3>
            <div style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
            }}>
                {previewUrl ? (
                    <>
                        <img
                            src={previewUrl}
                            alt="Document preview"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '400px',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                        />
                        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                style={{
                                    padding: '10px 24px',
                                    background: colors.primary,
                                    color: '#FFFFFF',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                📥 Download PDF
                            </button>
                            <button
                                style={{
                                    padding: '10px 24px',
                                    background: 'transparent',
                                    color: colors.primary,
                                    border: `1px solid ${colors.primary}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                📤 Share
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ color: colors.textSecondary, padding: '40px' }}>
                        Fill in the form and click "Generate" to see preview
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div style={{
            background: colors.bg,
            borderRadius: '16px',
            padding: '24px',
            minHeight: '600px'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{
                        margin: '0 0 4px 0',
                        color: colors.text,
                        fontSize: '20px',
                        fontWeight: '700'
                    }}>
                        Document Specialist
                    </h2>
                    <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>
                        Create professional documents with advanced features
                    </p>
                </div>

                {/* Progress indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {[1, 2, 3].map(s => (
                        <div
                            key={s}
                            style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: step >= s ? colors.primary : colors.border
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Content */}
            {renderTypeSelection()}
            {selectedType && renderTemplateSelection()}
            {selectedTemplate && step >= 2 && renderForm()}
            {step === 3 && renderPreview()}

            {/* Actions */}
            {selectedTemplate && step < 3 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={() => {
                            setSelectedTemplate(null);
                            setStep(1);
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
                        Back
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        style={{
                            padding: '12px 24px',
                            background: isGenerating ? colors.border : colors.primary,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: isGenerating ? 'not-allowed' : 'pointer',
                            fontWeight: '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {isGenerating ? (
                            <>⏳ Generating...</>
                        ) : (
                            <>✨ Generate Document</>
                        )}
                    </button>
                </div>
            )}

            {step === 3 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    <button
                        onClick={() => {
                            setStep(1);
                            setSelectedTemplate(null);
                            setFormData({});
                            setPreviewUrl(null);
                        }}
                        style={{
                            padding: '12px 24px',
                            background: colors.primary,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        ➕ Create Another
                    </button>
                </div>
            )}
        </div>
    );
};

export default DocumentSpecialistPanel;
