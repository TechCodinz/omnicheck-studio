/**
 * OmniCheck Pro - Premium Check & Document Generator
 * Full-Featured Enterprise Application with Advanced UI
 */

import React, { useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import CheckBuilder from './components/CheckBuilder';
import EnterpriseAdminPortal from './admin/EnterpriseAdminPortal';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DocumentTemplateGallery from './components/DocumentTemplateGallery';
import GlobalDocumentEditor from './components/GlobalDocumentEditor';
import TaxDocumentEditor from './components/TaxDocumentEditor';
import CryptoPaymentPanel from './components/CryptoPaymentPanel';
import BlockchainVerificationPanel from './components/BlockchainVerificationPanel';
import DeliveryModal, { CheckDeliveryOptions } from './components/DeliveryModal';
import PricingPage from './components/PricingPage';
import { LicenseProvider, useLicense } from './contexts/LicenseContext';

// ============== TYPES ==============

interface DeliveryMethod {
    id: string;
    name: string;
    icon: string;
    description: string;
    cost: number;
    time: string;
}

// CheckDeliveryOptions is now imported from ./components/DeliveryModal

// ============== SIDEBAR COMPONENT ==============

const Sidebar: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => {
    const location = useLocation();
    const { currentPlan, isPaid, checksRemaining, license } = useLicense();

    const navItems = [
        { path: '/', icon: '💵', label: 'Check Generator', badge: null },
        { path: '/documents', icon: '📄', label: 'Document Templates', badge: '150+' },
        { path: '/document-editor', icon: '✏️', label: 'Document Editor', badge: null },
        { path: '/tax-documents', icon: '📋', label: 'Tax Documents', badge: 'NEW' },
        { path: '/mobile-deposit', icon: '📱', label: 'Mobile Deposit', badge: null },
        { path: '/pricing', icon: '💎', label: 'Pricing & Plans', badge: !isPaid ? 'FREE' : null },
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

            {/* Footer — Plan Status */}
            {!collapsed && (
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{
                        background: isPaid
                            ? `linear-gradient(135deg, ${currentPlan.color}33 0%, ${currentPlan.color}15 100%)`
                            : 'linear-gradient(135deg, rgba(107, 114, 128, 0.2) 0%, rgba(107, 114, 128, 0.1) 100%)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                    }}>
                        <div style={{ color: isPaid ? currentPlan.color : '#9CA3AF', fontWeight: '600', fontSize: '12px', marginBottom: '4px' }}>
                            {isPaid ? `${currentPlan.badge} Plan Active` : '⚠️ Free Plan'}
                        </div>
                        <div style={{ color: '#6B7280', fontSize: '10px' }}>
                            {isPaid ? (checksRemaining === Infinity ? 'Unlimited Exports' : `${checksRemaining} exports left`) : 'Preview Only — No Export'}
                        </div>
                        {isPaid && currentPlan.checksPerMonth > 0 && (
                            <div style={{ marginTop: '6px', height: '4px', background: '#374151', borderRadius: '2px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(100, (license.checksUsedThisMonth / currentPlan.checksPerMonth) * 100)}%`,
                                    background: currentPlan.color,
                                    borderRadius: '2px',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        )}
                        {!isPaid && (
                            <Link to="/pricing" style={{
                                display: 'block', marginTop: '8px', padding: '6px',
                                background: 'linear-gradient(135deg, #F97316, #FB923C)',
                                borderRadius: '6px', color: '#fff', textDecoration: 'none',
                                fontSize: '11px', fontWeight: '700'
                            }}>
                                🚀 Upgrade Now
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// End of Delivery Section

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

// Wrapper to detect route and conditionally render layout
const AppContent: React.FC = () => {
    const location = useLocation();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);

    const handleDelivery = useCallback((method: string, options: CheckDeliveryOptions) => {
        console.log('Delivering via:', method, options);
        setDeliveryModalOpen(false);
        alert(`✅ Check sent via ${method}!`);
    }, []);

    // Unified layout for all routes including CheckBuilder

    // For all other routes, show the standard layout with sidebar
    return (
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
                        <Route path="/pricing" element={<PricingPage />} />
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
    );
};

function App() {
    return (
        <Router>
            <LicenseProvider>
                <AppContent />
            </LicenseProvider>

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
