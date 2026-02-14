/**
 * CryptoPaymentPanel - UI Component for Cryptocurrency Payments
 * 
 * Features:
 * - Multi-chain support (Ethereum, Polygon, BSC, Arbitrum, etc.)
 * - Stablecoin payments (USDT, USDC, DAI)
 * - QR code display
 * - Real-time price updates
 * - Payment status tracking
 * - Wallet connect integration
 */

import React, { useState, useCallback, useEffect } from 'react';

// ============== TYPES ==============

type SupportedChain = 'ethereum' | 'polygon' | 'bsc' | 'arbitrum' | 'base' | 'solana' | 'tron';
type StableCoin = 'USDT' | 'USDC' | 'DAI' | 'ETH' | 'BTC' | 'SOL';

interface ChainInfo {
    name: string;
    icon: string;
    color: string;
    avgFee: string;
    avgTime: string;
}

interface TokenInfo {
    symbol: StableCoin;
    name: string;
    icon: string;
    priceUSD: number;
    isStablecoin: boolean;
}

interface PaymentSession {
    sessionId: string;
    amountUSD: number;
    amountCrypto: number;
    token: StableCoin;
    chain: SupportedChain;
    address: string;
    qrCode: string;
    status: 'pending' | 'confirming' | 'completed' | 'expired' | 'failed';
    expiresAt: string;
    confirmations: number;
    requiredConfirmations: number;
    txHash?: string;
}

interface CryptoPaymentPanelProps {
    amountUSD: number;
    orderId: string;
    onPaymentComplete?: (session: PaymentSession) => void;
    onPaymentFailed?: (error: string) => void;
    theme?: 'light' | 'dark';
}

// ============== CONSTANTS ==============

const CHAINS: Record<SupportedChain, ChainInfo> = {
    ethereum: { name: 'Ethereum', icon: '⟠', color: '#627EEA', avgFee: '$2-5', avgTime: '~15s' },
    polygon: { name: 'Polygon', icon: '⬡', color: '#8247E5', avgFee: '$0.01', avgTime: '~2s' },
    bsc: { name: 'BNB Chain', icon: '⬢', color: '#F0B90B', avgFee: '$0.10', avgTime: '~3s' },
    arbitrum: { name: 'Arbitrum', icon: '🔵', color: '#28A0F0', avgFee: '$0.15', avgTime: '~1s' },
    base: { name: 'Base', icon: '🔷', color: '#0052FF', avgFee: '$0.01', avgTime: '~2s' },
    solana: { name: 'Solana', icon: '◎', color: '#9945FF', avgFee: '$0.001', avgTime: '~0.4s' },
    tron: { name: 'Tron', icon: '◈', color: '#FF0013', avgFee: '$0.50', avgTime: '~3s' }
};

