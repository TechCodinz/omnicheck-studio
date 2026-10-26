import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useHistorySnapshots } from '../hooks/useHistorySnapshots';
import HistoryBar from './HistoryBar';

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
}

interface Invoice {
    id: string;
    client_name: string;
    client_email: string;
    amount: number;
    currency: string;
    status: 'DRAFT' | 'SENT' | 'TRIAL_PENDING' | 'PAID' | 'SETTLED';
    items: InvoiceItem[];
    payment_method?: string;
    payout_destination?: string;
    payout_details?: any;
    trial_deposits?: {
        deposit1?: number;
        deposit2?: number;
        verified?: boolean;
        accountNumberMasked?: string;
    };
    created_at?: string;
    notes?: string;
}

export const MerchantInvoicingEngine: React.FC<{ onClose?: () => void }> = ({ onClose }: { onClose?: () => void }) => {
    const [activeTab, setActiveTab] = useState<'BUILDER' | 'CHECKOUT' | 'SETTLEMENT' | 'LEDGER'>('BUILDER');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Form state for Invoice Builder
    const [clientName, setClientName] = useState('Acme Global Logistics');
    const [clientEmail, setClientEmail] = useState('billing@acmeglobal.com');
    const [currency, setCurrency] = useState('USD');
    const [notes, setNotes] = useState('Payment due within 15 days via Card, Bank ACH, SWIFT, or Digital Tags.');
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: '1', description: 'Enterprise Check Design & Clearing Engine License', quantity: 1, rate: 1450.00 },
        { id: '2', description: 'Federal Reserve Regulation CC & X9.27 Audit Pack', quantity: 1, rate: 350.00 }
    ]);
    const [payoutDest, setPayoutDest] = useState<'RECEIVER_BANK' | 'SWIFT_INTERNATIONAL' | 'DIGITAL_TAGS'>('RECEIVER_BANK');

    // Settlement Payout configuration
    const [receiverBank, setReceiverBank] = useState({
        bankName: 'JPMorgan Chase Bank, N.A.',
        routingNumber: '021000021',
        accountNumber: '8839201948',
        accountHolder: 'OmniCheck Studio Inc.'
    });
    const [receiverSwift, setReceiverSwift] = useState({
        bic: 'CHASUS33XXX',
        iban: 'US34CHAS0210000218839201948',
        beneficiaryBank: 'JPMorgan Chase New York',
        country: 'United States'
    });
    const [receiverTags, setReceiverTags] = useState({
        paypal: 'paypal.me/omnicheck',
        zelle: 'payments@omnicheckstudio.com',
        cashapp: '$OmniCheck',
        venmo: '@OmniCheck-Studio'
    });

    // Payer Checkout State
    // --- Design history: Save / Undo / Redo (shared with the other editors) ---
    // Covers the invoice builder's own design: client, terms, line items
    // and payout routing. Payer checkout details are deliberately NOT
    // snapshotted or saved - they are the payer's data, entered per sale.
    const designHistory = useHistorySnapshots({
        storageKey: 'oc-invoice-design',
        snapshot: () => ({ clientName, clientEmail, currency, notes, items, payoutDest, receiverBank, receiverSwift, receiverTags }),
        apply: (s: any) => {
            if (!s) return;
            if ('clientName' in s) setClientName(s.clientName);
            if ('clientEmail' in s) setClientEmail(s.clientEmail);
            if ('currency' in s) setCurrency(s.currency);
            if ('notes' in s) setNotes(s.notes);
            if ('items' in s) setItems(s.items);
            if ('payoutDest' in s) setPayoutDest(s.payoutDest);
            if ('receiverBank' in s) setReceiverBank(s.receiverBank);
            if ('receiverSwift' in s) setReceiverSwift(s.receiverSwift);
            if ('receiverTags' in s) setReceiverTags(s.receiverTags);
        },
        watch: [clientName, clientEmail, currency, notes, items, payoutDest, receiverBank, receiverSwift, receiverTags]
    });

    const [checkoutMethod, setCheckoutMethod] = useState<'CARD' | 'PLAID' | 'MANUAL_ACH' | 'SWIFT' | 'DIGITAL_TAGS'>('CARD');
    const [cardData, setCardData] = useState({ number: '4242 •••• •••• 4242', exp: '12/28', cvc: '888', name: 'Authorized Officer' });
    const [manualAchData, setManualAchData] = useState({
        routingNumber: '021000021',
        accountNumber: '9948271049',
        confirmAccount: '9948271049',
        holderName: 'Corporate Operating Account'
    });
    const [swiftData, setSwiftData] = useState({
        bic: 'BOFAUS3N',
        iban: 'US89BOFA02600959311223344',
        beneficiaryBank: 'Bank of America International',
        reference: 'INV-SETTLE-GLOBAL'
    });
    const [tagData, setTagData] = useState({
        platform: 'ZELLE',
        senderHandle: '+1 (555) 234-5678',
        reference: `TAG-REF-${Math.floor(Math.random() * 899999 + 100000)}`
    });

    // Trial Deposit Verification State
    const [showTrialModal, setShowTrialModal] = useState(false);
    const [trialDep1, setTrialDep1] = useState('');
    const [trialDep2, setTrialDep2] = useState('');
    const [activeTrialHint, setActiveTrialHint] = useState<{ d1: number; d2: number; ending: string } | null>(null);

    // Initial load of sample invoices
    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        setIsLoading(true);
        try {
            const res: any = await apiClient.listInvoices();
            const invList: Invoice[] = res.invoices || res.data?.invoices || [];
            if (res.success && invList.length > 0) {
                setInvoices(invList);
                if (!selectedInvoice) setSelectedInvoice(invList[0]);
            } else {
                // Initialize default sample invoice if empty
                const initialInv: Invoice = {
                    id: 'INV-882910',
                    client_name: 'Acme Global Logistics',
                    client_email: 'billing@acmeglobal.com',
                    amount: 1800.00,
                    currency: 'USD',
                    status: 'SENT',
                    items: [
                        { id: '1', description: 'Enterprise Check Design & Clearing Engine License', quantity: 1, rate: 1450.00 },
                        { id: '2', description: 'Federal Reserve Regulation CC & X9.27 Audit Pack', quantity: 1, rate: 350.00 }
                    ],
                    payout_destination: 'RECEIVER_BANK',
                    created_at: new Date().toISOString()
                };
                setInvoices([initialInv]);
                setSelectedInvoice(initialInv);
            }
        } catch {
            // Fallback demo data
        } finally {
            setIsLoading(false);
        }
    };

    const calculateSubtotal = () => items.reduce((sum: number, item: InvoiceItem) => sum + (item.quantity * item.rate), 0);

    const handleCreateInvoice = async () => {
        setIsLoading(true);
        setStatusMessage(null);
        try {
            const payload = {
                clientName,
                clientEmail,
                amount: calculateSubtotal(),
                currency,
                items,
                payoutDestination: payoutDest,
                payoutDetails: payoutDest === 'RECEIVER_BANK' ? receiverBank : (payoutDest === 'SWIFT_INTERNATIONAL' ? receiverSwift : receiverTags),
                notes
            };

            const res: any = await apiClient.createInvoice(payload);
            if (res.success) {
                const invData = res.invoice || res.data?.invoice || {};
                const newInv: Invoice = {
                    id: invData.id || `INV-${Date.now().toString().slice(-6)}`,
                    client_name: clientName,
                    client_email: clientEmail,
                    amount: invData.amount || calculateSubtotal(),
                    currency: invData.currency || currency,
                    status: 'SENT',
                    items,
                    payout_destination: payoutDest,
                    created_at: new Date().toISOString(),
                    notes
                };
                setInvoices((prev: Invoice[]) => [newInv, ...prev]);
                setSelectedInvoice(newInv);
                setActiveTab('CHECKOUT');
                setStatusMessage({ type: 'success', text: `Invoice ${newInv.id} issued successfully. View payment simulator below.` });
            } else {
                setStatusMessage({ type: 'error', text: res.error || 'Failed to issue invoice' });
            }
        } catch (err: any) {
            setStatusMessage({ type: 'error', text: err.message || 'Error creating invoice' });
        } finally {
            setIsLoading(false);
        }
    };

    // Client Payment Handlers
    const handlePayCard = async () => {
        if (!selectedInvoice) return;
        setIsLoading(true);
        try {
            const res = await apiClient.payInvoice(selectedInvoice.id, 'CARD', {
                cardNumber: cardData.number.replace(/\D/g, '') || '4242424242424242',
                expMonth: '12',
                expYear: '2028',
                cvc: cardData.cvc
            });
            if (res.success) {
                updateLocalInvoiceStatus(selectedInvoice.id, 'PAID', 'CARD');
                setStatusMessage({ type: 'success', text: `✅ Card Payment Authorized! Transaction: ${res.transactionId}. Funds routed to merchant.` });
            } else {
                setStatusMessage({ type: 'error', text: res.error || 'Card declined' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayPlaid = async () => {
        if (!selectedInvoice) return;
        setIsLoading(true);
        try {
            const res = await apiClient.payInvoice(selectedInvoice.id, 'PLAID', {
                institutionName: 'JPMorgan Chase Private Client',
                publicToken: 'public-sandbox-plaid-token-9942',
                accountId: 'acc_plaid_8829'
            });
            if (res.success) {
                updateLocalInvoiceStatus(selectedInvoice.id, 'PAID', 'PLAID');
                setStatusMessage({ type: 'success', text: `⚡ Plaid Instant Account Link Verified! ACH Direct Debit initiated for ${selectedInvoice.id}.` });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualAchInitiate = async () => {
        if (!selectedInvoice) return;
        setIsLoading(true);
        try {
            const res = await apiClient.payInvoice(selectedInvoice.id, 'MANUAL_ACH', manualAchData);
            if (res.success) {
                updateLocalInvoiceStatus(selectedInvoice.id, 'TRIAL_PENDING', 'MANUAL_ACH');
                if (res.trialInfo) {
                    setActiveTrialHint({
                        d1: res.trialInfo.deposit1Hint,
                        d2: res.trialInfo.deposit2Hint,
                        ending: res.trialInfo.accountEnding
                    });
                }
                setShowTrialModal(true);
                setStatusMessage({ type: 'info', text: '📬 Two trial micro-deposits under $1.00 dispatched to bank account. Verify them to settle.' });
            } else {
                setStatusMessage({ type: 'error', text: res.error || 'Routing verification failed' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyTrialDeposits = async () => {
        if (!selectedInvoice) return;
        setIsLoading(true);
        try {
            const res = await apiClient.payInvoice(selectedInvoice.id, 'VERIFY_TRIAL_DEPOSITS', {
                deposit1: parseFloat(trialDep1),
                deposit2: parseFloat(trialDep2)
            });
            if (res.success) {
                setShowTrialModal(false);
                updateLocalInvoiceStatus(selectedInvoice.id, 'PAID', 'MANUAL_ACH');
                setStatusMessage({ type: 'success', text: '🎉 Micro-deposits verified! Bank account authenticated and invoice paid in full.' });
            } else {
                setStatusMessage({ type: 'error', text: res.error || 'Trial deposit amounts did not match.' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaySwift = async () => {
        if (!selectedInvoice) return;
        setIsLoading(true);
        try {
            const res = await apiClient.payInvoice(selectedInvoice.id, 'SWIFT', {
                swiftBic: swiftData.bic,
                iban: swiftData.iban,
                beneficiaryBank: swiftData.beneficiaryBank
            });
            if (res.success) {
                updateLocalInvoiceStatus(selectedInvoice.id, 'PAID', 'SWIFT');
                setStatusMessage({ type: 'success', text: `🌐 SWIFT International Wire Confirmed! Reference: ${res.transactionId}` });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayTags = async () => {
        if (!selectedInvoice) return;
        setIsLoading(true);
        try {
            const res = await apiClient.payInvoice(selectedInvoice.id, 'DIGITAL_TAGS', {
                tagPlatform: tagData.platform,
                senderHandle: tagData.senderHandle,
                referenceCode: tagData.reference
            });
            if (res.success) {
                updateLocalInvoiceStatus(selectedInvoice.id, 'PAID', `${tagData.platform}_TAG`);
                setStatusMessage({ type: 'success', text: `📱 Payment Confirmed via ${tagData.platform}! Handle: ${tagData.senderHandle}` });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateLocalInvoiceStatus = (id: string, status: any, method: string) => {
        setInvoices((prev: Invoice[]) => prev.map((inv: Invoice) => inv.id === id ? { ...inv, status, payment_method: method } : inv));
        if (selectedInvoice && selectedInvoice.id === id) {
            setSelectedInvoice((prev: Invoice | null) => prev ? { ...prev, status, payment_method: method } : null);
        }
    };

    return (
        <div className="oc-overlay-page" style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(5, 10, 24, 0.92)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            color: '#F8FAFC',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Top Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 28px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(15, 23, 42, 0.85)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #3B82F6, #10B981)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                    }}>
                        💳
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            Merchant Invoicing & Multi-Rail Gateway
                            <span style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                ● PCI-DSS & FedACH Active
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94A3B8' }}>
                            Card Processing • Plaid & Manual ACH Trial Deposits • SWIFT International • PayPal / Zelle / CashApp Tags
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 18px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: '#E2E8F0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '13px'
                            }}
                        >
                            ✕ Close Gateway
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="oc-tabscroll" style={{
                display: 'flex',
                gap: 8,
                padding: '12px 28px',
                background: 'rgba(10, 16, 32, 0.7)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
                {[
                    { id: 'BUILDER', label: '🧾 1. Create Invoice', desc: 'Itemized billing & destination routing' },
                    { id: 'CHECKOUT', label: '💳 2. Client Payment Portal', desc: 'Card, Plaid, Trial ACH, SWIFT & Tags' },
                    { id: 'SETTLEMENT', label: '🏛️ 3. Payout Destination', desc: 'Where received funds deposit' },
                    { id: 'LEDGER', label: '📊 4. Invoicing Ledger', desc: 'Active settlements & trial status' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id as any); setStatusMessage(null); }}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            borderRadius: '8px',
                            background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                            border: `1px solid ${activeTab === tab.id ? '#3B82F6' : 'rgba(255, 255, 255, 0.06)'}`,
                            color: activeTab === tab.id ? '#60A5FA' : '#94A3B8',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ fontWeight: 700, fontSize: '13px', color: activeTab === tab.id ? '#FFFFFF' : '#E2E8F0' }}>{tab.label}</div>
                        <div style={{ fontSize: '11px', opacity: 0.75 }}>{tab.desc}</div>
                    </button>
                ))}
            </div>

            {/* Status notification toast */}
            {statusMessage && (
                <div style={{
                    margin: '12px 28px 0',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : (statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                    border: `1px solid ${statusMessage.type === 'success' ? '#10B981' : (statusMessage.type === 'error' ? '#EF4444' : '#3B82F6')}`,
                    color: statusMessage.type === 'success' ? '#34D399' : (statusMessage.type === 'error' ? '#F87171' : '#60A5FA'),
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <span>{statusMessage.text}</span>
                    <button onClick={() => setStatusMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* Main Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

                {/* TAB 1: INVOICE BUILDER */}
                {activeTab === 'BUILDER' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, maxWidth: 1300, margin: '0 auto' }}>
                        {/* Left Column: Form */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '24px' }}>
                            <div style={{ marginBottom: 16 }}>
                                <HistoryBar history={designHistory} dark label="Invoice Design" />
                            </div>
                            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: 16, color: '#38BDF8' }}>
                                Client Information & Invoicing Terms
                            </div>

                            <div className="oc-g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: 6 }}>Client Company / Payor Name</label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e: any) => setClientName(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', color: '#FFF' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginBottom: 6 }}>Client Email (for Payment Link)</label>
                                    <input
                                        type="email"
                                        value={clientEmail}
                                        onChange={(e: any) => setClientEmail(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', color: '#FFF' }}
                                    />
                                </div>
                            </div>

                            {/* Line Items */}
                            <div style={{ fontSize: '14px', fontWeight: 600, margin: '20px 0 10px', color: '#E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Itemized Goods & Services</span>
                                <button
                                    onClick={() => setItems((prev: InvoiceItem[]) => [...prev, { id: String(Date.now()), description: 'Professional Services', quantity: 1, rate: 250 }])}
                                    style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3B82F6', borderRadius: '6px', color: '#60A5FA', fontSize: '11px', cursor: 'pointer' }}
                                >
                                    + Add Item
                                </button>
                            </div>

                            {items.map((item: InvoiceItem, idx: number) => (
                                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 120px 120px 30px', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e: any) => {
                                            const val = e.target.value;
                                            setItems((prev: InvoiceItem[]) => prev.map((i: InvoiceItem) => i.id === item.id ? { ...i, description: val } : i));
                                        }}
                                        style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF', fontSize: '12px' }}
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e: any) => {
                                            const qty = parseInt(e.target.value) || 1;
                                            setItems((prev: InvoiceItem[]) => prev.map((i: InvoiceItem) => i.id === item.id ? { ...i, quantity: qty } : i));
                                        }}
                                        style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF', fontSize: '12px', textAlign: 'center' }}
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.rate}
                                        onChange={(e: any) => {
                                            const r = parseFloat(e.target.value) || 0;
                                            setItems((prev: InvoiceItem[]) => prev.map((i: InvoiceItem) => i.id === item.id ? { ...i, rate: r } : i));
                                        }}
                                        style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF', fontSize: '12px', textAlign: 'right' }}
                                    />
                                    <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '13px', color: '#34D399' }}>
                                        ${(item.quantity * item.rate).toFixed(2)}
                                    </div>
                                    <button
                                        onClick={() => setItems((prev: InvoiceItem[]) => prev.filter((i: InvoiceItem) => i.id !== item.id))}
                                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '16px' }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}

                            {/* Settlement Destination Choice */}
                            <div style={{ marginTop: 24, padding: '16px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#38BDF8', fontWeight: 600, marginBottom: 8 }}>
                                    Where Should Payer Funds Settle? (Receiver Account Destination)
                                </label>
                                <div className="oc-gcards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                                    {[
                                        { id: 'RECEIVER_BANK', label: '🏦 Direct Bank (ACH/Wire)', sub: `${receiverBank.bankName.slice(0, 16)}...` },
                                        { id: 'SWIFT_INTERNATIONAL', label: '🌐 SWIFT International', sub: `BIC: ${receiverSwift.bic}` },
                                        { id: 'DIGITAL_TAGS', label: '🏷️ Multi-Tag Handles', sub: 'PayPal, Zelle, CashApp' }
                                    ].map(dest => (
                                        <button
                                            key={dest.id}
                                            onClick={() => setPayoutDest(dest.id as any)}
                                            style={{
                                                padding: '10px',
                                                borderRadius: '8px',
                                                background: payoutDest === dest.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                                                border: `1px solid ${payoutDest === dest.id ? '#10B981' : 'rgba(255, 255, 255, 0.1)'}`,
                                                color: payoutDest === dest.id ? '#34D399' : '#94A3B8',
                                                textAlign: 'left',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: '12px', color: payoutDest === dest.id ? '#FFF' : '#E2E8F0' }}>{dest.label}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.8 }}>{dest.sub}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleCreateInvoice}
                                disabled={isLoading}
                                style={{
                                    marginTop: 24,
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, #2563EB, #10B981)',
                                    color: '#FFF',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.4)'
                                }}
                            >
                                {isLoading ? 'Generating Invoice...' : `Issue & Dispatch Invoice ($${calculateSubtotal().toFixed(2)})`}
                            </button>
                        </div>

                        {/* Right Column: Live Invoice Preview */}
                        <div style={{ background: '#FFFFFF', color: '#0F172A', borderRadius: '14px', padding: '32px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E2E8F0', paddingBottom: 16 }}>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px' }}>OMNICHECK STUDIO</div>
                                    <div style={{ fontSize: '11px', color: '#64748B' }}>Commercial Invoicing Division</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563EB' }}>INVOICE</div>
                                    <div style={{ fontSize: '11px', color: '#64748B' }}>Date: {new Date().toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="oc-g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, margin: '20px 0' }}>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Billed To:</div>
                                    <div style={{ fontWeight: 700, fontSize: '13px', marginTop: 4 }}>{clientName}</div>
                                    <div style={{ fontSize: '12px', color: '#64748B' }}>{clientEmail}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Settlement Destination:</div>
                                    <div style={{ fontWeight: 600, fontSize: '12px', marginTop: 4, color: '#10B981' }}>
                                        {payoutDest === 'RECEIVER_BANK' && `Bank ACH: ${receiverBank.bankName}`}
                                        {payoutDest === 'SWIFT_INTERNATIONAL' && `SWIFT Wire: ${receiverSwift.bic}`}
                                        {payoutDest === 'DIGITAL_TAGS' && 'Multi-Rail Tags (PayPal/Zelle)'}
                                    </div>
                                </div>
                            </div>

                            {/* Summary Table */}
                            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 12 }}>
                                {items.map((item: InvoiceItem) => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: 8 }}>
                                        <span>{item.quantity}× {item.description}</span>
                                        <span style={{ fontWeight: 600 }}>${(item.quantity * item.rate).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div style={{ borderTop: '2px solid #0F172A', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800 }}>
                                    <span>Total Due:</span>
                                    <span style={{ color: '#2563EB' }}>${calculateSubtotal().toFixed(2)} {currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: CLIENT PAYMENT PORTAL SIMULATOR */}
                {activeTab === 'CHECKOUT' && (
                    <div style={{ maxWidth: 860, margin: '0 auto', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '28px' }}>
                        {selectedInvoice ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#38BDF8', fontWeight: 600 }}>PAYMENT PORTAL (CLIENT VIEW)</div>
                                        <div style={{ fontSize: '20px', fontWeight: 800 }}>Invoice {selectedInvoice.id}</div>
                                        <div style={{ fontSize: '13px', color: '#94A3B8' }}>Billed to: {selectedInvoice.client_name} ({selectedInvoice.client_email})</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '24px', fontWeight: 800, color: '#34D399' }}>${selectedInvoice.amount.toFixed(2)} {selectedInvoice.currency}</div>
                                        <div style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', background: selectedInvoice.status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: selectedInvoice.status === 'PAID' ? '#34D399' : '#FBBF24' }}>
                                            Status: {selectedInvoice.status}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method Selector */}
                                <div className="oc-gcards" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
                                    {[
                                        { id: 'CARD', label: '💳 Card', sub: 'Visa / MC / Amex' },
                                        { id: 'PLAID', label: '⚡ Plaid Bank', sub: 'Instant OAuth' },
                                        { id: 'MANUAL_ACH', label: '🏦 Manual ACH', sub: 'Trial Deposits' },
                                        { id: 'SWIFT', label: '🌐 SWIFT Wire', sub: 'Cross-Border' },
                                        { id: 'DIGITAL_TAGS', label: '🏷️ Tags', sub: 'Zelle / PayPal' }
                                    ].map(m => (
                                        <button
                                            key={m.id}
                                            onClick={() => setCheckoutMethod(m.id as any)}
                                            style={{
                                                padding: '12px 10px',
                                                borderRadius: '10px',
                                                background: checkoutMethod === m.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.3)',
                                                border: `1px solid ${checkoutMethod === m.id ? '#3B82F6' : 'rgba(255, 255, 255, 0.08)'}`,
                                                color: checkoutMethod === m.id ? '#60A5FA' : '#94A3B8',
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, fontSize: '13px', color: checkoutMethod === m.id ? '#FFF' : '#E2E8F0' }}>{m.label}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.8 }}>{m.sub}</div>
                                        </button>
                                    ))}
                                </div>

                                {/* RAIL A: CREDIT / DEBIT CARD */}
                                {checkoutMethod === 'CARD' && (
                                    <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 12, color: '#38BDF8' }}>Credit / Debit Card Payment</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                                            <div>
                                                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Card Number</label>
                                                <input
                                                    type="text"
                                                    value={cardData.number}
                                                    onChange={(e: any) => setCardData((prev: any) => ({ ...prev, number: e.target.value }))}
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Expires</label>
                                                <input
                                                    type="text"
                                                    value={cardData.exp}
                                                    onChange={(e: any) => setCardData((prev: any) => ({ ...prev, exp: e.target.value }))}
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '11px', color: '#94A3B8' }}>CVC</label>
                                                <input
                                                    type="text"
                                                    value={cardData.cvc}
                                                    onChange={(e: any) => setCardData((prev: any) => ({ ...prev, cvc: e.target.value }))}
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF' }}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handlePayCard}
                                            disabled={isLoading || selectedInvoice.status === 'PAID'}
                                            style={{ width: '100%', padding: '12px', background: '#2563EB', color: '#FFF', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            {selectedInvoice.status === 'PAID' ? '✓ Invoice Paid' : `Authorize Card Payment ($${selectedInvoice.amount.toFixed(2)})`}
                                        </button>
                                    </div>
                                )}

                                {/* RAIL B: PLAID INSTANT LINK */}
                                {checkoutMethod === 'PLAID' && (
                                    <div style={{ padding: '24px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '32px', marginBottom: 8 }}>⚡</div>
                                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#38BDF8' }}>Plaid Instant Bank Connection</div>
                                        <div style={{ fontSize: '12px', color: '#94A3B8', maxWidth: 450, margin: '8px auto 20px' }}>
                                            Connect securely to over 12,000 financial institutions (Chase, Bank of America, Wells Fargo, Citi) with zero manual deposit waiting times.
                                        </div>
                                        <button
                                            onClick={handlePayPlaid}
                                            disabled={isLoading || selectedInvoice.status === 'PAID'}
                                            style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #000, #1E293B)', border: '1px solid #38BDF8', color: '#38BDF8', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            {selectedInvoice.status === 'PAID' ? '✓ Verified via Plaid' : 'Connect Bank via Plaid Simulator'}
                                        </button>
                                    </div>
                                )}

                                {/* RAIL C: MANUAL ACH (ROUTING + ACCOUNT WITH TRIAL DEPOSITS) */}
                                {checkoutMethod === 'MANUAL_ACH' && (
                                    <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 8, color: '#38BDF8' }}>
                                            Manual Bank Account ACH (Trial Deposit Verification Workflow)
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: 16 }}>
                                            Enter the routing number (9 digits with ABA Mod-10 checksum) and account number. The system will dispatch two small trial micro-deposits to authenticate ownership.
                                        </div>

                                        <div className="oc-g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                                            <div>
                                                <label style={{ fontSize: '11px', color: '#94A3B8' }}>9-Digit ABA Routing Number</label>
                                                <input
                                                    type="text"
                                                    value={manualAchData.routingNumber}
                                                    onChange={(e: any) => setManualAchData((prev: any) => ({ ...prev, routingNumber: e.target.value }))}
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Bank Account Number</label>
                                                <input
                                                    type="text"
                                                    value={manualAchData.accountNumber}
                                                    onChange={(e: any) => setManualAchData((prev: any) => ({ ...prev, accountNumber: e.target.value }))}
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button
                                                onClick={handleManualAchInitiate}
                                                disabled={isLoading || selectedInvoice.status === 'PAID'}
                                                style={{ flex: 1, padding: '12px', background: '#2563EB', color: '#FFF', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                1. Dispatch 2 Trial Micro-Deposits
                                            </button>
                                            <button
                                                onClick={() => setShowTrialModal(true)}
                                                style={{ padding: '12px 20px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#34D399', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                2. Enter Trial Amounts
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* RAIL D: SWIFT INTERNATIONAL WIRE */}
                                {checkoutMethod === 'SWIFT' && (
                                    <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 8, color: '#38BDF8' }}>SWIFT / Cross-Border Wire Transfer</div>
                                        <div className="oc-g2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginBottom: 16 }}>
                                            <div>
                                                <label style={{ fontSize: '11px', color: '#94A3B8' }}>SWIFT / BIC Code</label>
                                                <input
                                                    type="text"
                                                    value={swiftData.bic}
                                                    onChange={(e: any) => setSwiftData((prev: any) => ({ ...prev, bic: e.target.value.toUpperCase() }))}
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '11px', color: '#94A3B8' }}>IBAN / Account Number</label>
                                                <input
                                                    type="text"
                                                    value={swiftData.iban}
                                                    onChange={(e: any) => setSwiftData((prev: any) => ({ ...prev, iban: e.target.value }))}
                                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF' }}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handlePaySwift}
                                            disabled={isLoading || selectedInvoice.status === 'PAID'}
                                            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #1E40AF, #3730A3)', color: '#FFF', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Confirm SWIFT Wire Instruction
                                        </button>
                                    </div>
                                )}

                                {/* RAIL E: UNIVERSAL DIGITAL TAGS */}
                                {checkoutMethod === 'DIGITAL_TAGS' && (
                                    <div style={{ padding: '20px', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: 12, color: '#38BDF8' }}>Digital Tag Payment Link</div>
                                        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                                            {['ZELLE', 'PAYPAL', 'CASHAPP', 'VENMO'].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setTagData((prev: any) => ({ ...prev, platform: p }))}
                                                    style={{
                                                        flex: 1,
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        background: tagData.platform === p ? '#2563EB' : 'rgba(255,255,255,0.06)',
                                                        border: 'none',
                                                        color: '#FFF',
                                                        fontWeight: 700,
                                                        fontSize: '12px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>

                                        <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '11px', color: '#94A3B8' }}>Merchant {tagData.platform} Handle:</div>
                                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#34D399', marginTop: 4 }}>
                                                    {tagData.platform === 'ZELLE' && receiverTags.zelle}
                                                    {tagData.platform === 'PAYPAL' && receiverTags.paypal}
                                                    {tagData.platform === 'CASHAPP' && receiverTags.cashapp}
                                                    {tagData.platform === 'VENMO' && receiverTags.venmo}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#38BDF8', padding: '6px 12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px' }}>
                                                Ref: {tagData.reference}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handlePayTags}
                                            disabled={isLoading || selectedInvoice.status === 'PAID'}
                                            style={{ width: '100%', padding: '12px', background: '#10B981', color: '#FFF', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            Confirm {tagData.platform} Tag Transfer
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                                Please select an invoice from the ledger to view the payment portal.
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: SETTLEMENT & PAYOUT DESTINATION CONFIGURATION */}
                {activeTab === 'SETTLEMENT' && (
                    <div style={{ maxWidth: 860, margin: '0 auto', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '28px' }}>
                        <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: 8, color: '#38BDF8' }}>
                            Merchant Settlement & Payout Routing Configuration
                        </div>
                        <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: 24 }}>
                            Configure the destination accounts where payer receipts are settled. Supports Direct FedACH, SWIFT international wires, and instant digital tag handles.
                        </div>

                        {/* Direct Bank Destination */}
                        <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 12, color: '#10B981' }}>1. Primary Domestic Bank (FedACH Direct Deposit)</div>
                            <div className="oc-g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#94A3B8' }}>Financial Institution Name</label>
                                    <input
                                        type="text"
                                        value={receiverBank.bankName}
                                        onChange={(e: any) => setReceiverBank((prev: any) => ({ ...prev, bankName: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#94A3B8' }}>9-Digit Routing Number</label>
                                    <input
                                        type="text"
                                        value={receiverBank.routingNumber}
                                        onChange={(e: any) => setReceiverBank((prev: any) => ({ ...prev, routingNumber: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SWIFT International */}
                        <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 12, color: '#38BDF8' }}>2. Global SWIFT / Wire Payout Account</div>
                            <div className="oc-g2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#94A3B8' }}>SWIFT / BIC Code</label>
                                    <input
                                        type="text"
                                        value={receiverSwift.bic}
                                        onChange={(e: any) => setReceiverSwift((prev: any) => ({ ...prev, bic: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#94A3B8' }}>IBAN / Beneficiary Account</label>
                                    <input
                                        type="text"
                                        value={receiverSwift.iban}
                                        onChange={(e: any) => setReceiverSwift((prev: any) => ({ ...prev, iban: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Digital Tag Handles */}
                        <div style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: 12, color: '#A855F7' }}>3. Instant Digital Tag Receivers</div>
                            <div className="oc-g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#94A3B8' }}>Zelle Mobile / Email</label>
                                    <input
                                        type="text"
                                        value={receiverTags.zelle}
                                        onChange={(e: any) => setReceiverTags((prev: any) => ({ ...prev, zelle: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: '#94A3B8' }}>PayPal Handle (paypal.me)</label>
                                    <input
                                        type="text"
                                        value={receiverTags.paypal}
                                        onChange={(e: any) => setReceiverTags((prev: any) => ({ ...prev, paypal: e.target.value }))}
                                        style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#FFF' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setStatusMessage({ type: 'success', text: '✅ Merchant settlement routing rules updated and active across all invoice links.' })}
                            style={{ padding: '12px 24px', background: '#10B981', color: '#FFF', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Save Payout Routing Preferences
                        </button>
                    </div>
                )}

                {/* TAB 4: INVOICING REGISTER & LEDGER */}
                {activeTab === 'LEDGER' && (
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        {/* KPI Cards */}
                        <div className="oc-gcards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                            {[
                                { label: 'Total Invoiced Volume', val: `$${invoices.reduce((s: number, i: Invoice) => s + i.amount, 0).toFixed(2)}`, color: '#38BDF8' },
                                { label: 'Settled Receipts', val: `$${invoices.filter((i: Invoice) => i.status === 'PAID').reduce((s: number, i: Invoice) => s + i.amount, 0).toFixed(2)}`, color: '#34D399' },
                                { label: 'Pending Payment', val: invoices.filter((i: Invoice) => i.status !== 'PAID').length, color: '#FBBF24' },
                                { label: 'Active Trial Deposits', val: invoices.filter((i: Invoice) => i.status === 'TRIAL_PENDING').length, color: '#A855F7' }
                            ].map((kpi, idx) => (
                                <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                                    <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: kpi.color, marginTop: 6 }}>{kpi.val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Invoices Table */}
                        <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94A3B8' }}>
                                        <th style={{ padding: '14px 18px' }}>INVOICE ID</th>
                                        <th style={{ padding: '14px 18px' }}>CLIENT</th>
                                        <th style={{ padding: '14px 18px' }}>AMOUNT</th>
                                        <th style={{ padding: '14px 18px' }}>STATUS</th>
                                        <th style={{ padding: '14px 18px' }}>METHOD</th>
                                        <th style={{ padding: '14px 18px' }}>ACTION</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoices.map((inv: Invoice) => (
                                        <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                            <td style={{ padding: '14px 18px', fontWeight: 700, color: '#38BDF8' }}>{inv.id}</td>
                                            <td style={{ padding: '14px 18px' }}>{inv.client_name}</td>
                                            <td style={{ padding: '14px 18px', fontWeight: 700, color: '#34D399' }}>${inv.amount.toFixed(2)}</td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <span style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    background: inv.status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : (inv.status === 'TRIAL_PENDING' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(245, 158, 11, 0.2)'),
                                                    color: inv.status === 'PAID' ? '#34D399' : (inv.status === 'TRIAL_PENDING' ? '#C084FC' : '#FBBF24')
                                                }}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '14px 18px', color: '#94A3B8' }}>{inv.payment_method || 'Unpaid'}</td>
                                            <td style={{ padding: '14px 18px' }}>
                                                <button
                                                    onClick={() => { setSelectedInvoice(inv); setActiveTab('CHECKOUT'); }}
                                                    style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3B82F6', color: '#60A5FA', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                                                >
                                                    Open Portal →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Trial Micro-Deposit Verification Modal */}
            {showTrialModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10000,
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="oc-fluid" style={{
                        width: '460px',
                        background: '#0F172A',
                        border: '1px solid #334155',
                        borderRadius: '16px',
                        padding: '28px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                    }}>
                        <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: 8, color: '#38BDF8' }}>
                            Verify Bank Micro-Deposits
                        </div>
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: 16 }}>
                            Two trial deposits under $1.00 were sent to your bank account. Check your online banking or mobile app and enter the exact two amounts below.
                        </div>

                        {activeTrialHint && (
                            <div style={{ padding: '10px 14px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', fontSize: '11px', color: '#38BDF8', marginBottom: 16 }}>
                                💡 <strong>Bank Simulator Feed:</strong> Deposits sent to account ending in <strong>{activeTrialHint.ending}</strong>: <strong>${activeTrialHint.d1.toFixed(2)}</strong> and <strong>${activeTrialHint.d2.toFixed(2)}</strong>.
                            </div>
                        )}

                        <div className="oc-g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                            <div>
                                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Deposit 1 ($0.XX)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.14"
                                    value={trialDep1}
                                    onChange={(e: any) => setTrialDep1(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', color: '#94A3B8' }}>Deposit 2 ($0.XX)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.32"
                                    value={trialDep2}
                                    onChange={(e: any) => setTrialDep2(e.target.value)}
                                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#FFF' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowTrialModal(false)}
                                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#FFF', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerifyTrialDeposits}
                                disabled={isLoading || !trialDep1 || !trialDep2}
                                style={{ flex: 2, padding: '10px', background: '#10B981', border: 'none', color: '#FFF', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Verify & Settle Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchantInvoicingEngine;
