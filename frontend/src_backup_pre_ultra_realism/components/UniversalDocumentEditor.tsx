
import React, { useState, useRef, useEffect } from 'react';
import { UniversalDocumentCloneEngine, ClonedDocument, EditableTemplate, DocumentType, ExportFormat } from '../engines/UniversalDocumentCloneEngine';
import { IDDocumentSpecialist } from '../specialists/IDDocumentSpecialist';
import { InvoiceDocumentSpecialist } from '../specialists/InvoiceDocumentSpecialist';
import { CertificateDocumentSpecialist } from '../specialists/CertificateDocumentSpecialist';
import { ContractDocumentSpecialist } from '../specialists/ContractDocumentSpecialist';
import { fabric } from 'fabric';

const UniversalDocumentEditor: React.FC = () => {
    const [activeDocument, setActiveDocument] = useState<ClonedDocument | null>(null);
    const [editableTemplate, setEditableTemplate] = useState<EditableTemplate | null>(null);
    const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image' | 'draw' | 'erase'>('select');
    const [microDetailLevel, setMicroDetailLevel] = useState<'low' | 'medium' | 'high' | 'ultra'>('ultra');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    // Engines - Initialized lazily
    const cloneEngine = useRef<UniversalDocumentCloneEngine | null>(null);
    const idSpecialist = useRef<IDDocumentSpecialist | null>(null);
    const invoiceSpecialist = useRef<InvoiceDocumentSpecialist | null>(null);
    const certSpecialist = useRef<CertificateDocumentSpecialist | null>(null);
    const contractSpecialist = useRef<ContractDocumentSpecialist | null>(null);

    // Initialize engines once
    if (!cloneEngine.current) {
        cloneEngine.current = new UniversalDocumentCloneEngine();
        idSpecialist.current = new IDDocumentSpecialist();
        invoiceSpecialist.current = new InvoiceDocumentSpecialist();
        certSpecialist.current = new CertificateDocumentSpecialist();
        contractSpecialist.current = new ContractDocumentSpecialist();
    }

    // Initialize fabric canvas
    useEffect(() => {
        if (canvasRef.current && editableTemplate && !fabricCanvasRef.current) {
            fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
                width: 800, // Fixed size for UI, scale logic would be added for real app
                height: 1000
            });

            // Load template data
            // In real app: fabricCanvasRef.current.loadFromJSON(editableTemplate.fabricCanvas.toJSON(), ...)

            // Enable micro-detail editing (mock)
            if (cloneEngine.current) {
                cloneEngine.current.enableMicroDetailEditing(
                    fabricCanvasRef.current,
                    editableTemplate.microDetails
                );
            }
        }

        // Cleanup
        return () => {
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
        };
    }, [editableTemplate]);

    // Handle document upload
    const handleDocumentUpload = async (files: FileList) => {
        const file = files[0];
        if (!file) return;

        setActiveDocument(null);
        setEditableTemplate(null);

        try {
            if (!cloneEngine.current) return;
            const clonedDocument = await cloneEngine.current.cloneDocument(file, {
                microDetailLevel,
                preserveSecurityFeatures: true,
                extractAllData: true
            });

            setActiveDocument(clonedDocument);

            // Create editable template
            const template = cloneEngine.current.createEditableTemplate(clonedDocument);
            setEditableTemplate(template);

        } catch (error) {
            console.error('Document cloning failed:', error);
            alert('Failed to clone document. Please try again.');
        }
    };

    // Export document
    const handleExport = async (format: ExportFormat) => {
        if (!editableTemplate || !activeDocument) return;

        let exportedData: any;

        try {
            switch (activeDocument.type) {
                case 'id':
                    if (idSpecialist.current) {
                        exportedData = await idSpecialist.current.exportID(
                            activeDocument.extractedData,
                            activeDocument.template as any,
                            format
                        );
                    }
                    break;
                case 'invoice':
                    if (invoiceSpecialist.current) {
                        exportedData = await invoiceSpecialist.current.exportInvoice(
                            activeDocument.extractedData,
                            activeDocument.template as any,
                            format
                        );
                    }
                    break;
                case 'certificate':
                    if (certSpecialist.current) {
                        exportedData = await certSpecialist.current.exportCertificate(
                            activeDocument.extractedData,
                            activeDocument.template as any,
                            format
                        );
                    }
                    break;
                case 'contract':
                    if (contractSpecialist.current) {
                        exportedData = await contractSpecialist.current.exportContract(
                            activeDocument.extractedData,
                            activeDocument.template as any,
                            format
                        );
                    }
                    break;
                default:
                    if (cloneEngine.current) {
                        exportedData = await cloneEngine.current.exportWithMicroDetails(
                            editableTemplate,
                            format
                        );
                    }
            }

            // If exportedData is not set (e.g., specialist was null), prevent further execution
            if (!exportedData) {
                console.warn('Exported data is undefined. Specialist might not be initialized or document type not handled.');
                alert('Export failed: Specialist not ready or document type not supported for direct export.');
                return;
            }

            // Download file
            const url = URL.createObjectURL(exportedData.data);
            const a = document.createElement('a');
            a.href = url;
            a.download = exportedData.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export Failed", e);
            alert("Export failed: " + e);
        }
    };

    return (
        <div className="universal-document-editor" style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
            <div className="editor-header" style={{ padding: '1rem', background: '#333', color: 'white' }}>
                <h1>Ultra-Detail Document Cloner</h1>
            </div>

            <div className="editor-container" style={{ display: 'flex', flex: 1 }}>
                {/* Sidebar */}
                <div className="editor-sidebar" style={{ width: '250px', background: '#f5f5f5', padding: '1rem' }}>
                    <div className="upload-section">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*,.pdf"
                            onChange={(e) => e.target.files && handleDocumentUpload(e.target.files)}
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
                        >
                            Upload Document
                        </button>
                    </div>

                    {activeDocument && (
                        <div className="document-info">
                            <h3>{activeDocument.type.toUpperCase()}</h3>
                            <div className="micro-controls">
                                <h4>Detail Level: {microDetailLevel}</h4>
                                {['low', 'medium', 'high', 'ultra'].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setMicroDetailLevel(level as any)}
                                        style={{ margin: '2px' }}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>

                            <div className="export-section" style={{ marginTop: '2rem' }}>
                                <h4>Export</h4>
                                {activeDocument.exportFormats.map(fmt => (
                                    <button
                                        key={fmt}
                                        onClick={() => handleExport(fmt)}
                                        style={{ margin: '2px', width: '45%' }}
                                    >
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Canvas Area */}
                <div className="editor-main" style={{ flex: 1, padding: '2rem', background: '#ccc', overflow: 'auto' }}>
                    {activeDocument ? (
                        <div style={{ background: 'white', display: 'inline-block', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
                            <canvas ref={canvasRef} />
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                            <h2>No Document Loaded</h2>
                            <p>Please upload a document to begin editing.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UniversalDocumentEditor;
