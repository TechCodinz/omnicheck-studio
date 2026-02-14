/**
 * PricingPage — OmniCheck Pro Premium Pricing
 * Beautiful, conversion-optimized pricing cards
 */
import React, { useState } from 'react';
import { PLANS, PlanDef, useLicense } from '../contexts/LicenseContext';

const PricingPage: React.FC = () => {
    const { license, currentPlan, activatePlan, checksRemaining, isPaid } = useLicense();
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'crypto' | 'card'>('crypto');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    // Wallet addresses (REPLACE WITH YOUR ACTUAL WALLETS)
    const WALLETS = {
        BTC: 'bc1qYOUR_BTC_WALLET_HERE',
        ETH: '0xYOUR_ETH_WALLET_HERE',
        USDT_TRC20: 'TYOUR_USDT_TRC20_WALLET_HERE',
        USDT_ERC20: '0xYOUR_USDT_ERC20_WALLET_HERE'
    };

    const handleSelectPlan = (planId: string) => {
        if (planId === 'free') return;
        setSelectedPlan(planId);
        setShowPayment(true);
        setSuccess(false);
    };

    const handlePaymentComplete = () => {
        if (!selectedPlan) return;
        setProcessing(true);
        setTimeout(() => {
            activatePlan(selectedPlan, `TX-${Date.now().toString(36).toUpperCase()}`);
            setProcessing(false);
            setSuccess(true);
            setShowPayment(false);
        }, 2000);
    };

    const plan = selectedPlan ? PLANS.find(p => p.id === selectedPlan) : null;

    return (
        <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <h1 style={{
                    color: '#fff', fontSize: '36px', fontWeight: '800', marginBottom: '12px',
                    background: 'linear-gradient(135deg, #F97316, #FB923C, #FBBF24)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                    Choose Your Plan
                </h1>
                <p style={{ color: '#9CA3AF', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
                    Design professional checks trusted by financial institutions worldwide.
                    Start free, upgrade when you're ready to export.
                </p>
                {isPaid && (
                    <div style={{
                        marginTop: '16px', padding: '10px 20px', background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '8px', display: 'inline-block', border: '1px solid #10B981'
                    }}>
                        <span style={{ color: '#10B981', fontWeight: '600' }}>
                            ✅ Active Plan: {currentPlan.name} — {checksRemaining === Infinity ? 'Unlimited' : checksRemaining} exports remaining
                        </span>
                    </div>
                )}
            </div>

            {/* Success Banner */}
            {success && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981',
                    borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '32px',
                    animation: 'fadeIn 0.5s ease'
                }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
                    <div style={{ color: '#10B981', fontSize: '20px', fontWeight: '700' }}>Plan Activated!</div>
                    <div style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '4px' }}>
                        Your {currentPlan.name} plan is now active. Go build amazing checks!
                    </div>
                </div>
            )}

            {/* Plan Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
                {PLANS.map((p: PlanDef) => {
                    const isPopular = p.id === 'professional';
                    const isCurrent = license.planId === p.id;

                    return (
                        <div key={p.id} style={{
                            background: isPopular
                                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.12) 0%, rgba(251, 146, 60, 0.06) 100%)'
                                : '#1F2937',
                            borderRadius: '16px',
                            border: isPopular ? '2px solid #F97316' : (isCurrent ? '2px solid #10B981' : '1px solid #374151'),
                            padding: '28px 24px',
                            position: 'relative',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            cursor: p.id !== 'free' ? 'pointer' : 'default'
                        }}
                            onMouseEnter={e => { if (p.id !== 'free') (e.currentTarget.style.transform = 'translateY(-4px)'); }}
                            onMouseLeave={e => { (e.currentTarget.style.transform = 'translateY(0)'); }}
                        >
                            {/* Popular Badge */}
                            {isPopular && (
                                <div style={{
                                    position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                                    background: 'linear-gradient(135deg, #F97316, #FB923C)',
                                    color: '#fff', padding: '4px 16px', borderRadius: '20px',
                                    fontSize: '11px', fontWeight: '700', letterSpacing: '1px'
                                }}>
                                    ⭐ MOST POPULAR
                                </div>
                            )}

                            {/* Current Badge */}
                            {isCurrent && (
                                <div style={{
                                    position: 'absolute', top: '-12px', right: '16px',
                                    background: '#10B981', color: '#fff', padding: '4px 12px',
                                    borderRadius: '20px', fontSize: '10px', fontWeight: '700'
                                }}>
                                    CURRENT
                                </div>
                            )}

                            {/* Plan Name */}
                            <div style={{
                                color: p.color, fontSize: '12px', fontWeight: '700',
                                letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px'
                            }}>
                                {p.badge}
                            </div>

                            <h3 style={{ color: '#fff', fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>
                                {p.name}
                            </h3>

                            {/* Price */}
                            <div style={{ marginBottom: '20px' }}>
                                <span style={{ color: '#fff', fontSize: '36px', fontWeight: '800' }}>
                                    ${p.price === 0 ? '0' : p.price}
                                </span>
                                <span style={{ color: '#6B7280', fontSize: '14px' }}>/month</span>
                            </div>

                            {/* Check Limit */}
                            <div style={{
                                padding: '8px 12px', background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px', marginBottom: '20px', textAlign: 'center'
                            }}>
                                <span style={{ color: '#D1D5DB', fontSize: '13px', fontWeight: '600' }}>
                                    {p.checksPerMonth === -1 ? '♾️ Unlimited' : (p.checksPerMonth === 0 ? '🚫 Preview Only' : `📄 ${p.checksPerMonth}`)} exports/mo
                                </span>
                            </div>

                            {/* Features */}
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                                {p.features.map((f, i) => (
                                    <li key={i} style={{
                                        color: '#9CA3AF', fontSize: '13px', padding: '4px 0',
                                        display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        <span style={{ color: p.color }}>✓</span> {f}
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                onClick={() => handleSelectPlan(p.id)}
                                disabled={p.id === 'free' || isCurrent}
                                style={{
                                    width: '100%', padding: '12px',
                                    background: isCurrent ? '#374151' : (p.id === 'free' ? '#374151' : `linear-gradient(135deg, ${p.color}, ${p.color}CC)`),
                                    border: 'none', borderRadius: '10px',
                                    color: '#fff', fontSize: '14px', fontWeight: '600',
                                    cursor: (p.id === 'free' || isCurrent) ? 'default' : 'pointer',
                                    opacity: (p.id === 'free' || isCurrent) ? 0.5 : 1,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                {isCurrent ? 'Current Plan' : (p.id === 'free' ? 'Free Forever' : `Upgrade to ${p.name}`)}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {showPayment && plan && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(8px)'
                }}>
                    <div style={{
                        background: '#1F2937', borderRadius: '20px', padding: '32px',
                        width: '520px', maxHeight: '90vh', overflowY: 'auto',
                        border: '1px solid #374151', boxShadow: '0 25px 80px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: '700' }}>
                                💳 Complete Payment
                            </h2>
                            <button onClick={() => setShowPayment(false)} style={{
                                background: 'none', border: 'none', color: '#6B7280', fontSize: '24px', cursor: 'pointer'
                            }}>×</button>
                        </div>

                        {/* Order Summary */}
                        <div style={{
                            background: '#111827', borderRadius: '12px', padding: '20px', marginBottom: '24px',
                            border: '1px solid #374151'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#9CA3AF' }}>Plan</span>
                                <span style={{ color: '#fff', fontWeight: '600' }}>{plan.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#9CA3AF' }}>Billing</span>
                                <span style={{ color: '#fff' }}>Monthly</span>
                            </div>
                            <div style={{ borderTop: '1px solid #374151', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#fff', fontWeight: '700', fontSize: '18px' }}>Total</span>
                                <span style={{ color: '#F97316', fontWeight: '800', fontSize: '24px' }}>${plan.price}</span>
                            </div>
                        </div>

                        {/* Payment Method Tabs */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                            {(['crypto', 'card'] as const).map(m => (
                                <button key={m} onClick={() => setPaymentMethod(m)} style={{
                                    flex: 1, padding: '12px',
                                    background: paymentMethod === m ? 'rgba(249,115,22,0.15)' : '#111827',
                                    border: paymentMethod === m ? '1px solid #F97316' : '1px solid #374151',
                                    borderRadius: '10px', color: paymentMethod === m ? '#F97316' : '#9CA3AF',
                                    cursor: 'pointer', fontWeight: '600', fontSize: '13px'
                                }}>
                                    {m === 'crypto' ? '₿ Cryptocurrency' : '💳 Card Payment'}
                                </button>
                            ))}
                        </div>

                        {/* Crypto Payment */}
                        {paymentMethod === 'crypto' && (
                            <div>
                                <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '16px' }}>
                                    Send <strong style={{ color: '#F97316' }}>${plan.price} USD</strong> equivalent to one of the addresses below, then click "I've Sent Payment".
                                </p>
                                {Object.entries(WALLETS).map(([coin, addr]) => (
                                    <div key={coin} style={{
                                        background: '#111827', borderRadius: '8px', padding: '12px',
                                        marginBottom: '8px', border: '1px solid #374151'
                                    }}>
                                        <div style={{ color: '#F97316', fontSize: '11px', fontWeight: '700', marginBottom: '4px' }}>{coin}</div>
                                        <div style={{
                                            color: '#D1D5DB', fontSize: '11px', fontFamily: 'monospace',
                                            wordBreak: 'break-all', cursor: 'pointer'
                                        }}
                                            onClick={() => navigator.clipboard.writeText(addr)}
                                            title="Click to copy"
                                        >
                                            {addr}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Card Payment Placeholder */}
                        {paymentMethod === 'card' && (
                            <div style={{
                                background: '#111827', borderRadius: '12px', padding: '24px',
                                textAlign: 'center', border: '1px solid #374151'
                            }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔒</div>
                                <div style={{ color: '#9CA3AF', fontSize: '14px' }}>
                                    Stripe card processing coming soon. Use crypto for now.
                                </div>
                            </div>
                        )}

                        {/* Confirm Button */}
                        <button
                            onClick={handlePaymentComplete}
                            disabled={processing}
                            style={{
                                width: '100%', padding: '16px', marginTop: '20px',
                                background: processing
                                    ? '#374151'
                                    : 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)',
                                border: 'none', borderRadius: '12px',
                                color: '#fff', fontSize: '16px', fontWeight: '700',
                                cursor: processing ? 'wait' : 'pointer'
                            }}
                        >
                            {processing ? '⏳ Verifying Payment...' : "✅ I've Sent Payment — Activate Plan"}
                        </button>

                        <p style={{ color: '#6B7280', fontSize: '11px', textAlign: 'center', marginTop: '12px' }}>
                            Plans activate instantly. 30-day billing cycle. Cancel anytime.
                        </p>
                    </div>
                </div>
            )}

            {/* Trust Badges */}
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
                    {['🔒 256-bit Encryption', '🏦 Bank-Grade Security', '⚡ Instant Activation', '🌍 Used Worldwide', '💰 30-Day Guarantee'].map(badge => (
                        <span key={badge} style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600' }}>{badge}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
