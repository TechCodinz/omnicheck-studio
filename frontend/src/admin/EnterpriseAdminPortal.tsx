
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLicense } from '../contexts/LicenseContext';
import { AdvancedDocumentAnalytics } from '../../../backend/analytics/DocumentAnalytics';
import { EnterpriseSecurityEngine } from '../../../backend/security/EnterpriseSecurity';
import RealAdminDashboard from '../components/AdminDashboard';

// Mock Admin Engine
class AdminEngine {
    async getRealTimeData(): Promise<RealTimeData> {
        return {
            activeUsers: 142,
            documentsProcessed: 893,
            revenue: 12500,
            systemHealth: 98,
            recentActivities: [
                { user: 'Admin', action: 'Login', time: '2m ago', icon: '👤' },
                { user: 'System', action: 'Backup', time: '15m ago', icon: '💾' }
            ],
            alerts: [
                { title: 'High Load', message: 'CPU usage > 80%', time: '5m ago', severity: 'warning', icon: '⚠️' }
            ]
        };
    }
}

interface RealTimeData {
    activeUsers: number;
    documentsProcessed: number;
    revenue: number;
    systemHealth: number;
    recentActivities: any[];
    alerts: any[];
}

const StatCard: React.FC<{ title: string; value: string | number; change: string; icon: string }> = ({ title, value, change, icon }) => (
    <div className="stat-card" style={{ background: 'white', padding: '1rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div className="stat-icon" style={{ fontSize: '2rem' }}>{icon}</div>
        <div className="stat-info">
            <h3>{value}</h3>
            <p>{title}</p>
            <small style={{ color: 'green' }}>{change}</small>
        </div>
    </div>
);

const UserManagement = () => (
    <div className="user-management" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2>User Management</h2>
            <button style={{ padding: '8px 16px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Enterprise User</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {[
                    { name: 'John Doe', email: 'john@enterprise.com', role: 'Global Admin', status: 'Active', last: '2h ago' },
                    { name: 'Sarah Smith', email: 'sarah@enterprise.com', role: 'Security Officer', status: 'Active', last: '5m ago' },
                    { name: 'Mike Ross', email: 'mike@enterprise.com', role: 'Auditor', status: 'Pending', last: 'N/A' }
                ].map((user, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                        <td style={{ padding: '10px' }}>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span style={{ padding: '4px 8px', background: '#e1f5fe', borderRadius: '4px', fontSize: '0.8rem' }}>{user.role}</span></td>
                        <td><span style={{ color: user.status === 'Active' ? 'green' : 'orange' }}>● {user.status}</span></td>
                        <td>{user.last}</td>
                        <td><button style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' }}>Edit</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const DocumentManagement = () => (
    <div className="document-management" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px' }}>
        <h2>Global Document Manifest</h2>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '10px' }}>
            <input type="text" placeholder="Search by Document ID, Hash or Author..." style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
            <select style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                <option>All Types</option>
                <option>ID Documents</option>
                <option>Invoices</option>
                <option>Contracts</option>
            </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {[
                { id: 'DOC-9021', type: 'Passport', author: 'User_44', status: 'Verified', date: '2024-02-01' },
                { id: 'DOC-9022', type: 'Invoice', author: 'System_Auto', status: 'Pending', date: '2024-02-01' },
                { id: 'DOC-9023', type: 'Contract', author: 'User_12', status: 'Flagged', date: '2024-01-31' }
            ].map((doc, i) => (
                <div key={i} style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{doc.id}</strong>
                        <span style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: doc.status === 'Verified' ? '#c8e6c9' : doc.status === 'Flagged' ? '#ffccbc' : '#fff9c4'
                        }}>{doc.status}</span>
                    </div>
                    <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>Type: {doc.type}</p>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        <span>Prop: {doc.author}</span><br />
                        <span>Created: {doc.date}</span>
                    </div>
                    <button style={{ marginTop: '10px', width: '100%', padding: '6px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>View Details</button>
                </div>
            ))}
        </div>
    </div>
);
const AnalyticsDashboard = () => <div>Analytics Dashboard Content</div>;
const SecurityManagement = () => <div>Security Management Content</div>;
const BillingManagement = () => <div>Billing Management Content</div>;

const EnterpriseAdminPortal: React.FC = () => {
    const { isEnterprise, validateAdminPassword, activatePlan } = useLicense(); // Use context
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(isEnterprise);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateAdminPassword(password)) {
            activatePlan('enterprise', 'ADMIN_LOGIN_SUCCESS');
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('❌ Access Denied: Invalid Credentials');
            setPassword('');
        }
    };

    const [activeSection, setActiveSection] = useState<'dashboard' | 'users' | 'documents' | 'analytics' | 'security' | 'billing'>('dashboard');
    const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);

    // Mock engines
    const adminEngine = new AdminEngine();

    useEffect(() => {
        if (!isAuthenticated) return;
        const loadData = async () => {
            const data = await adminEngine.getRealTimeData();
            setRealTimeData(data);
        };
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated]);

    // LOGIN SCREEN
    if (!isAuthenticated) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                color: 'white',
                fontFamily: 'Inter, sans-serif'
            }}>
                <form onSubmit={handleLogin} style={{
                    width: '350px',
                    padding: '40px',
                    background: '#1e293b',
                    borderRadius: '16px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔐</div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Admin Portal Access</h2>
                        <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '13px' }}>Enterprise authorization required</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>SECURE PASSPHRASE</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            style={{
                                padding: '12px',
                                background: '#0f172a',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none',
                                fontSize: '14px'
                            }}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '12px', borderRadius: '6px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" style={{
                        padding: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        marginTop: '10px'
                    }}>
                        Unlock Console
                    </button>

                    <a href="/" style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', textDecoration: 'none', marginTop: '10px' }}>
                        ← Return to Application
                    </a>
                </form>
            </div>
        );
    }

    return (
        <div className="enterprise-admin-portal" style={{ display: 'flex', height: '100vh' }}>
            {/* Navigation */}
            <div className="admin-nav" style={{ width: '250px', background: '#2c3e50', color: 'white', padding: '1rem' }}>
                <div className="nav-header" style={{ marginBottom: '2rem' }}>
                    <h2>UltraDocs Admin</h2>
                    <p>Enterprise Management Portal</p>
                </div>

                <div className="nav-sections" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {([
                        ['dashboard', '📊 Dashboard'],
                        ['users', '👥 User Management'],
                        ['documents', '📄 Document Management'],
                        ['analytics', '📈 Analytics'],
                        ['security', '🔒 Security'],
                        ['billing', '💰 Billing'],
                        ['settings', '⚙️ Settings']
                    ] as const).map(([key, label]) => (
                        <button
                            key={key}
                            className={`nav-button ${activeSection === key ? 'active' : ''}`}
                            onClick={() => setActiveSection(key as any)}
                            style={{
                                padding: '10px',
                                textAlign: 'left',
                                background: activeSection === key ? '#34495e' : 'transparent',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="admin-content" style={{ flex: 1, padding: '2rem', overflow: 'auto', background: '#ecf0f1' }}>
                {activeSection === 'dashboard' && (
                    <RealAdminDashboard />
                )}

                {activeSection === 'users' && (
                    <UserManagement />
                )}

                {activeSection === 'documents' && (
                    <DocumentManagement />
                )}

                {activeSection === 'analytics' && (
                    <AnalyticsDashboard />
                )}

                {activeSection === 'security' && (
                    <SecurityManagement />
                )}

                {activeSection === 'billing' && (
                    <BillingManagement />
                )}
            </div>
        </div>
    );
};

// End of EnterpriseAdminPortal

export default EnterpriseAdminPortal;
