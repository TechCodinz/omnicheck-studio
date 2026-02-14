import React, { useState, useRef, useEffect } from 'react';
import {
    CustomizationEngine,
    CustomizationSet,
    LogoPosition,
    LogoAsset,
    CheckData
} from '../engines/CustomizationEngine';
import { BorderlineEngine, BorderConfig, BorderStyle } from './BorderlineEngine';
import {
    MultiChannelDeliveryEngine,
    DeliveryMethod
} from '../engines/DeliveryEngine';
import { ChimePrepaidSpecialist } from '../specialists/ChimePrepaidSpecialist';

type OptimizationType = 'universal' | 'chime' | 'mobile' | 'print' | 'archive';

interface UltimateCustomizationPanelProps {
    checkData?: CheckData;
    onUpdate?: (data: CheckData) => void;
    onDelivery?: (method: DeliveryMethod) => void;
}

const UltimateCustomizationPanel: React.FC<UltimateCustomizationPanelProps> = ({ checkData, onUpdate, onDelivery }) => {
    const [activeTab, setActiveTab] = useState<'logos' | 'patterns' | 'textures' | 'signatures' | 'watermarks' | 'backgrounds' | 'borders' | 'delivery'>('logos');
    const [customization, setCustomization] = useState<CustomizationSet>({
        borderConfig: {
            style: 'SOLID',
            color: '#000000',
            thickness: 2,
            cornerRadius: 0
        }
    });
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('download');
    const [optimization, setOptimization] = useState<OptimizationType>('universal');
    const [currentCheck, setCurrentCheck] = useState<CheckData>(checkData || {
        id: 'sample-check',
        checkNumber: '1001',
        amount: 1000.00,
        payeeName: 'John Doe',
        date: new Date().toISOString(),
        routingNumber: '123456789',
        accountNumber: '9876543210'
    });

    useEffect(() => {
        if (checkData) {
            setCurrentCheck(checkData);
        }
    }, [checkData]);

    const logoUploadRef = useRef<HTMLInputElement>(null);
    const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const customizationEngine = new CustomizationEngine();
    const deliveryEngine = new MultiChannelDeliveryEngine();
    const chimeSpecialist = new ChimePrepaidSpecialist();

    // Handle logo upload
    const handleLogoUpload = async (files: FileList) => {
        for (let i = 0; i < files.length; i++) {
            const logo = await customizationEngine.uploadLogo(files[i], {
                removeBackground: true,
                maxWidth: 300,
                maxHeight: 150,
                category: 'business'
            });

            setCustomization(prev => ({
                ...prev,
                logo,
                logoPosition: 'top-left' as any // Explicit cast if LogoPosition type has issues
            }));
        }
    };

    // Create custom pattern
    const createPattern = async () => {
        const pattern = await customizationEngine.createPattern({
            type: 'security',
            name: 'Security Pattern',
            colors: ['#000000', '#666666'],
            seamless: true,
            opacity: 0.05,
            complexity: 'high'
        });

        setCustomization(prev => ({
            ...prev,
            pattern
        }));
    };

    // Capture handwritten signature
    const captureSignature = () => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        let isDrawing = false;
        let lastX = 0;
        let lastY = 0;

        const getCoordinates = (e: MouseEvent | TouchEvent) => {
            let x = 0, y = 0;
            if (e instanceof MouseEvent) {
                x = e.offsetX;
                y = e.offsetY;
            } else {
                // Touch event handling simplified
                const rect = canvas.getBoundingClientRect();
                x = e.touches[0].clientX - rect.left;
                y = e.touches[0].clientY - rect.top;
            }
            return { x, y };
        };

        const startDrawing = (e: MouseEvent | TouchEvent) => {
            isDrawing = true;
            const { x, y } = getCoordinates(e);
            [lastX, lastY] = [x, y];
        };

        const draw = (e: MouseEvent | TouchEvent) => {
            if (!isDrawing) return;

            // Allow default/propagation check might be needed in react but ignoring for now
            // e.preventDefault(); // Sometimes needed for touch

            const { x, y } = getCoordinates(e);

            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.stroke();

            [lastX, lastY] = [x, y];
        };

        const stopDrawing = () => {
            if (isDrawing) {
                isDrawing = false;
                // Save signature logic here
                const signatureUrl = canvas.toDataURL('image/png');
                // Process signature
                console.log('Signature captured');
            }
        };

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrawing(e);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            draw(e);
        });
        canvas.addEventListener('touchend', stopDrawing);
    };

    // Handle delivery
    const handleDelivery = async (check: CheckData) => {
        switch (deliveryMethod) {
            case 'download':
                const download = await deliveryEngine.prepareDownload({
                    ...check,
                    checkNumber: check.checkNumber || '',
                    amount: check.amount || 0,
                    payeeName: check.payeeName || '',
                    date: check.date || '',
                    routingNumber: check.routingNumber || '',
                    accountNumber: check.accountNumber || '',
                    memo: check.memo || ''
                } as any, {
                    formats: ['pdf', 'png', 'jpg', 'svg'],
                    pdfOptions: { quality: 'print', security: 'bank-grade' }
                });

                // Create download link
                const blob = new Blob([download.data as any], { type: download.type });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = download.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                break;

            case 'email':
                await deliveryEngine.deliverViaEmail({
                    ...check,
                    checkNumber: check.checkNumber || '',
                    amount: check.amount || 0,
                    payeeName: check.payeeName || '',
                    date: check.date || '',
                    routingNumber: check.routingNumber || '',
                    accountNumber: check.accountNumber || '',
                    memo: check.memo || ''
                } as any, {
                    email: 'recipient@example.com',
                    name: 'Recipient Name'
                }, {
                    includeInstructions: true,
                    includeReceipt: true
                });
                break;

            case 'print':
                await deliveryEngine.printAndMail({
                    ...check,
                    checkNumber: check.checkNumber || '',
                    amount: check.amount || 0,
                    payeeName: check.payeeName || '',
                    date: check.date || '',
                    routingNumber: check.routingNumber || '',
                    accountNumber: check.accountNumber || '',
                    memo: check.memo || ''
                } as any, {
                    name: 'Recipient Name',
                    street: '123 Main St',
                    city: 'Anytown',
                    state: 'NY',
                    zip: '10001',
                    country: 'USA'
                }, {
                    service: 'usps',
                    mailClass: 'First Class',
                    tracking: true,
                    insurance: (check.amount || 0) > 500
                });
                break;

            case 'api':
                await deliveryEngine.deliverViaAPI({
                    ...check,
                    checkNumber: check.checkNumber || '',
                    amount: check.amount || 0,
                    payeeName: check.payeeName || '',
                    date: check.date || '',
                    routingNumber: check.routingNumber || '',
                    accountNumber: check.accountNumber || '',
                    memo: check.memo || ''
                } as any, {
                    name: 'Accounting System',
                    url: 'https://api.accounting.com/checks',
                    apiKey: 'your-api-key'
                });
                break;
        }
    };

    // Optimize for specific bank
    const optimizeForBank = (bankCode: string) => {
        switch (bankCode) {
            case 'CHIME':
                setOptimization('chime');
                break;
            case 'MOBILE':
                setOptimization('mobile');
                break;
            case 'PRINT':
                setOptimization('print');
                break;
            default:
                setOptimization('universal');
        }
    };

    // Mock methods for UI interactions to avoid TS errors
    const setLogoPosition = (pos: string) => {
        setCustomization(prev => ({ ...prev, logoPosition: pos as any }));
    };

    return (
        <div className="ultimate-customization-panel">
            {/* Tab Navigation */}
            <div className="customization-tabs">
                <button
                    className={activeTab === 'logos' ? 'active' : ''}
                    onClick={() => setActiveTab('logos')}
                >
                    🏢 Logos
                </button>
                <button
                    className={activeTab === 'patterns' ? 'active' : ''}
                    onClick={() => setActiveTab('patterns')}
                >
                    🎨 Patterns
                </button>
                <button
                    className={activeTab === 'textures' ? 'active' : ''}
                    onClick={() => setActiveTab('textures')}
                >
                    📜 Textures
                </button>
                <button
                    className={activeTab === 'signatures' ? 'active' : ''}
                    onClick={() => setActiveTab('signatures')}
                >
                    ✍️ Signatures
                </button>
                <button
                    className={activeTab === 'watermarks' ? 'active' : ''}
                    onClick={() => setActiveTab('watermarks')}
                >
                    🔒 Watermarks
                </button>
                <button
                    className={activeTab === 'backgrounds' ? 'active' : ''}
                    onClick={() => setActiveTab('backgrounds')}
                >
                    🖼️ Backgrounds
                </button>
                <button
                    className={activeTab === 'borders' ? 'active' : ''}
                    onClick={() => setActiveTab('borders')}
                >
                    🖼️ Borders
                </button>
                <button
                    className={activeTab === 'delivery' ? 'active' : ''}
                    onClick={() => setActiveTab('delivery')}
                >
                    🚚 Delivery
                </button>
            </div>

            {/* Content Area */}
            <div className="customization-content">
                {activeTab === 'logos' && (
                    <div className="logos-panel">
                        <h3>Company Logo & Branding</h3>

                        <div className="upload-area" onClick={() => logoUploadRef.current?.click()}>
                            <input
                                type="file"
                                ref={logoUploadRef}
                                accept="image/*"
                                multiple
                                onChange={(e) => e.target.files && handleLogoUpload(e.target.files)}
                                hidden
                            />
                            <div className="upload-box">
                                <div className="upload-icon">📤</div>
                                <p>Drag & drop logo or click to upload</p>
                                <p className="upload-hint">PNG, JPG, SVG • Max 5MB • Transparent background recommended</p>
                            </div>
                        </div>

                        {/* Logo Positioning */}
                        {customization.logo && (
                            <div className="logo-positioning">
                                <h4>Position & Size</h4>
                                <div className="position-grid">
                                    {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                        <button
                                            key={pos}
                                            className={customization.logoPosition === pos ? 'active' : ''}
                                            onClick={() => setLogoPosition(pos)}
                                        >
                                            {pos.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>

                                <div className="logo-size">
                                    <h4>Size</h4>
                                    <input
                                        type="range"
                                        min="50"
                                        max="300"
                                        defaultValue="150"
                                        onChange={(e) => {
                                            // Resize logo logic would go here
                                        }}
                                    />
                                </div>

                                <div className="logo-effects">
                                    <h4>Effects</h4>
                                    <div className="effect-options">
                                        <label>
                                            <input type="checkbox" /> Grayscale
                                        </label>
                                        <label>
                                            <input type="checkbox" /> Shadow
                                        </label>
                                        <label>
                                            <input type="checkbox" /> Emboss
                                        </label>
                                        <label>
                                            <input type="checkbox" /> Opacity
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ... Other tabs ... */}
                {activeTab === 'borders' && (
                    <div className="borders-panel">
                        <h3>Borderline Choice Engine</h3>

                        <div className="border-styles-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                            {(['NONE', 'SOLID', 'DOUBLE', 'DOTTED', 'BRAIDED', 'SCALLOPED', 'ORNATE', 'MICROPRINT', 'ART_DECO', 'GUILLOCHE', 'TREASURY', 'COMMERCIAL', 'FILIGREE'] as BorderStyle[]).map(style => (
                                <button
                                    key={style}
                                    className={customization.borderConfig?.style === style ? 'active' : ''}
                                    onClick={() => {
                                        const newConfig = { ...customization.borderConfig!, style };
                                        setCustomization(prev => ({
                                            ...prev,
                                            borderConfig: newConfig
                                        }));
                                        onUpdate?.({ ...currentCheck, borderConfig: newConfig });
                                    }}
                                    style={{
                                        padding: '8px',
                                        border: customization.borderConfig?.style === style ? '2px solid #3B82F6' : '1px solid #ddd',
                                        background: customization.borderConfig?.style === style ? '#eff6ff' : 'white',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        minWidth: '100px'
                                    }}
                                >
                                    <svg width="40" height="20" viewBox="0 0 40 20">
                                        <BorderlineEngine width={40} height={20} config={{ ...(customization.borderConfig || {}), style, thickness: 1, color: '#333' } as any} />
                                    </svg>
                                    <span style={{ fontSize: '10px', fontWeight: '600' }}>{style.replace('_', ' ')}</span>
                                </button>
                            ))}
                        </div>

                        <div className="border-controls">
                            <div className="control-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Border Color</label>
                                <input
                                    type="color"
                                    value={customization.borderConfig?.color || '#000000'}
                                    onChange={(e) => {
                                        const newConfig = { ...customization.borderConfig!, color: e.target.value };
                                        setCustomization(prev => ({
                                            ...prev,
                                            borderConfig: newConfig
                                        }));
                                        onUpdate?.({ ...currentCheck, borderConfig: newConfig });
                                    }}
                                />
                            </div>

                            <div className="control-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Thickness: {customization.borderConfig?.thickness}px</label>
                                <input
                                    type="range" min="1" max="10" step="1"
                                    value={customization.borderConfig?.thickness || 2}
                                    onChange={(e) => {
                                        const newConfig = { ...customization.borderConfig!, thickness: parseInt(e.target.value) };
                                        setCustomization(prev => ({
                                            ...prev,
                                            borderConfig: newConfig
                                        }));
                                        onUpdate?.({ ...currentCheck, borderConfig: newConfig });
                                    }}
                                />
                            </div>

                            <div className="control-group">
                                <label style={{ display: 'block', marginBottom: '5px' }}>Corner Radius: {customization.borderConfig?.cornerRadius}px</label>
                                <input
                                    type="range" min="0" max="50" step="1"
                                    value={customization.borderConfig?.cornerRadius || 0}
                                    onChange={(e) => {
                                        const newConfig = { ...customization.borderConfig!, cornerRadius: parseInt(e.target.value) };
                                        setCustomization(prev => ({
                                            ...prev,
                                            borderConfig: newConfig
                                        }));
                                        onUpdate?.({ ...currentCheck, borderConfig: newConfig });
                                    }}
                                />
                            </div>
                        </div>

                        {/* Live Sample Preview */}
                        <div className="border-sample" style={{ marginTop: '20px', border: '1px solid #eee', padding: '20px', display: 'flex', justifyContent: 'center' }}>
                            <svg width="200" height="120" viewBox="0 0 200 120">
                                <BorderlineEngine width={200} height={120} config={customization.borderConfig!} />
                                <text x="100" y="65" textAnchor="middle" fontSize="12" fill="#666">Preview Sample</text>
                            </svg>
                        </div>
                    </div>
                )}
                {activeTab === 'patterns' && (
                    <div className="patterns-panel">
                        <h3>Patterns</h3>
                        <button onClick={createPattern}>Create Security Pattern</button>
                    </div>
                )}

                {activeTab === 'signatures' && (
                    <div className="signatures-panel">
                        <h3>Signatures</h3>
                        <canvas
                            ref={signatureCanvasRef}
                            width={400}
                            height={200}
                            style={{ border: '1px solid black' }}
                        />
                        <button onClick={captureSignature}>Capture</button>
                    </div>
                )}

                {activeTab === 'delivery' && (
                    <div className="delivery-panel">
                        <h3>Delivery & Distribution</h3>

                        <div className="delivery-methods">
                            <h4>Choose Delivery Method</h4>
                            <div className="method-grid">
                                {['download', 'email', 'print', 'api'].map(method => (
                                    <div
                                        key={method}
                                        className={`method-card ${deliveryMethod === method ? 'selected' : ''}`}
                                        onClick={() => setDeliveryMethod(method as DeliveryMethod)}
                                    >
                                        <div className="method-icon">{method === 'download' ? '💾' : method === 'email' ? '📧' : method === 'print' ? '🖨️' : '🔌'}</div>
                                        <h5>{method.charAt(0).toUpperCase() + method.slice(1)}</h5>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bank Optimization */}
                        <div className="bank-optimization">
                            <h4>Optimize For</h4>
                            <div className="bank-buttons">
                                {['universal', 'chime', 'mobile', 'print', 'archive'].map(opt => (
                                    <button
                                        key={opt}
                                        className={optimization === opt ? 'active' : ''}
                                        onClick={() => optimizeForBank(opt.toUpperCase())}
                                    >
                                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                    </button>
                                ))}
                            </div>

                            {/* Chime Specific Settings */}
                            {optimization === 'chime' && (
                                <div className="chime-settings">
                                    <h5>Chime Mobile Deposit Settings</h5>
                                    <div className="settings-grid">
                                        <label>
                                            <input type="checkbox" defaultChecked /> Add corner markers
                                        </label>
                                        <label>
                                            <input type="checkbox" defaultChecked /> Enhance contrast
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Delivery Action */}
                        <div className="delivery-action">
                            <button className="deliver-button" onClick={() => handleDelivery(currentCheck)}>
                                {deliveryMethod === 'download' && '💾 Download Check'}
                                {deliveryMethod === 'email' && '📧 Send via Email'}
                                {deliveryMethod === 'print' && '🖨️ Print & Mail'}
                                {deliveryMethod === 'api' && '🔌 Send via API'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UltimateCustomizationPanel;
