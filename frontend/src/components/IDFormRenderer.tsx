import React from 'react';
import { BorderlineEngine, BorderConfig } from './BorderlineEngine';

interface IDFieldCoord {
    x: number;
    y: number;
    width: number;
    fontSize?: number;
    fontWeight?: string;
    align?: 'left' | 'center' | 'right';
    color?: string;
    fontFamily?: string;
    letterSpacing?: number;
}

interface IDFormRendererProps {
    type: 'DL' | 'PASSPORT' | 'SSN';
    data: Record<string, string>;
    scale?: number;
    borderConfig?: BorderConfig;
}

const DL_COORDS: Record<string, IDFieldCoord> = {
    'lastName': { x: 140, y: 92, width: 200, fontSize: 13, fontWeight: 'bold', color: '#000' },
    'firstName': { x: 140, y: 117, width: 200, fontSize: 13, fontWeight: 'bold', color: '#000' },
    'address': { x: 140, y: 142, width: 240, fontSize: 11, color: '#444' }, // Multiline support simulated
    'dob': { x: 260, y: 200, width: 80, fontSize: 12, fontWeight: 'bold', color: '#c00' },
    'sex': { x: 170, y: 230, width: 30, fontSize: 11, color: '#000' },
    'height': { x: 220, y: 230, width: 40, fontSize: 11, color: '#000' },
    'eyes': { x: 270, y: 230, width: 40, fontSize: 11, color: '#000' },
    'issued': { x: 140, y: 260, width: 100, fontSize: 11, color: '#000' },
    'expires': { x: 280, y: 260, width: 100, fontSize: 12, fontWeight: 'bold', color: '#c00' },
    'dlNumber': { x: 140, y: 70, width: 150, fontSize: 16, fontWeight: 'bold', color: '#003366' },
};

const SSN_COORDS: Record<string, IDFieldCoord> = {
    'name': { x: 240, y: 180, width: 300, fontSize: 16, align: 'center', fontFamily: 'Courier New', color: '#000', fontWeight: 'bold' },
    'ssn': { x: 240, y: 140, width: 300, fontSize: 24, align: 'center', fontWeight: 'bold', fontFamily: 'Courier New', color: '#000', letterSpacing: 2 },
    'signature': { x: 240, y: 215, width: 300, fontSize: 18, align: 'center', fontFamily: 'Cursive', color: '#000080' },
};

const PASSPORT_COORDS: Record<string, IDFieldCoord> = {
    'surname': { x: 135, y: 92, width: 200, fontSize: 11, fontWeight: 'bold' },
    'givenNames': { x: 135, y: 117, width: 200, fontSize: 11, fontWeight: 'bold' },
    'nationality': { x: 135, y: 142, width: 100, fontSize: 10 },
    'dob': { x: 260, y: 142, width: 100, fontSize: 10 },
    'sex': { x: 220, y: 230, width: 50, fontSize: 1, color: 'transparent' }, // Hidden in new layout? Or move to right
    'placeOfBirth': { x: 135, y: 192, width: 150, fontSize: 10 },

    'issued': { x: 260, y: 167, width: 100, fontSize: 10 },
    'expires': { x: 360, y: 167, width: 100, fontSize: 10, fontWeight: 'bold' },

    'passportNumber': { x: 410, y: 90, width: 90, fontSize: 12, fontWeight: 'bold', align: 'center' },
};

