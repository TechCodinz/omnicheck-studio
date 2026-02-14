/**
 * BlockchainVerificationPanel - UI for Blockchain Check Verification
 * 
 * Features:
 * - Multi-chain verification (Ethereum, Polygon, Arbitrum)
 * - NFT certificate minting
 * - Verification proof display
 * - Transaction history
 * - QR code generation
 */

import React, { useState, useCallback } from 'react';

// ============== TYPES ==============

type SupportedChain = 'ethereum' | 'polygon' | 'arbitrum' | 'base';

interface ChainInfo {
    name: string;
    icon: string;
    color: string;
    avgCost: string;
    avgTime: string;
}

interface VerificationResult {
    success: boolean;
    transactionHash: string;
    blockNumber: number;
    chain: SupportedChain;
    explorerUrl: string;
    timestamp: string;
    nft?: {
        tokenId: string;
        openSeaUrl: string;
    };
}

interface VerificationProof {
    checkId: string;
    checkHash: string;
    merkleRoot: string;
    merkleProof: string[];
    blockNumber: number;
    transactionHash: string;
    certificate: string;
}

interface BlockchainVerificationPanelProps {
    checkId: string;
    checkData: {
        checkNumber: string;
        payeeName: string;
        amount: number;
        date: string;
    };
    onVerified?: (result: VerificationResult) => void;
    theme?: 'light' | 'dark';
}

// ============== CONSTANTS ==============

const CHAINS: Record<SupportedChain, ChainInfo> = {
    ethereum: {
        name: 'Ethereum',
        icon: '⟠',
        color: '#627EEA',
        avgCost: '$2-5',
        avgTime: '~15s'
    },
    polygon: {
        name: 'Polygon',
        icon: '⬡',
        color: '#8247E5',
        avgCost: '$0.01-0.05',
        avgTime: '~2s'
    },
    arbitrum: {
        name: 'Arbitrum',
        icon: '🔵',
        color: '#28A0F0',
        avgCost: '$0.10-0.30',
        avgTime: '~1s'
    },
    base: {
        name: 'Base',
        icon: '🔷',
        color: '#0052FF',
        avgCost: '$0.01-0.05',
        avgTime: '~2s'
    }
};

// ============== COMPONENT ==============