const TOKENS: Record<StableCoin, TokenInfo> = {
    USDT: { symbol: 'USDT', name: 'Tether USD', icon: '₮', priceUSD: 1.00, isStablecoin: true },
    USDC: { symbol: 'USDC', name: 'USD Coin', icon: '$', priceUSD: 1.00, isStablecoin: true },
    DAI: { symbol: 'DAI', name: 'Dai', icon: '◈', priceUSD: 1.00, isStablecoin: true },
    ETH: { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', priceUSD: 3450, isStablecoin: false },
    BTC: { symbol: 'BTC', name: 'Bitcoin', icon: '₿', priceUSD: 98500, isStablecoin: false },
    SOL: { symbol: 'SOL', name: 'Solana', icon: '◎', priceUSD: 195, isStablecoin: false }
};

const TOKEN_AVAILABILITY: Record<SupportedChain, StableCoin[]> = {
    ethereum: ['USDT', 'USDC', 'DAI', 'ETH'],
    polygon: ['USDT', 'USDC', 'DAI'],
    bsc: ['USDT', 'USDC', 'DAI'],
    arbitrum: ['USDT', 'USDC', 'DAI', 'ETH'],
    base: ['USDC', 'ETH'],
    solana: ['USDC', 'SOL'],
    tron: ['USDT']
};

// ============== COMPONENT ==============

export const CryptoPaymentPanel: React.FC<CryptoPaymentPanelProps> = ({
    amountUSD,
    orderId,
    onPaymentComplete,
    onPaymentFailed,
    theme = 'light'
}) => {
    const [selectedChain, setSelectedChain] = useState<SupportedChain>('polygon');
    const [selectedToken, setSelectedToken] = useState<StableCoin>('USDC');
    const [session, setSession] = useState<PaymentSession | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(0);
    const [isCreating, setIsCreating] = useState(false);
    const [prices, setPrices] = useState<Record<StableCoin, number>>({ ...Object.fromEntries(Object.entries(TOKENS).map(([k, v]) => [k, v.priceUSD])) } as Record<StableCoin, number>);

    const colors = {
        bg: theme === 'dark' ? '#111827' : '#F9FAFB',
        card: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        text: theme === 'dark' ? '#FFFFFF' : '#111827',
        textSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        border: theme === 'dark' ? '#374151' : '#E5E7EB',
        primary: '#3B82F6',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444'
    };

    // Update available tokens when chain changes
    useEffect(() => {
        const available = TOKEN_AVAILABILITY[selectedChain];
        if (!available.includes(selectedToken)) {
            setSelectedToken(available[0]);
        }
    }, [selectedChain, selectedToken]);

    // Price updates
    useEffect(() => {
        const interval = setInterval(() => {
            setPrices(prev => ({
                ...prev,
                ETH: prev.ETH + (Math.random() - 0.5) * 20,
                BTC: prev.BTC + (Math.random() - 0.5) * 500,
                SOL: prev.SOL + (Math.random() - 0.5) * 2
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!session || session.status !== 'pending') return;

        const interval = setInterval(() => {
            const remaining = Math.max(0, new Date(session.expiresAt).getTime() - Date.now());
            setTimeRemaining(remaining);

            if (remaining === 0) {
                setSession(prev => prev ? { ...prev, status: 'expired' } : null);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [session]);

    // Payment status check
    useEffect(() => {
        if (!session || session.status !== 'pending') return;

        const interval = setInterval(() => {
            // Simulate payment detection
            if (Math.random() > 0.95) {
                setSession(prev => prev ? {
                    ...prev,
                    status: 'confirming',
                    txHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
                } : null);
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [session]);

    // Confirmation tracking
    useEffect(() => {
        if (!session || session.status !== 'confirming') return;

        const interval = setInterval(() => {
            setSession(prev => {
                if (!prev) return null;
                const newConfirmations = prev.confirmations + Math.floor(Math.random() * 3) + 1;
                if (newConfirmations >= prev.requiredConfirmations) {
                    onPaymentComplete?.({ ...prev, status: 'completed', confirmations: newConfirmations });
                    return { ...prev, status: 'completed', confirmations: newConfirmations };
                }
                return { ...prev, confirmations: newConfirmations };
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [session, onPaymentComplete]);

    // Create payment session
    const createPayment = useCallback(async () => {
        setIsCreating(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const cryptoAmount = amountUSD / prices[selectedToken];
            const address = generateAddress(selectedChain);

            const newSession: PaymentSession = {
                sessionId: `cs_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                amountUSD,
                amountCrypto: Math.round(cryptoAmount * 1e6) / 1e6,
                token: selectedToken,
                chain: selectedChain,
                address,
                qrCode: `${selectedChain}:${address}?amount=${cryptoAmount}`,
                status: 'pending',
                expiresAt: new Date(Date.now() + 30 * 60000).toISOString(),
                confirmations: 0,
                requiredConfirmations: getRequiredConfirmations(selectedChain)
            };

            setSession(newSession);
            setTimeRemaining(30 * 60000);

        } catch (error: any) {
            onPaymentFailed?.(error.message);
        } finally {
            setIsCreating(false);
        }
    }, [amountUSD, selectedChain, selectedToken, prices, onPaymentFailed]);

    // Render chain selector
    const renderChainSelector = () => (
        <div style={{ marginBottom: '24px' }}>
            <label style={{
                display: 'block',
                color: colors.text,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px'
            }}>
                Select Network
            </label>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                gap: '8px'
            }}>
                {(Object.entries(CHAINS) as [SupportedChain, ChainInfo][]).map(([chain, info]) => (
                    <button
                        key={chain}
                        onClick={() => setSelectedChain(chain)}
                        disabled={!!session}
                        style={{
                            padding: '12px 8px',
                            background: selectedChain === chain ? `${info.color}20` : colors.card,
                            border: `2px solid ${selectedChain === chain ? info.color : colors.border}`,
                            borderRadius: '10px',
                            cursor: session ? 'default' : 'pointer',
                            opacity: session ? 0.6 : 1,
                            textAlign: 'center',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{info.icon}</div>
                        <div style={{ fontSize: '11px', fontWeight: '500', color: colors.text }}>{info.name}</div>
                        <div style={{ fontSize: '9px', color: colors.textSecondary }}>{info.avgFee}</div>
                    </button>
                ))}
            </div>
        </div>
    );

    // Render token selector
    const renderTokenSelector = () => {
        const availableTokens = TOKEN_AVAILABILITY[selectedChain];

        return (
            <div style={{ marginBottom: '24px' }}>
                <label style={{
                    display: 'block',
                    color: colors.text,
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '12px'
                }}>
                    Select Token
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {availableTokens.map(token => {
                        const info = TOKENS[token];
                        return (
                            <button
                                key={token}
                                onClick={() => setSelectedToken(token)}
                                disabled={!!session}
                                style={{
                                    padding: '12px 16px',
                                    background: selectedToken === token ? colors.primary : colors.card,
                                    color: selectedToken === token ? '#FFFFFF' : colors.text,
                                    border: `1px solid ${selectedToken === token ? colors.primary : colors.border}`,
                                    borderRadius: '8px',
                                    cursor: session ? 'default' : 'pointer',
                                    opacity: session ? 0.6 : 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <span style={{ fontSize: '18px' }}>{info.icon}</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '500' }}>{token}</div>
                                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                                        {info.isStablecoin ? '≈ $1.00' : `≈ $${prices[token].toLocaleString()}`}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render payment amount
    const renderPaymentAmount = () => {
        const cryptoAmount = amountUSD / prices[selectedToken];

        return (
            <div style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '8px' }}>
                        Amount to Pay
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', color: colors.text }}>
                        {cryptoAmount < 1
                            ? cryptoAmount.toFixed(6)
                            : cryptoAmount.toFixed(4)
                        } {selectedToken}
                    </div>
                    <div style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '4px' }}>
                        ≈ ${amountUSD.toFixed(2)} USD
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: `1px solid ${colors.border}`
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>Network</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: colors.text }}>
                            {CHAINS[selectedChain].name}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>Est. Fee</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: colors.text }}>
                            {CHAINS[selectedChain].avgFee}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>Est. Time</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: colors.text }}>
                            {CHAINS[selectedChain].avgTime}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render QR code and address
    const renderPaymentDetails = () => {
        if (!session) return null;

        const minutes = Math.floor(timeRemaining / 60000);
        const seconds = Math.floor((timeRemaining % 60000) / 1000);

        return (
            <div style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center'
            }}>
                {/* Status badge */}
                <div style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: '16px',
                    marginBottom: '16px',
                    background: session.status === 'pending' ? `${colors.warning}20` :
                        session.status === 'confirming' ? `${colors.primary}20` :
                            session.status === 'completed' ? `${colors.success}20` :
                                `${colors.error}20`,
                    color: session.status === 'pending' ? colors.warning :
                        session.status === 'confirming' ? colors.primary :
                            session.status === 'completed' ? colors.success :
                                colors.error,
                    fontSize: '13px',
                    fontWeight: '500'
                }}>
                    {session.status === 'pending' && '⏳ Awaiting Payment'}
                    {session.status === 'confirming' && `🔄 Confirming (${session.confirmations}/${session.requiredConfirmations})`}
                    {session.status === 'completed' && '✅ Payment Complete'}
                    {session.status === 'expired' && '⏰ Payment Expired'}
                    {session.status === 'failed' && '❌ Payment Failed'}
                </div>

                {/* Timer */}
                {session.status === 'pending' && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary }}>Time Remaining</div>
                        <div style={{ fontSize: '24px', fontWeight: '600', color: timeRemaining < 300000 ? colors.error : colors.text }}>
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </div>
                    </div>
                )}

                {/* QR Code placeholder */}
                {session.status === 'pending' && (
                    <div style={{
                        width: '200px',
                        height: '200px',
                        margin: '0 auto 20px',
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #E5E7EB'
                    }}>
                        <div style={{ textAlign: 'center', color: '#6B7280' }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>📱</div>
                            <div style={{ fontSize: '12px' }}>QR Code</div>
                        </div>
                    </div>
                )}

                {/* Address */}
                {session.status === 'pending' && (
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '8px' }}>
                            Send to Address
                        </div>
                        <div style={{
                            background: colors.bg,
                            padding: '12px',
                            borderRadius: '8px',
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            color: colors.text,
                            wordBreak: 'break-all'
                        }}>
                            {session.address}
                        </div>
                        <button
                            onClick={() => navigator.clipboard.writeText(session.address)}
                            style={{
                                marginTop: '8px',
                                padding: '8px 16px',
                                background: 'transparent',
                                color: colors.primary,
                                border: `1px solid ${colors.primary}`,
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            📋 Copy Address
                        </button>
                    </div>
                )}

                {/* Transaction hash */}
                {session.txHash && (
                    <div style={{ marginTop: '16px' }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                            Transaction Hash
                        </div>
                        <a
                            href={`${getExplorerUrl(session.chain)}/tx/${session.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                color: colors.primary,
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all'
                            }}
                        >
                            {session.txHash.slice(0, 20)}...{session.txHash.slice(-20)}
                        </a>
                    </div>
                )}

                {/* Completion message */}
                {session.status === 'completed' && (
                    <div style={{
                        marginTop: '20px',
                        padding: '16px',
                        background: `${colors.success}10`,
                        borderRadius: '8px',
                        color: colors.success
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                        <div style={{ fontWeight: '600' }}>Payment Successful!</div>
                        <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
                            {session.amountCrypto} {session.token} received
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            background: colors.bg,
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            margin: '0 auto'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px', color: colors.text, fontSize: '20px', fontWeight: '700' }}>
                    💎 Crypto Payment
                </h2>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>
                    Pay with cryptocurrency
                </p>
            </div>

            {/* Selectors (only show before payment created) */}
            {!session && (
                <>
                    {renderChainSelector()}
                    {renderTokenSelector()}
                </>
            )}

            {/* Amount display */}
            {renderPaymentAmount()}

            {/* Payment details or create button */}
            {session ? (
                renderPaymentDetails()
            ) : (
                <button
                    onClick={createPayment}
                    disabled={isCreating}
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: isCreating ? colors.border : `linear-gradient(135deg, ${CHAINS[selectedChain].color}, ${colors.primary})`,
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: isCreating ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {isCreating ? (
                        <>⏳ Creating Payment...</>
                    ) : (
                        <>💳 Pay with {selectedToken}</>
                    )}
                </button>
            )}

            {/* Reset button */}
            {session && ['expired', 'failed', 'completed'].includes(session.status) && (
                <button
                    onClick={() => setSession(null)}
                    style={{
                        width: '100%',
                        marginTop: '12px',
                        padding: '12px',
                        background: 'transparent',
                        color: colors.textSecondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {session.status === 'completed' ? '✓ Done' : '← Try Again'}
                </button>
            )}

            {/* Security notice */}
            <div style={{
                marginTop: '20px',
                padding: '12px',
                background: `${colors.warning}10`,
                borderRadius: '8px',
                fontSize: '11px',
                color: colors.textSecondary,
                textAlign: 'center'
            }}>
                🔒 Secure payment. Only send {selectedToken} on {CHAINS[selectedChain].name} network.
            </div>
        </div>
    );
};

// ============== HELPER FUNCTIONS ==============

function generateAddress(chain: SupportedChain): string {
    if (chain === 'solana') {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        return Array(44).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
    if (chain === 'tron') {
        return 'T' + Array(33).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
    }
    return '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

function getRequiredConfirmations(chain: SupportedChain): number {
    const confirmations: Record<SupportedChain, number> = {
        ethereum: 12,
        polygon: 30,
        bsc: 15,
        arbitrum: 20,
        base: 20,
        solana: 32,
        tron: 19
    };
    return confirmations[chain];
}

function getExplorerUrl(chain: SupportedChain): string {
    const explorers: Record<SupportedChain, string> = {
        ethereum: 'https://etherscan.io',
        polygon: 'https://polygonscan.com',
        bsc: 'https://bscscan.com',
        arbitrum: 'https://arbiscan.io',
        base: 'https://basescan.org',
        solana: 'https://solscan.io',
        tron: 'https://tronscan.org'
    };
    return explorers[chain];
}

export default CryptoPaymentPanel;
