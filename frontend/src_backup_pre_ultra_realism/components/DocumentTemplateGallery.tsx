/**
 * DocumentTemplateGallery - UI for browsing and using global document templates
 */

import React, { useState, useCallback, useMemo } from 'react';

type DocCategory = 'passport' | 'drivers_license' | 'national_id' | 'ssn_card' | 'birth_certificate' | 'visa' | 'tax_document' | 'bank_statement' | 'pay_stub';

interface Template {
    id: string;
    name: string;
    category: DocCategory;
    country: string;
    countryCode: string;
    region?: string;
    downloads: number;
    rating: number;
    isOfficial: boolean;
    uploadedBy?: string;
}

interface DocumentTemplateGalleryProps {
    onSelectTemplate?: (template: Template) => void;
    onUploadDocument?: (file: File, metadata: any) => void;
    theme?: 'light' | 'dark';
}

const CATEGORIES = [
    { id: 'passport', name: 'Passports', icon: '🛂' },
    { id: 'drivers_license', name: "Driver's Licenses", icon: '🪪' },
    { id: 'national_id', name: 'National IDs', icon: '🆔' },
    { id: 'ssn_card', name: 'SSN / Tax IDs', icon: '📋' },
    { id: 'birth_certificate', name: 'Birth Certificates', icon: '📜' },
    { id: 'visa', name: 'Visas', icon: '✈️' },
    { id: 'tax_document', name: 'Tax Documents', icon: '📑' },
    { id: 'bank_statement', name: 'Bank Statements', icon: '🏦' },
    { id: 'pay_stub', name: 'Pay Stubs', icon: '💰' }
];

const COUNTRIES = [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'NO', name: 'Norway', flag: '🇳🇴' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'PL', name: 'Poland', flag: '🇵🇱' }
];

const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming', 'District of Columbia'
];

// Generate templates dynamically
function generateTemplates(): Template[] {
    const templates: Template[] = [];
    let id = 1;

    // Passports for all countries
    COUNTRIES.forEach(country => {
        templates.push({
            id: `passport_${country.code.toLowerCase()}`,
            name: `${country.name} Passport`,
            category: 'passport',
            country: country.name,
            countryCode: country.code,
            downloads: Math.floor(Math.random() * 5000) + 500,
            rating: 4.5 + Math.random() * 0.5,
            isOfficial: true
        });
    });

    // US Driver's Licenses for all states
    US_STATES.forEach(state => {
        templates.push({
            id: `dl_${state.toLowerCase().replace(/\s/g, '_')}`,
            name: `${state} Driver's License`,
            category: 'drivers_license',
            country: 'United States',
            countryCode: 'US',
            region: state,
            downloads: Math.floor(Math.random() * 3000) + 200,
            rating: 4.5 + Math.random() * 0.5,
            isOfficial: true
        });
    });

    // National IDs for countries
    COUNTRIES.forEach(country => {
        templates.push({
            id: `national_id_${country.code.toLowerCase()}`,
            name: `${country.name} National ID`,
            category: 'national_id',
            country: country.name,
            countryCode: country.code,
            downloads: Math.floor(Math.random() * 2000) + 100,
            rating: 4.3 + Math.random() * 0.7,
            isOfficial: true
        });
    });

    // SSN Card (US only)
    templates.push({
        id: 'ssn_card_us',
        name: 'Social Security Card',
        category: 'ssn_card',
        country: 'United States',
        countryCode: 'US',
        downloads: 8500,
        rating: 4.9,
        isOfficial: true
    });

    return templates;
}

const ALL_TEMPLATES = generateTemplates();

