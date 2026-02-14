import React, { useEffect, useState } from 'react';

interface Verification {
    id: number;
    user_id: string;
    method: string;
    status: string;
    created_at: string;
}

interface ACHBatch {
    id: number;
    batch_id: string;
    status: string;
    total_amount: number;
    entry_count: number;
    created_at: string;
}

interface SystemStats {
    kyc_total: number;
    ach_volume_total: number;
    server_time: string;
}

const AdminDashboard: React.FC = () => {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [achBatches, setAchBatches] = useState<ACHBatch[]>([]);
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [resVerifications, resBatches, resStats] = await Promise.all([
                    fetch('http://localhost:3001/api/admin/verifications', { headers }),
                    fetch('http://localhost:3001/api/admin/ach-batches', { headers }),
                    fetch('http://localhost:3001/api/admin/stats', { headers })
                ]);

                const verificationsData = await resVerifications.json();
                const batchesData = await resBatches.json();
                const statsData = await resStats.json();

                setVerifications(Array.isArray(verificationsData) ? verificationsData : []);
                setAchBatches(Array.isArray(batchesData) ? batchesData : []);
                setStats(statsData);
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div style={{ padding: '20px', color: '#fff' }}>Loading Admin Dashboard...</div>;

    return (
        <div style={{ padding: '40px', backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#e0e0e0', fontFamily: 'Inter, sans-serif' }}>
            <h1 style={{ borderBottom: '1px solid #333', paddingBottom: '20px', marginBottom: '30px' }}>Admin Mission Control</h1>

            {/* System Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <div style={cardStyle}>
                    <h3 style={labelStyle}>Total Verified Users</h3>
                    <div style={valueStyle}>{stats?.kyc_total || 0}</div>
                </div>
                <div style={cardStyle}>
                    <h3 style={labelStyle}>Total ACH Volume</h3>
                    <div style={valueStyle}>${stats?.ach_volume_total?.toLocaleString() || '0.00'}</div>
                </div>
                <div style={cardStyle}>
                    <h3 style={labelStyle}>Server Time</h3>
                    <div style={timeStyle}>{new Date(stats?.server_time || '').toLocaleString()}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>

                {/* KYC Queue */}
                <div>
                    <h2 style={{ marginBottom: '15px', color: '#fff', borderLeft: '4px solid #4a90e2', paddingLeft: '10px' }}>Identity Verification Queue</h2>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                <th style={thStyle}>User ID</th>
                                <th style={thStyle}>Method</th>
                                <th style={thStyle}>Status</th>
                                <th style={thStyle}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {verifications.map((v) => (
                                <tr key={v.id} style={trStyle}>
                                    <td style={tdStyle}>{v.user_id}</td>
                                    <td style={tdStyle}>{v.method}</td>
                                    <td style={tdStyle}>
                                        <span style={getStatusStyle(v.status)}>{v.status}</span>
                                    </td>
                                    <td style={tdStyle}>{new Date(v.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ACH Batches */}
                <div>
                    <h2 style={{ marginBottom: '15px', color: '#fff', borderLeft: '4px solid #f5a623', paddingLeft: '10px' }}>ACH Batches</h2>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #444' }}>
                                <th style={thStyle}>Batch ID</th>
                                <th style={thStyle}>Amount</th>
                                <th style={thStyle}>Items</th>
                                <th style={thStyle}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {achBatches.map((b) => (
                                <tr key={b.id} style={trStyle}>
                                    <td style={tdStyle}>{b.batch_id.substring(0, 12)}...</td>
                                    <td style={tdStyle}>${b.total_amount.toLocaleString()}</td>
                                    <td style={tdStyle}>{b.entry_count}</td>
                                    <td style={tdStyle}>
                                        <span style={getStatusStyle(b.status)}>{b.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Styles
const cardStyle: React.CSSProperties = {
    backgroundColor: '#2a2a2a',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
};

const labelStyle: React.CSSProperties = {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

const valueStyle: React.CSSProperties = {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#fff'
};

const timeStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#4a90e2',
    marginTop: '10px'
};

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#252525',
    borderRadius: '8px',
    overflow: 'hidden'
};

const thStyle: React.CSSProperties = {
    padding: '12px 15px',
    color: '#aaa',
    fontSize: '13px',
    fontWeight: 'normal',
    borderBottom: '1px solid #333'
};

const tdStyle: React.CSSProperties = {
    padding: '12px 15px',
    color: '#ddd',
    fontSize: '14px',
    borderBottom: '1px solid #333'
};

const trStyle: React.CSSProperties = {
    transition: 'background-color 0.2s',
};

const getStatusStyle = (status: string): React.CSSProperties => {
    const base: React.CSSProperties = {
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: 'bold'
    };

    switch (status) {
        case 'VERIFIED':
        case 'PROCESSED':
            return { ...base, backgroundColor: '#1b4d3e', color: '#4caf50' };
        case 'PENDING':
            return { ...base, backgroundColor: '#4d3b1b', color: '#ffc107' };
        case 'REJECTED':
        case 'FAILED':
        case 'ERROR':
            return { ...base, backgroundColor: '#4d1b1b', color: '#ff5252' };
        default:
            return { ...base, backgroundColor: '#333', color: '#aaa' };
    }
};

export default AdminDashboard;
