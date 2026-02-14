/**
 * OmniCheck Pro - Premium Check & Document Generator
 * Full-Featured Enterprise Application with Advanced UI
 */

import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import CheckBuilder from './components/CheckBuilder';
import EnterpriseAdminPortal from './admin/EnterpriseAdminPortal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DocumentTemplateGallery from './components/DocumentTemplateGallery';
import GlobalDocumentEditor from './components/GlobalDocumentEditor';
import TaxDocumentEditor from './components/TaxDocumentEditor';
import CryptoPaymentPanel from './components/CryptoPaymentPanel';
import BlockchainVerificationPanel from './components/BlockchainVerificationPanel';

// ============== TYPES ==============

interface DeliveryMethod {
    id: string;
    name: string;
    icon: string;
    description: string;
    cost: number;
    time: string;
}

interface CheckDeliveryOptions {
    email?: string;
    mail?: { address: string; city: string; state: string; zip: string };
    directDeposit?: { routingNumber: string; accountNumber: string };
    sms?: string;
    fax?: string;
}

// ============== SIDEBAR COMPONENT ==============

const Sidebar: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: '💵', label: 'Check Generator', badge: null },
        { path: '/documents', icon: '📄', label: 'Document Templates', badge: '150+' },
        { path: '/document-editor', icon: '✏️', label: 'Document Editor', badge: null },
        { path: '/tax-documents', icon: '📋', label: 'Tax Documents', badge: 'NEW' },
        { path: '/mobile-deposit', icon: '📱', label: 'Mobile Deposit', badge: null },
        { path: '/payments', icon: '💳', label: 'Crypto Payments', badge: null },
        { path: '/blockchain', icon: '⛓️', label: 'Blockchain Verify', badge: null },
        { path: '/analytics', icon: '📊', label: 'Analytics', badge: null },
        { path: '/admin', icon: '⚙️', label: 'Admin Portal', badge: null },
    ];

    return (
        <div style={{
            width: collapsed ? '60px' : '220px',
            background: 'linear-gradient(180deg, #1a1f2e 0%, #0d1117 100%)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s ease',
            position: 'fixed',
            left: 0,
            top: 0,
            height: '100vh',
            zIndex: 100
        }}>
            {/* Logo */}
            <div style={{
                padding: collapsed ? '16px 12px' : '20px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                }}>💰</div>
                {!collapsed && (
                    <div>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>OmniCheck Pro</div>
                        <div style={{ color: '#6B7280', fontSize: '11px' }}>Enterprise Edition</div>
                    </div>
                )}
            </div>

            {/* Toggle Button */}
            <button onClick={onToggle} style={{
                position: 'absolute',
                right: '-12px',
                top: '70px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#374151',
                border: '2px solid #1a1f2e',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px'
            }}>
                {collapsed ? '→' : '←'}
            </button>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
                {navItems.map(item => (
                    <Link key={item.path} to={item.path} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: collapsed ? '12px 16px' : '10px 12px',
                        marginBottom: '4px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        color: location.pathname === item.path ? '#F97316' : '#9CA3AF',
                        background: location.pathname === item.path ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                        transition: 'all 0.2s ease'
                    }}>
                        <span style={{ fontSize: '18px' }}>{item.icon}</span>
                        {!collapsed && (
                            <>
                                <span style={{ flex: 1, fontSize: '13px', fontWeight: location.pathname === item.path ? '600' : '400' }}>
                                    {item.label}
                                </span>
                                {item.badge && (
                                    <span style={{
                                        background: item.badge === 'NEW' ? '#10B981' : '#374151',
                                        color: '#fff',
                                        fontSize: '10px',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontWeight: '600'
                                    }}>{item.badge}</span>
                                )}
                            </>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(251, 146, 60, 0.1) 100%)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ color: '#F97316', fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>Pro License Active</div>
                        <div style={{ color: '#6B7280', fontSize: '10px' }}>Unlimited Documents</div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============== DELIVERY MODAL ==============

const DeliveryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onDeliver: (method: string, options: CheckDeliveryOptions) => void;
}> = ({ isOpen, onClose, onDeliver }) => {
    const [selectedMethod, setSelectedMethod] = useState<string>('download');
    const [email, setEmail] = useState('');
    const [mailAddress, setMailAddress] = useState({ address: '', city: '', state: '', zip: '' });
    const [depositInfo, setDepositInfo] = useState({ routingNumber: '', accountNumber: '' });
    const [phone, setPhone] = useState('');

    const deliveryMethods: DeliveryMethod[] = [
        { id: 'download', name: 'Download PDF', icon: '📥', description: 'Download to your device', cost: 0, time: 'Instant' },
        { id: 'email', name: 'Send via Email', icon: '📧', description: 'Send to any email address', cost: 0, time: 'Instant' },
        { id: 'mail', name: 'Physical Mail', icon: '📮', description: 'Print and mail to address', cost: 2.99, time: '3-5 days' },
        { id: 'priority_mail', name: 'Priority Mail', icon: '📦', description: 'Express physical delivery', cost: 8.99, time: '1-2 days' },
        { id: 'direct_deposit', name: 'Direct Deposit', icon: '🏦', description: 'ACH direct deposit', cost: 0.50, time: '1-3 days' },
        { id: 'sms', name: 'SMS Link', icon: '💬', description: 'Send download link via SMS', cost: 0.10, time: 'Instant' },
        { id: 'fax', name: 'Send via Fax', icon: '📠', description: 'Fax to recipient', cost: 0.50, time: 'Instant' },
    ];

    if (!isOpen) return null;

    const handleSubmit = () => {
        const options: CheckDeliveryOptions = {};
        if (selectedMethod === 'email') options.email = email;
        if (selectedMethod === 'mail' || selectedMethod === 'priority_mail') options.mail = mailAddress;
        if (selectedMethod === 'direct_deposit') options.directDeposit = depositInfo;
        if (selectedMethod === 'sms') options.sms = phone;
        if (selectedMethod === 'fax') options.fax = phone;
        onDeliver(selectedMethod, options);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{ background: '#1F2937', borderRadius: '16px', width: '600px', maxHeight: '80vh', overflow: 'auto' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>📤 Delivery Options</h2>
                        <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '13px' }}>Choose how to send your check or document</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

                {/* Methods Grid */}
                <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                        {deliveryMethods.map(method => (
                            <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                                style={{
                                    padding: '16px',
                                    background: selectedMethod === method.id ? 'rgba(249, 115, 22, 0.15)' : '#374151',
                                    border: selectedMethod === method.id ? '2px solid #F97316' : '2px solid transparent',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.2s ease'
                                }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '24px' }}>{method.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{method.name}</div>
                                        <div style={{ color: '#9CA3AF', fontSize: '11px' }}>{method.description}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9CA3AF', fontSize: '11px' }}>
                                    <span>⏱️ {method.time}</span>
                                    <span style={{ color: method.cost === 0 ? '#10B981' : '#F97316', fontWeight: '600' }}>
                                        {method.cost === 0 ? 'FREE' : `$${method.cost.toFixed(2)}`}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Form Fields */}
                    {selectedMethod === 'email' && (
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="recipient@email.com"
                                style={{ width: '100%', padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                        </div>
                    )}

                    {(selectedMethod === 'mail' || selectedMethod === 'priority_mail') && (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Street Address</label>
                                <input type="text" value={mailAddress.address} onChange={e => setMailAddress({ ...mailAddress, address: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                                <input type="text" placeholder="City" value={mailAddress.city} onChange={e => setMailAddress({ ...mailAddress, city: e.target.value })}
                                    style={{ padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                                <input type="text" placeholder="State" value={mailAddress.state} onChange={e => setMailAddress({ ...mailAddress, state: e.target.value })}
                                    style={{ padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                                <input type="text" placeholder="ZIP" value={mailAddress.zip} onChange={e => setMailAddress({ ...mailAddress, zip: e.target.value })}
                                    style={{ padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                            </div>
                        </div>
                    )}

                    {selectedMethod === 'direct_deposit' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Routing Number</label>
                                <input type="text" value={depositInfo.routingNumber} onChange={e => setDepositInfo({ ...depositInfo, routingNumber: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Account Number</label>
                                <input type="text" value={depositInfo.accountNumber} onChange={e => setDepositInfo({ ...depositInfo, accountNumber: e.target.value })}
                                    style={{ width: '100%', padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                            </div>
                        </div>
                    )}

                    {(selectedMethod === 'sms' || selectedMethod === 'fax') && (
                        <div>
                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Phone Number</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                                style={{ width: '100%', padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff', fontSize: '14px' }} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '20px 24px', borderTop: '1px solid #374151', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', background: '#374151', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} style={{
                        padding: '12px 24px', background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                        border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                    }}>
                        📤 Send Now
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============== MOBILE DEPOSIT PAGE ==============

const MobileDepositPage: React.FC = () => {
    const [uploadedCheck, setUploadedCheck] = useState<string | null>(null);
    const [depositStatus, setDepositStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
    const [bankInfo, setBankInfo] = useState({ bankName: '', routingNumber: '', accountNumber: '' });

    const handleCheckUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setUploadedCheck(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const processDeposit = () => {
        setDepositStatus('processing');
        setTimeout(() => {
            setDepositStatus('success');
        }, 3000);
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ color: '#fff', fontSize: '24px', marginBottom: '8px' }}>📱 Mobile Check Deposit</h1>
                <p style={{ color: '#9CA3AF', marginBottom: '24px' }}>Deposit checks instantly from your device</p>

                {/* Bank Selection */}
                <div style={{ background: '#1F2937', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '16px' }}>🏦 Select Deposit Account</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Bank Name</label>
                            <input type="text" value={bankInfo.bankName} onChange={e => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                                placeholder="Chase, Bank of America..."
                                style={{ width: '100%', padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Routing Number</label>
                            <input type="text" value={bankInfo.routingNumber} onChange={e => setBankInfo({ ...bankInfo, routingNumber: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '6px' }}>Account Number</label>
                            <input type="text" value={bankInfo.accountNumber} onChange={e => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                                style={{ width: '100%', padding: '12px', background: '#374151', border: '1px solid #4B5563', borderRadius: '8px', color: '#fff' }} />
                        </div>
                    </div>
                </div>

                {/* Check Upload */}
                <div style={{ background: '#1F2937', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                    <h3 style={{ color: '#fff', fontSize: '16px', marginBottom: '16px' }}>📸 Capture Check Images</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Front */}
                        <div>
                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '8px' }}>Check Front</label>
                            <div style={{
                                background: uploadedCheck ? `url(${uploadedCheck}) center/cover` : '#374151',
                                height: '180px',
                                borderRadius: '8px',
                                border: '2px dashed #4B5563',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative'
                            }}>
                                <input type="file" accept="image/*" capture="environment" onChange={handleCheckUpload}
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                {!uploadedCheck && (
                                    <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                                        <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                                        <div style={{ fontSize: '13px' }}>Tap to capture front</div>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Back */}
                        <div>
                            <label style={{ display: 'block', color: '#9CA3AF', fontSize: '12px', marginBottom: '8px' }}>Check Back (Endorsed)</label>
                            <div style={{
                                background: '#374151',
                                height: '180px',
                                borderRadius: '8px',
                                border: '2px dashed #4B5563',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}>
                                <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
                                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
                                    <div style={{ fontSize: '13px' }}>Tap to capture back</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Deposit Button */}
                {depositStatus === 'idle' && uploadedCheck && (
                    <button onClick={processDeposit} style={{
                        width: '100%', padding: '16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer'
                    }}>
                        💰 Deposit Check Now
                    </button>
                )}

                {depositStatus === 'processing' && (
                    <div style={{ background: '#1F2937', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 1s linear infinite' }}>⏳</div>
                        <div style={{ color: '#fff', fontSize: '18px', fontWeight: '600' }}>Processing Deposit...</div>
                        <div style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '8px' }}>Verifying check details and routing</div>
                    </div>
                )}

                {depositStatus === 'success' && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #10B981' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                        <div style={{ color: '#10B981', fontSize: '18px', fontWeight: '600' }}>Deposit Successful!</div>
                        <div style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '8px' }}>Funds will be available in 1-2 business days</div>
                        <div style={{ marginTop: '16px', color: '#fff', fontSize: '14px' }}>
                            Confirmation #: <strong>DEP-{Date.now().toString(36).toUpperCase()}</strong>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============== MAIN APP ==============

function App() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);

    const handleDelivery = useCallback((method: string, options: CheckDeliveryOptions) => {
        console.log('Delivering via:', method, options);
        setDeliveryModalOpen(false);
        alert(`✅ Check sent via ${method}!`);
    }, []);

    return (
        <Router>
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0e14 0%, #151b24 50%, #1d2430 100%)'
            }}>
                <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

                {/* Main Content Area */}
                <div style={{ marginLeft: sidebarCollapsed ? '60px' : '220px', transition: 'margin-left 0.3s ease' }}>
                    {/* Top Bar */}
                    <header style={{
                        background: 'rgba(31, 41, 55, 0.8)',
                        backdropFilter: 'blur(10px)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        padding: '12px 24px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        position: 'sticky',
                        top: 0,
                        zIndex: 50
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <input type="text" placeholder="🔍 Search documents, checks, templates..."
                                style={{
                                    width: '300px', padding: '10px 16px', background: '#374151', border: '1px solid #4B5563',
                                    borderRadius: '8px', color: '#fff', fontSize: '13px'
                                }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button onClick={() => setDeliveryModalOpen(true)} style={{
                                padding: '10px 16px', background: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                                border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                📤 Send Check
                            </button>
                            <button style={{ width: '40px', height: '40px', background: '#374151', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '16px' }}>
                                🔔
                            </button>
                            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '14px' }}>
                                JD
                            </div>
                        </div>
                    </header>

                    {/* Page Routes */}
                    <main>
                        <Routes>
                            <Route path="/" element={<CheckBuilder />} />
                            <Route path="/documents" element={<DocumentTemplateGallery />} />
                            <Route path="/document-editor" element={<GlobalDocumentEditor />} />
                            <Route path="/tax-documents" element={<TaxDocumentEditor />} />
                            <Route path="/mobile-deposit" element={<MobileDepositPage />} />
                            <Route path="/payments" element={<CryptoPaymentPanel amountUSD={100} orderId="demo-order" />} />
                            <Route path="/blockchain" element={<BlockchainVerificationPanel checkId="demo-check-123" checkData={{ checkNumber: '0001', payeeName: 'Demo User', amount: 1000, date: new Date().toISOString() }} />} />
                            <Route path="/analytics" element={<AnalyticsDashboard userId="demo-user" />} />
                            <Route path="/admin" element={<EnterpriseAdminPortal />} />
                        </Routes>
                    </main>
                </div>

                {/* Delivery Modal */}
                <DeliveryModal
                    isOpen={deliveryModalOpen}
                    onClose={() => setDeliveryModalOpen(false)}
                    onDeliver={handleDelivery}
                />
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                * { box-sizing: border-box; }
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
            `}</style>
        </Router>
    );
}

export default App;
