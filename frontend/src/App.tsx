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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthModal from './components/AuthModal';
import MobileDepositCapture from './components/MobileDepositCapture';
import MerchantInvoicingEngine from './components/MerchantInvoicingEngine';


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
    const { isAdmin } = useAuth();

    const navItems = [
        { path: '/', icon: '💵', label: 'Check Generator', badge: null },
        { path: '/documents', icon: '📄', label: 'Document Templates', badge: '150+' },
        { path: '/document-editor', icon: '✏️', label: 'Document Editor', badge: null },
        { path: '/tax-documents', icon: '📋', label: 'Tax Documents', badge: 'NEW' },
        { path: '/mobile-deposit', icon: '📱', label: 'Mobile Deposit', badge: null },
        { path: '/invoicing', icon: '🧾', label: 'Merchant Invoicing', badge: 'PAY' },
        { path: '/pricing', icon: '💎', label: 'Pricing & Plans', badge: !isPaid ? 'FREE' : null },
        { path: '/payments', icon: '💳', label: 'Crypto Payments', badge: null },
        { path: '/blockchain', icon: '⛓️', label: 'Blockchain Verify', badge: null },
        { path: '/analytics', icon: '📊', label: 'Analytics', badge: null },
        { path: '/admin', icon: '⚙️', label: 'Admin Portal', badge: isAdmin ? 'ADMIN' : null },
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



// ============== MAIN APP ==============

// Wrapper to detect route and conditionally render layout
const AppContent: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
    const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();

    const handleDelivery = useCallback((method: string, options: CheckDeliveryOptions) => {
        console.log('Delivering via:', method, options);
        setDeliveryModalOpen(false);
        alert(`✅ Check sent via ${method}!`);
    }, []);

    const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

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
                    background: 'rgba(13, 17, 23, 0.82)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    padding: '12px 28px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="🔍 Search checks, templates, payees..."
                                style={{
                                    width: '320px',
                                    padding: '10px 42px 10px 16px',
                                    background: '#151b24',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '10px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                right: '10px',
                                top: '8px',
                                fontSize: '10px',
                                color: '#6B7280',
                                background: 'rgba(255, 255, 255, 0.06)',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                                ⌘K
                            </span>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#34D399',
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            padding: '4px 10px',
                            borderRadius: '16px'
                        }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                            API Online • 14ms
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <button onClick={() => setDeliveryModalOpen(true)} style={{
                            padding: '9px 18px',
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            border: 'none',
                            borderRadius: '9px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                            transition: 'all 0.2s ease'
                        }}>
                            📤 Send Check
                        </button>

                        <div style={{ position: 'relative' }}>
                            <button style={{
                                width: '38px',
                                height: '38px',
                                background: '#151b24',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '9px',
                                color: '#9CA3AF',
                                cursor: 'pointer',
                                fontSize: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                🔔
                            </button>
                            <span style={{
                                position: 'absolute',
                                top: '-2px',
                                right: '-2px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#F97316'
                            }} />
                        </div>

                        {isAuthenticated && user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1F2937', padding: '4px 12px 4px 6px', borderRadius: '24px', border: '1px solid #374151' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    background: isAdmin ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: '700',
                                    fontSize: '13px'
                                }}>
                                    {userInitial}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                    <span style={{ color: '#F3F4F6', fontSize: '12px', fontWeight: 600, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.email}
                                    </span>
                                    <span style={{ color: isAdmin ? '#A78BFA' : '#9CA3AF', fontSize: '10px', fontWeight: 600 }}>
                                        {isAdmin ? 'ADMINISTRATOR' : 'USER'}
                                    </span>
                                </div>
                                <button
                                    onClick={logout}
                                    title="Sign Out"
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#9CA3AF',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        padding: '4px 8px',
                                        marginLeft: '4px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => openAuthModal('login')}
                                style={{
                                    padding: '9px 16px',
                                    background: '#374151',
                                    border: '1px solid #4B5563',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                🔑 Sign In
                            </button>
                        )}
                    </div>
                </header>

                {/* Page Routes */}
                <main>
                    <Routes>
                        <Route path="/" element={<CheckBuilder />} />
                        <Route path="/documents" element={<DocumentTemplateGallery />} />
                        <Route path="/document-editor" element={<GlobalDocumentEditor />} />
                        <Route path="/tax-documents" element={<TaxDocumentEditor />} />
                        <Route path="/mobile-deposit" element={<MobileDepositCapture />} />
                        <Route path="/invoicing" element={<MerchantInvoicingEngine />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/payments" element={<CryptoPaymentPanel amountUSD={100} orderId="demo-order" />} />
                        <Route path="/blockchain" element={<BlockchainVerificationPanel checkId="demo-check-123" checkData={{ checkNumber: '0001', payeeName: 'Demo User', amount: 1000, date: new Date().toISOString() }} />} />
                        <Route path="/analytics" element={<AnalyticsDashboard userId="demo-user" />} />
                        <Route path="/admin" element={<EnterpriseAdminPortal />} />
                    </Routes>
                </main>
            </div>

            {/* Modals */}
            <DeliveryModal
                isOpen={deliveryModalOpen}
                onClose={() => setDeliveryModalOpen(false)}
                onDeliver={handleDelivery}
            />
            <AuthModal />
        </div>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <LicenseProvider>
                    <AppContent />
                </LicenseProvider>
            </AuthProvider>

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