export const DocumentTemplateGallery: React.FC<DocumentTemplateGalleryProps> = ({
    onSelectTemplate,
    onUploadDocument,
    theme = 'light'
}) => {
    const [selectedCategory, setSelectedCategory] = useState<DocCategory | 'all'>('all');
    const [selectedCountry, setSelectedCountry] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'browse' | 'upload' | 'my_templates'>('browse');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadMetadata, setUploadMetadata] = useState({ name: '', category: 'passport' as DocCategory, country: '', description: '', isPublic: true });

    const colors = {
        bg: theme === 'dark' ? '#111827' : '#F9FAFB',
        card: theme === 'dark' ? '#1F2937' : '#FFFFFF',
        text: theme === 'dark' ? '#FFFFFF' : '#111827',
        textSecondary: theme === 'dark' ? '#9CA3AF' : '#6B7280',
        border: theme === 'dark' ? '#374151' : '#E5E7EB',
        primary: '#3B82F6',
        success: '#10B981'
    };

    const filteredTemplates = useMemo(() => {
        return ALL_TEMPLATES.filter(t => {
            if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
            if (selectedCountry !== 'all' && t.countryCode !== selectedCountry) return false;
            if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            return true;
        }).sort((a, b) => b.downloads - a.downloads);
    }, [selectedCategory, selectedCountry, searchQuery]);

    const handleUpload = useCallback(() => {
        if (uploadFile && uploadMetadata.name && uploadMetadata.country) {
            onUploadDocument?.(uploadFile, uploadMetadata);
            setUploadFile(null);
            setUploadMetadata({ name: '', category: 'passport', country: '', description: '', isPublic: true });
            alert('Template uploaded successfully!');
        }
    }, [uploadFile, uploadMetadata, onUploadDocument]);

    return (
        <div style={{ background: colors.bg, borderRadius: '16px', padding: '24px', minHeight: '600px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 4px', color: colors.text, fontSize: '22px', fontWeight: '700' }}>
                    🌍 Global Document Templates
                </h2>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '14px' }}>
                    Browse {ALL_TEMPLATES.length}+ templates from {COUNTRIES.length}+ countries
                </p>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {(['browse', 'upload', 'my_templates'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                        padding: '10px 20px',
                        background: activeTab === tab ? colors.primary : 'transparent',
                        color: activeTab === tab ? '#FFF' : colors.textSecondary,
                        border: `1px solid ${activeTab === tab ? colors.primary : colors.border}`,
                        borderRadius: '8px', cursor: 'pointer', fontWeight: '500', textTransform: 'capitalize'
                    }}>
                        {tab === 'browse' && '🔍 '}{tab === 'upload' && '📤 '}{tab === 'my_templates' && '📁 '}
                        {tab.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {activeTab === 'browse' && (
                <>
                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as any)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, minWidth: '180px' }}>
                            <option value="all">All Categories</option>
                            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                        </select>
                        <select value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, minWidth: '180px' }}>
                            <option value="all">All Countries</option>
                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                        </select>
                        <input type="text" placeholder="Search templates..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.card, color: colors.text, flex: 1, minWidth: '200px' }} />
                    </div>

                    {/* Category Quick Select */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {CATEGORIES.slice(0, 6).map(c => (
                            <button key={c.id} onClick={() => setSelectedCategory(c.id as DocCategory)}
                                style={{
                                    padding: '8px 16px', borderRadius: '20px', cursor: 'pointer',
                                    background: selectedCategory === c.id ? colors.primary : colors.card,
                                    color: selectedCategory === c.id ? '#FFF' : colors.text,
                                    border: `1px solid ${selectedCategory === c.id ? colors.primary : colors.border}`,
                                    fontSize: '13px', fontWeight: '500'
                                }}>
                                {c.icon} {c.name}
                            </button>
                        ))}
                    </div>

                    {/* Results count */}
                    <div style={{ marginBottom: '16px', color: colors.textSecondary, fontSize: '13px' }}>
                        Showing {filteredTemplates.length} templates
                    </div>

                    {/* Template Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {filteredTemplates.slice(0, 50).map(template => (
                            <div key={template.id} onClick={() => onSelectTemplate?.(template)}
                                style={{
                                    background: colors.card, borderRadius: '12px', padding: '16px',
                                    border: `1px solid ${colors.border}`, cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ fontSize: '32px' }}>
                                        {template.category === 'passport' ? '🛂' : template.category === 'drivers_license' ? '🪪' : template.category === 'national_id' ? '🆔' : '📋'}
                                    </div>
                                    {template.isOfficial && (
                                        <span style={{ padding: '4px 8px', background: `${colors.success}20`, color: colors.success, borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>
                                            ✓ OFFICIAL
                                        </span>
                                    )}
                                </div>
                                <h3 style={{ margin: '0 0 4px', color: colors.text, fontSize: '15px', fontWeight: '600' }}>{template.name}</h3>
                                <p style={{ margin: '0 0 12px', color: colors.textSecondary, fontSize: '12px' }}>
                                    {COUNTRIES.find(c => c.code === template.countryCode)?.flag} {template.country}
                                    {template.region && ` • ${template.region}`}
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: colors.textSecondary, fontSize: '12px' }}>
                                        ⬇️ {template.downloads.toLocaleString()}
                                    </span>
                                    <span style={{ color: '#F59E0B', fontSize: '12px' }}>
                                        ⭐ {template.rating.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {activeTab === 'upload' && (
                <div style={{ background: colors.card, borderRadius: '12px', padding: '24px', border: `1px solid ${colors.border}` }}>
                    <h3 style={{ margin: '0 0 20px', color: colors.text }}>📤 Upload & Share Template</h3>

                    {/* File Upload */}
                    <div onClick={() => document.getElementById('template-file-input')?.click()}
                        style={{ border: `2px dashed ${colors.border}`, borderRadius: '12px', padding: '40px', textAlign: 'center', cursor: 'pointer', marginBottom: '20px' }}>
                        <input id="template-file-input" type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }}
                            onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                        <div style={{ fontSize: '40px', marginBottom: '12px' }}>{uploadFile ? '✅' : '📄'}</div>
                        <div style={{ color: colors.text, fontWeight: '500' }}>{uploadFile ? uploadFile.name : 'Drop document here or click to upload'}</div>
                        <div style={{ color: colors.textSecondary, fontSize: '12px', marginTop: '8px' }}>Upload any ID, passport, or document to create a reusable template</div>
                    </div>

                    {/* Metadata Form */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', color: colors.text, fontSize: '13px', marginBottom: '6px' }}>Template Name *</label>
                            <input type="text" value={uploadMetadata.name} onChange={e => setUploadMetadata({ ...uploadMetadata, name: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: colors.text, fontSize: '13px', marginBottom: '6px' }}>Category *</label>
                            <select value={uploadMetadata.category} onChange={e => setUploadMetadata({ ...uploadMetadata, category: e.target.value as DocCategory })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text }}>
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: colors.text, fontSize: '13px', marginBottom: '6px' }}>Country *</label>
                            <select value={uploadMetadata.country} onChange={e => setUploadMetadata({ ...uploadMetadata, country: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text }}>
                                <option value="">Select country...</option>
                                {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', color: colors.text, fontSize: '13px', marginBottom: '6px' }}>Visibility</label>
                            <select value={uploadMetadata.isPublic ? 'public' : 'private'} onChange={e => setUploadMetadata({ ...uploadMetadata, isPublic: e.target.value === 'public' })}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text }}>
                                <option value="public">🌍 Public - Share with community</option>
                                <option value="private">🔒 Private - Only for me</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: colors.text, fontSize: '13px', marginBottom: '6px' }}>Description</label>
                        <textarea value={uploadMetadata.description} onChange={e => setUploadMetadata({ ...uploadMetadata, description: e.target.value })} rows={3}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: colors.bg, color: colors.text, resize: 'vertical' }} />
                    </div>

                    <button onClick={handleUpload} disabled={!uploadFile || !uploadMetadata.name || !uploadMetadata.country}
                        style={{
                            width: '100%', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                            background: uploadFile && uploadMetadata.name && uploadMetadata.country ? colors.primary : colors.border,
                            color: '#FFF'
                        }}>
                        📤 Upload Template
                    </button>
                </div>
            )}

            {activeTab === 'my_templates' && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textSecondary }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📁</div>
                    <h3 style={{ color: colors.text, marginBottom: '8px' }}>Your Templates</h3>
                    <p>Templates you've created or downloaded will appear here</p>
                </div>
            )}
        </div>
    );
};

export default DocumentTemplateGallery;
