/**
 * OmniCheck Studio — Professional Check & Document Designer
 * Modern responsive layout with Tailwind CSS design system
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome, FiFileText, FiEdit3, FiClipboard, FiSmartphone,
  FiCreditCard, FiDollarSign, FiLink, FiBarChart2, FiSettings,
  FiMenu, FiX, FiSearch, FiBell, FiSend, FiLogOut, FiUser,
  FiChevronLeft, FiChevronRight, FiShield
} from 'react-icons/fi';
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

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | null;
  badgeColor?: string;
}

const MOBILE_BREAKPOINT = 1024;
const TABLET_BREAKPOINT = 768;

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: typeof window !== 'undefined' ? window.innerWidth < TABLET_BREAKPOINT : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= TABLET_BREAKPOINT && window.innerWidth < MOBILE_BREAKPOINT : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= MOBILE_BREAKPOINT : true,
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setState({
        isMobile: w < TABLET_BREAKPOINT,
        isTablet: w >= TABLET_BREAKPOINT && w < MOBILE_BREAKPOINT,
        isDesktop: w >= MOBILE_BREAKPOINT,
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return state;
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobile?: boolean;
  open?: boolean;
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobile = false, open = true, onNavigate }) => {
  const effCollapsed = mobile ? false : collapsed;
  const location = useLocation();
  const { currentPlan, isPaid, checksRemaining, license } = useLicense();
  const { isAdmin } = useAuth();

  const navItems: NavItem[] = [
    { path: '/', icon: <FiHome size={18} />, label: 'Check Generator' },
    { path: '/documents', icon: <FiFileText size={18} />, label: 'Templates', badge: '150+', badgeColor: 'bg-primary-500/20 text-primary-400' },
    { path: '/document-editor', icon: <FiEdit3 size={18} />, label: 'Document Editor' },
    { path: '/tax-documents', icon: <FiClipboard size={18} />, label: 'Tax Documents', badge: 'NEW', badgeColor: 'bg-success-500/20 text-success-400' },
    { path: '/mobile-deposit', icon: <FiSmartphone size={18} />, label: 'Mobile Deposit' },
    { path: '/invoicing', icon: <FiCreditCard size={18} />, label: 'Invoicing', badge: 'PAY', badgeColor: 'bg-warning-500/20 text-warning-400' },
    { path: '/pricing', icon: <FiDollarSign size={18} />, label: 'Pricing', badge: !isPaid ? 'FREE' : null, badgeColor: 'bg-surface-500/50 text-surface-300' },
    { path: '/payments', icon: <FiCreditCard size={18} />, label: 'Payments' },
    { path: '/blockchain', icon: <FiLink size={18} />, label: 'Blockchain' },
    { path: '/analytics', icon: <FiBarChart2 size={18} />, label: 'Analytics' },
    { path: '/admin', icon: <FiSettings size={18} />, label: 'Admin', badge: isAdmin ? 'ADMIN' : null, badgeColor: 'bg-purple-500/20 text-purple-400' },
  ];

  const sidebarClasses = mobile
    ? `fixed inset-y-0 left-0 z-[200] w-64 bg-surface-900 border-r border-white/10 transform transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`
    : `fixed inset-y-0 left-0 z-[100] bg-surface-900 border-r border-white/10 transition-all duration-300 ease-out ${effCollapsed ? 'w-16' : 'w-56'}`;

  return (
    <aside className={sidebarClasses}>
      <div className={`flex items-center gap-3 border-b border-white/10 ${effCollapsed ? 'px-3 py-4' : 'px-4 py-5'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg shadow-lg shadow-primary-500/25 flex-shrink-0">
          <FiShield size={20} />
        </div>
        {!effCollapsed && (
          <div className="min-w-0">
            <div className="text-white font-bold text-sm tracking-tight">OmniCheck</div>
            <div className="text-surface-500 text-[10px] font-medium uppercase tracking-wider">Studio</div>
          </div>
        )}
      </div>

      {!mobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-surface-600 border-2 border-surface-900 text-white flex items-center justify-center text-[10px] hover:bg-primary-500 transition-colors z-10"
          aria-label={effCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {effCollapsed ? <FiChevronRight size={12} /> : <FiChevronLeft size={12} />}
        </button>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                ${isActive ? 'bg-primary-500/15 text-primary-400' : 'text-surface-400 hover:text-white hover:bg-white/5'}
                ${effCollapsed ? 'justify-center' : ''}
              `}
              title={effCollapsed ? item.label : undefined}
            >
              <span className={`flex-shrink-0 ${isActive ? 'text-primary-400' : 'text-surface-500 group-hover:text-white'} transition-colors`}>
                {item.icon}
              </span>
              {!effCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.badgeColor || 'bg-surface-600 text-surface-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {!effCollapsed && (
        <div className="p-3 border-t border-white/10">
          <div className={`rounded-xl p-3 ${isPaid ? 'bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20' : 'bg-surface-800/50 border border-white/5'}`}>
            <div className={`text-xs font-semibold mb-1 ${isPaid ? 'text-primary-400' : 'text-surface-400'}`}>
              {isPaid ? `${currentPlan.badge} Plan` : 'Free Plan'}
            </div>
            <div className="text-[10px] text-surface-500">
              {isPaid ? (checksRemaining === Infinity ? 'Unlimited exports' : `${checksRemaining} exports left`) : 'Preview only'}
            </div>
            {isPaid && currentPlan.checksPerMonth > 0 && (
              <div className="mt-2 h-1 bg-surface-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (license.checksUsedThisMonth / currentPlan.checksPerMonth) * 100)}%` }} />
              </div>
            )}
            {!isPaid && (
              <Link to="/pricing" className="mt-2 block text-center text-[11px] font-bold py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/25 transition-all">
                Upgrade
              </Link>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { path: '/', icon: <FiHome size={20} />, label: 'Home' },
    { path: '/documents', icon: <FiFileText size={20} />, label: 'Templates' },
    { path: '/document-editor', icon: <FiEdit3 size={20} />, label: 'Editor' },
    { path: '/pricing', icon: <FiDollarSign size={20} />, label: 'Pricing' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[150] bg-surface-900/95 backdrop-blur-xl border-t border-white/10">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${isActive ? 'text-primary-400' : 'text-surface-500'}`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

interface TopBarProps {
  onMenuClick: () => void;
  onDeliveryClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, onDeliveryClick }) => {
  const { isMobile } = useResponsive();
  const { user, isAuthenticated, isAdmin, logout, openAuthModal } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-50 bg-surface-900/80 backdrop-blur-xl border-b border-white/[0.08]">
      <div className={`flex items-center justify-between ${isMobile ? 'px-3 py-2.5 gap-3' : 'px-6 py-3 gap-4'}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isMobile && (
            <button onClick={onMenuClick} className="w-10 h-10 rounded-xl bg-surface-800 border border-white/10 text-white flex items-center justify-center hover:bg-surface-700 transition-colors flex-shrink-0" aria-label="Open menu">
              <FiMenu size={20} />
            </button>
          )}

          <div className={`relative flex-1 min-w-0 ${isMobile ? 'max-w-none' : 'max-w-md'}`}>
            <FiSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${searchFocused ? 'text-primary-400' : 'text-surface-500'}`} size={16} />
            <input
              type="text"
              placeholder="Search checks, templates, payees..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-10 pr-10 py-2.5 bg-surface-800 border border-white/10 rounded-xl text-sm text-white placeholder-surface-500 focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-surface-500 bg-surface-700/50 px-1.5 py-0.5 rounded border border-white/5 hidden sm:block">
              ⌘K
            </kbd>
          </div>

          {!isMobile && (
            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-success-400 bg-success-500/10 border border-success-500/20 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
              API Online
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button onClick={onDeliveryClick} className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg hover:shadow-primary-500/25 transition-all active:scale-95">
            <FiSend size={16} />
            <span className="hidden md:inline">Send Check</span>
          </button>

          <button className="relative w-10 h-10 rounded-xl bg-surface-800 border border-white/10 text-surface-400 flex items-center justify-center hover:text-white hover:bg-surface-700 transition-all">
            <FiBell size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary-500 border-2 border-surface-900" />
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 bg-surface-800 border border-white/10 rounded-full pl-1 pr-3 py-1 hover:border-white/20 transition-all">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isAdmin ? 'bg-gradient-to-br from-purple-500 to-purple-700' : 'bg-gradient-to-br from-primary-500 to-primary-700'}`}>
                  {userInitial}
                </div>
                {!isMobile && (
                  <div className="text-left hidden sm:block">
                    <div className="text-white text-xs font-semibold max-w-[100px] truncate">{user.email}</div>
                    <div className={`text-[10px] font-bold uppercase ${isAdmin ? 'text-purple-400' : 'text-surface-500'}`}>{isAdmin ? 'Admin' : 'User'}</div>
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-800 border border-white/10 rounded-xl shadow-xl shadow-black/50 py-2 animate-fadeIn z-50">
                  <div className="px-4 py-3 border-b border-white/5">
                    <div className="text-white text-sm font-semibold truncate">{user.email}</div>
                    <div className="text-surface-500 text-xs">{isAdmin ? 'Administrator' : 'Standard User'}</div>
                  </div>
                  <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error-400 hover:bg-error-500/10 transition-colors">
                    <FiLogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => openAuthModal('login')} className="flex items-center gap-2 px-4 py-2.5 bg-surface-700 border border-white/10 rounded-xl text-white text-sm font-semibold hover:bg-surface-600 transition-all">
              <FiUser size={16} />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const AppContent: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isMobile } = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);

  const handleDelivery = useCallback((method: string, options: CheckDeliveryOptions) => {
    console.log('Delivering via:', method, options);
    setDeliveryModalOpen(false);
  }, []);

  const sidebarWidth = isMobile ? 0 : (sidebarCollapsed ? 64 : 224);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800">
      {isMobile && drawerOpen && (
        <div onClick={() => setDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] animate-fadeIn" />
      )}

      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} mobile={isMobile} open={!isMobile || drawerOpen} onNavigate={() => setDrawerOpen(false)} />

      <div className="transition-all duration-300 ease-out" style={{ marginLeft: sidebarWidth }}>
        <TopBar onMenuClick={() => setDrawerOpen(true)} onDeliveryClick={() => setDeliveryModalOpen(true)} />

        <main className={`${isMobile ? 'pb-20 px-3 py-4' : 'px-6 py-6'} min-h-[calc(100vh-64px)]`}>
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

      {isMobile && <MobileBottomNav />}

      <DeliveryModal isOpen={deliveryModalOpen} onClose={() => setDeliveryModalOpen(false)} onDeliver={handleDelivery} />
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
    </Router>
  );
}

export default App;