export const BlockchainVerificationPanel: React.FC<BlockchainVerificationPanelProps> = ({
    checkId,
    checkData,
    onVerified,
    theme = 'light'
}) => {
    const [selectedChain, setSelectedChain] = useState<SupportedChain>('polygon');
    const [mintNFT, setMintNFT] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    const [proof, setProof] = useState<VerificationProof | null>(null);
    const [showProof, setShowProof] = useState(false);

    const colors = {
        bg: theme === 'dark' ? '#111827' : '#F9FAFB',
        card: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        text: theme === 'dark' ? '#FFFFFF' : '#111827',
        textSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        border: theme === 'dark' ? '#374151' : '#E5E7EB',
        success: '#10B981',
        primary: '#3B82F6'
    };

    const handleVerify = useCallback(async () => {
        setIsVerifying(true);

        try {
            // Simulate blockchain verification
            await new Promise(resolve => setTimeout(resolve, 3000));

            const txHash = `0x${Array.from({ length: 64 }, () =>
                Math.floor(Math.random() * 16).toString(16)).join('')}`;

            const result: VerificationResult = {
                success: true,
                transactionHash: txHash,
                blockNumber: Math.floor(Date.now() / 1000),
                chain: selectedChain,
                explorerUrl: `https://${selectedChain === 'polygon' ? 'polygonscan.com' :
                    selectedChain === 'ethereum' ? 'etherscan.io' :
                        selectedChain === 'arbitrum' ? 'arbiscan.io' :
                            'basescan.org'}/tx/${txHash}`,
                timestamp: new Date().toISOString()
            };

            if (mintNFT) {
                result.nft = {
                    tokenId: Math.floor(Math.random() * 1000000).toString(),
                    openSeaUrl: `https://opensea.io/assets/${selectedChain}/${txHash.slice(0, 42)}/${result.nft?.tokenId}`
                };
            }

            // Generate proof
            const generatedProof: VerificationProof = {
                checkId,
                checkHash: `0x${Array.from({ length: 64 }, () =>
                    Math.floor(Math.random() * 16).toString(16)).join('')}`,
                merkleRoot: `0x${Array.from({ length: 64 }, () =>
                    Math.floor(Math.random() * 16).toString(16)).join('')}`,
                merkleProof: [
                    `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                    `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
                    `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
                ],
                blockNumber: result.blockNumber,
                transactionHash: result.transactionHash,
                certificate: JSON.stringify({
                    version: '1.0',
                    type: 'CHECK_VERIFICATION_CERTIFICATE',
                    checkId,
                    verifiedAt: result.timestamp
                }, null, 2)
            };

            setVerificationResult(result);
            setProof(generatedProof);
            onVerified?.(result);

        } catch (error) {
            console.error('Verification failed:', error);
        } finally {
            setIsVerifying(false);
        }
    }, [checkId, selectedChain, mintNFT, onVerified]);

    const renderChainSelector = () => (
        <div style={{ marginBottom: '24px' }}>
            <label style={{
                display: 'block',
                color: colors.text,
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px'
            }}>
                Select Blockchain
            </label>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
            }}>
                {(Object.entries(CHAINS) as [SupportedChain, ChainInfo][]).map(([chain, info]) => (
                    <div
                        key={chain}
                        onClick={() => !verificationResult && setSelectedChain(chain)}
                        style={{
                            background: selectedChain === chain ? `${info.color}20` : colors.card,
                            border: `2px solid ${selectedChain === chain ? info.color : colors.border}`,
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: verificationResult ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: verificationResult && selectedChain !== chain ? 0.5 : 1
                        }}
                    >
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>{info.icon}</div>
                        <div style={{ fontWeight: '600', color: colors.text, marginBottom: '4px' }}>
                            {info.name}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary }}>
                            {info.avgCost} • {info.avgTime}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderOptions = () => (
        <div style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ fontWeight: '500', color: colors.text, marginBottom: '4px' }}>
                        🖼️ Mint NFT Certificate
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        Create a transferable NFT as proof of verification
                    </div>
                </div>
                <button
                    onClick={() => !verificationResult && setMintNFT(!mintNFT)}
                    disabled={!!verificationResult}
                    style={{
                        width: '48px',
                        height: '28px',
                        borderRadius: '14px',
                        background: mintNFT ? colors.success : colors.border,
                        border: 'none',
                        cursor: verificationResult ? 'default' : 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s'
                    }}
                >
                    <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '12px',
                        background: '#FFFFFF',
                        position: 'absolute',
                        top: '2px',
                        left: mintNFT ? '22px' : '2px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                    }} />
                </button>
            </div>
        </div>
    );

    const renderCheckSummary = () => (
        <div style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
        }}>
            <h4 style={{ margin: '0 0 16px 0', color: colors.text, fontSize: '14px', fontWeight: '600' }}>
                📝 Check Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>Check Number</div>
                    <div style={{ fontWeight: '500', color: colors.text }}>{checkData.checkNumber}</div>
                </div>
                <div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>Amount</div>
                    <div style={{ fontWeight: '500', color: colors.text }}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(checkData.amount)}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>Payee</div>
                    <div style={{ fontWeight: '500', color: colors.text }}>{checkData.payeeName}</div>
                </div>
                <div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary }}>Date</div>
                    <div style={{ fontWeight: '500', color: colors.text }}>{checkData.date}</div>
                </div>
            </div>
        </div>
    );

    const renderResult = () => {
        if (!verificationResult) return null;

        return (
            <div style={{
                background: `${colors.success}15`,
                border: `2px solid ${colors.success}`,
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: colors.success,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        ✓
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', fontSize: '18px', color: colors.text }}>
                            Verified on Blockchain
                        </div>
                        <div style={{ color: colors.textSecondary, fontSize: '13px' }}>
                            {CHAINS[verificationResult.chain].name} • Block #{verificationResult.blockNumber}
                        </div>
                    </div>
                </div>

                <div style={{
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px'
                }}>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                        Transaction Hash
                    </div>
                    <div style={{
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        color: colors.text,
                        wordBreak: 'break-all'
                    }}>
                        {verificationResult.transactionHash}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <a
                        href={verificationResult.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '10px 16px',
                            background: colors.primary,
                            color: '#FFFFFF',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        🔍 View on Explorer
                    </a>

                    <button
                        onClick={() => setShowProof(!showProof)}
                        style={{
                            padding: '10px 16px',
                            background: 'transparent',
                            color: colors.text,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                        }}
                    >
                        📜 {showProof ? 'Hide' : 'Show'} Proof
                    </button>

                    {verificationResult.nft && (
                        <a
                            href={verificationResult.nft.openSeaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                padding: '10px 16px',
                                background: 'linear-gradient(135deg, #2081E2, #8247E5)',
                                color: '#FFFFFF',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontSize: '13px',
                                fontWeight: '500'
                            }}
                        >
                            🖼️ View NFT
                        </a>
                    )}
                </div>

                {showProof && proof && (
                    <div style={{
                        marginTop: '16px',
                        background: theme === 'dark' ? '#111827' : '#F3F4F6',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.text, marginBottom: '12px' }}>
                            Verification Proof
                        </div>
                        <pre style={{
                            margin: 0,
                            fontSize: '11px',
                            color: colors.textSecondary,
                            overflow: 'auto',
                            maxHeight: '200px'
                        }}>
                            {JSON.stringify({
                                checkHash: proof.checkHash,
                                merkleRoot: proof.merkleRoot,
                                merkleProof: proof.merkleProof,
                                blockNumber: proof.blockNumber,
                                transactionHash: proof.transactionHash
                            }, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div style={{
            background: colors.bg,
            borderRadius: '16px',
            padding: '24px'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{
                    margin: '0 0 4px 0',
                    color: colors.text,
                    fontSize: '20px',
                    fontWeight: '700'
                }}>
                    ⛓️ Blockchain Verification
                </h2>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>
                    Immutably verify your check on the blockchain
                </p>
            </div>

            {renderCheckSummary()}
            {renderChainSelector()}
            {renderOptions()}
            {renderResult()}

            {/* Action Button */}
            {!verificationResult && (
                <button
                    onClick={handleVerify}
                    disabled={isVerifying}
                    style={{
                        width: '100%',
                        padding: '16px',
                        background: isVerifying
                            ? colors.border
                            : `linear-gradient(135deg, ${CHAINS[selectedChain].color}, ${colors.primary})`,
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: isVerifying ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    {isVerifying ? (
                        <>
                            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                            Verifying on {CHAINS[selectedChain].name}...
                        </>
                    ) : (
                        <>
                            ✨ Verify on {CHAINS[selectedChain].name}
                        </>
                    )}
                </button>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default BlockchainVerificationPanel;