const IDFormRenderer: React.FC<IDFormRendererProps> = ({ type, data, scale = 1, borderConfig }) => {
    // CR-80 Dimensions (approx 3.375" x 2.125") -> 480 x 300 px
    const width = 480;
    const height = 300;

    const renderField = (name: string, value: string, coords: IDFieldCoord) => {
        const textX = coords.align === 'right' ? coords.x + coords.width : coords.align === 'center' ? coords.x + coords.width / 2 : coords.x;
        return (
            <text
                key={name}
                x={textX}
                y={coords.y}
                fontSize={coords.fontSize || 12}
                fontWeight={coords.fontWeight || 'normal'}
                textAnchor={coords.align === 'right' ? 'end' : coords.align === 'center' ? 'middle' : 'start'}
                fill={coords.color || "#000"}
                fontFamily={coords.fontFamily || "Arial, sans-serif"}
                letterSpacing={coords.letterSpacing}
            >
                {value}
            </text>
        );
    };

    return (
        <div style={{ overflow: 'hidden', border: '1px solid #ccc', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backgroundColor: '#fff', width: width * scale, height: height * scale }}>
            <svg
                width={width * scale}
                height={height * scale}
                viewBox={`0 0 ${width} ${height}`}
                style={{ display: 'block' }}
            >
                {borderConfig && <BorderlineEngine width={width} height={height} config={borderConfig} />}
                {/* Driver's License (California Style Real ID) */}
                {type === 'DL' && (
                    <>
                        {/* Background with Guilloche & Bear Watermark */}
                        <defs>
                            <pattern id="guilloche" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M0,10 Q10,0 20,10 T40,10" fill="none" stroke="#e0f7fa" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width={width} height={height} fill="#f9f9f9" rx="10" />
                        <rect width={width} height={height} fill="url(#guilloche)" opacity="0.6" />

                        {/* Bear Overlay (Right Side) */}
                        <path d="M300,100 Q350,50 400,100 T480,150 L480,250 L300,250 Z" fill="#f4d03f" opacity="0.2" />

                        {/* Top Header Bar */}
                        <rect x="0" y="0" width={width} height="60" fill="none" />
                        {/* Note: CA DL actually has a white header with blue text, usually. Let's do the modern layout. */}

                        {/* State Name */}
                        <text x="20" y="45" fontSize="28" fontWeight="bold" fill="#003366" fontFamily="Brush Script MT, cursive">California</text>
                        <text x="240" y="30" fontSize="10" fill="#003366" fontWeight="bold">USA</text>
                        <text x="360" y="45" fontSize="16" fill="#003366" fontWeight="bold">DRIVER LICENSE</text>

                        {/* Real-ID Bear & Star */}
                        <circle cx="450" cy="30" r="14" fill="none" stroke="#000" strokeWidth="1" />
                        <path d="M440,30 L460,30" stroke="#f4d03f" strokeWidth="10" />
                        <text x="450" y="34" fontSize="12" fill="#fff" textAnchor="middle" fontWeight="bold">★</text>

                        {/* Photo Box */}
                        <rect x="20" y="70" width="110" height="140" fill="#e0e0e0" stroke="#ccc" />
                        <text x="75" y="150" fontSize="40" fill="#999" textAnchor="middle">👤</text>

                        {/* Ghost Portrait (Right Side) */}
                        <circle cx="420" cy="200" r="30" fill="#e0e0e0" opacity="0.5" />

                        {/* Data Fields Labels (Blue) */}
                        <text x="140" y="80" fontSize="9" fill="#003366" fontWeight="bold">DL</text>
                        <text x="140" y="105" fontSize="8" fill="#003366" fontWeight="bold">LN</text>
                        <text x="140" y="130" fontSize="8" fill="#003366" fontWeight="bold">FN</text>
                        <text x="140" y="155" fontSize="8" fill="#003366" fontWeight="bold">ADR</text>

                        <text x="260" y="210" fontSize="8" fill="#003366" fontWeight="bold">DOB</text>
                        <text x="170" y="240" fontSize="8" fill="#003366" fontWeight="bold">SEX</text>
                        <text x="220" y="240" fontSize="8" fill="#003366" fontWeight="bold">HGT</text>
                        <text x="270" y="240" fontSize="8" fill="#003366" fontWeight="bold">EYES</text>

                        <text x="140" y="270" fontSize="8" fill="#003366" fontWeight="bold">ISS</text>
                        <text x="280" y="270" fontSize="8" fill="#c00" fontWeight="bold">EXP</text>

                        {/* AAMVA Barcode Placeholder */}
                        <rect x="20" y="280" width="440" height="4" fill="#000" opacity="0.1" />
                    </>
                )}

                {/* Passport Card (Authentic Gen 2) */}
                {type === 'PASSPORT' && (
                    <>
                        <rect width={width} height={height} fill="#eef2ff" rx="10" />

                        {/* Background Eagle */}
                        <path d="M200,80 Q250,50 300,80 T400,120 L300,200 L200,150 Z" fill="#b0c4de" opacity="0.3" />

                        {/* Header Bar */}
                        <rect x="0" y="0" width={width} height="45" fill="#002868" />
                        <text x="15" y="28" fontSize="15" fontWeight="bold" fill="#fff" letterSpacing="1">UNITED STATES OF AMERICA</text>
                        <circle cx="440" cy="22" r="15" fill="none" stroke="#fff" strokeWidth="2" />
                        <text x="440" y="26" fontSize="10" fill="#fff" textAnchor="middle" fontWeight="bold">USA</text>

                        {/* Subheader */}
                        <rect x="0" y="45" width={width} height="15" fill="#bf0a30" />
                        <text x="470" y="56" fontSize="10" fill="#fff" fontWeight="bold" textAnchor="end">PASSPORT CARD</text>

                        {/* Photo */}
                        <rect x="15" y="70" width="105" height="135" fill="#ddd" stroke="#999" rx="4" />
                        <text x="67" y="140" fontSize="40" fill="#999" textAnchor="middle">👤</text>

                        {/* Data Fields */}
                        <text x="135" y="80" fontSize="7" fill="#666">Surname / Nom</text>
                        <text x="135" y="105" fontSize="7" fill="#666">Given Names / Prénoms</text>
                        <text x="135" y="130" fontSize="7" fill="#666">Nationality / Nationalité</text>
                        <text x="260" y="130" fontSize="7" fill="#666">Date of Birth / Date de naissance</text>

                        <text x="135" y="180" fontSize="7" fill="#666">Place of Birth / Lieu de naissance</text>

                        <text x="260" y="155" fontSize="7" fill="#666">Issue Date / Date de délivrance</text>
                        <text x="360" y="155" fontSize="7" fill="#666">Expiration Date / Date d'expiration</text>

                        {/* Card Number Container */}
                        <rect x="360" y="75" width="100" height="20" fill="#fff" stroke="#ccc" />
                        <text x="410" y="70" fontSize="7" fill="#666" textAnchor="middle">Passport Card No.</text>

                        {/* MRZ Zone Background */}
                        <rect x="0" y="240" width={width} height="60" fill="#fff" />

                        {/* MRZ Text Placeholder (Dynamic content will render over this) */}
                    </>
                )}

                {/* SSN Card (Authentic Style) */}
                {type === 'SSN' && (
                    <>
                        <rect width={width} height={height} fill="#fff" rx="8" />

                        {/* Border & Background */}
                        <rect x="15" y="15" width={width - 30} height={height - 30} fill="none" stroke="#eebbc3" strokeWidth="1" opacity="0.5" />
                        <rect x="20" y="20" width={width - 40} height={height - 40} fill="none" stroke="#89a" strokeWidth="2" opacity="0.3" />

                        {/* Left Pillar */}
                        <path d="M40,40 L60,40 L60,260 L40,260 Z" fill="#b0c4de" opacity="0.4" />
                        <path d="M35,35 L65,35 L65,45 L35,45 Z" fill="#8fa1b9" />
                        <path d="M35,255 L65,255 L65,265 L35,265 Z" fill="#8fa1b9" />

                        {/* Right Pillar */}
                        <path d="M420,40 L440,40 L440,260 L420,260 Z" fill="#b0c4de" opacity="0.4" />
                        <path d="M415,35 L445,35 L445,45 L415,45 Z" fill="#8fa1b9" />
                        <path d="M415,255 L445,255 L445,265 L415,265 Z" fill="#8fa1b9" />

                        {/* Center Seal (Simplified Vector) */}
                        <circle cx="240" cy="150" r="50" fill="none" stroke="#e0e0e0" strokeWidth="4" />
                        <path d="M240,110 L250,140 L280,140 L260,160 L270,190 L240,170 L210,190 L220,160 L200,140 L230,140 Z" fill="#f0f0f0" stroke="#d0d0d0" />

                        {/* Header */}
                        <text x="240" y="55" fontSize="22" fill="#2c3e50" textAnchor="middle" fontWeight="bold" letterSpacing="2">SOCIAL SECURITY</text>

                        {/* Labels */}
                        <text x="240" y="240" fontSize="10" fill="#2c3e50" textAnchor="middle" letterSpacing="1">THIS NUMBER HAS BEEN ESTABLISHED FOR</text>

                        {/* Security Pattern Overlay */}
                        <rect width={width} height={height} fill="url(#guilloche)" opacity="0.1" />
                    </>
                )}

                {/* Render Fields */}
                {Object.entries(data).map(([key, val]) => {
                    let coordMap = DL_COORDS;
                    if (type === 'PASSPORT') coordMap = PASSPORT_COORDS;
                    if (type === 'SSN') coordMap = SSN_COORDS;

                    const coords = coordMap[key];
                    return coords ? renderField(key, val, coords) : null;
                })}
            </svg>
        </div>
    );
};

export default IDFormRenderer;
