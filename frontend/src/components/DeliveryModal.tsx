import React, { useState } from 'react';

export interface CheckDeliveryOptions {
    email?: string;
    mail?: { address: string; city: string; state: string; zip: string };
    directDeposit?: { routingNumber: string; accountNumber: string };
    sms?: string;
    fax?: string;
}

interface DeliveryMethod {
    id: string;
    name: string;
    icon: string;
    description: string;
    cost: number;
    time: string;
}

interface DeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeliver: (method: string, options: CheckDeliveryOptions) => void;
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ isOpen, onClose, onDeliver }) => {
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
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>📤 Delivery Options</h2>
                        <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '13px' }}>Choose how to send your document</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '24px', cursor: 'pointer' }}>×</button>
                </div>

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

export default DeliveryModal;
