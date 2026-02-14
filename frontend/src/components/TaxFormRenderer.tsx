import React from 'react';
import { BorderlineEngine, BorderConfig } from './BorderlineEngine';

interface TaxFieldCoord {
    x: number;
    y: number;
    width: number;
    fontSize?: number;
    fontWeight?: string;
    align?: 'left' | 'center' | 'right';
}

interface TaxFormRendererProps {
    type: string;
    data: Record<string, string>;
    scale?: number;
    borderConfig?: BorderConfig;
}

const W2_COORDS: Record<string, TaxFieldCoord> = {
    'employerEIN': { x: 50, y: 125, width: 200, fontSize: 12 },
    'employerName': { x: 50, y: 160, width: 300, fontSize: 11 },
    'employerAddress': { x: 50, y: 180, width: 300, fontSize: 10 },
    'employeeSSN': { x: 450, y: 55, width: 150, fontSize: 13, fontWeight: 'bold' },
    'employeeName': { x: 50, y: 250, width: 300, fontSize: 12 },
    'employeeAddress': { x: 50, y: 270, width: 300, fontSize: 10 },
    'wages': { x: 670, y: 125, width: 100, align: 'right', fontSize: 12, fontWeight: 'bold' },
    'federalTax': { x: 670, y: 160, width: 100, align: 'right', fontSize: 12 },
    'ssWages': { x: 670, y: 195, width: 100, align: 'right', fontSize: 12 },
    'ssTax': { x: 670, y: 230, width: 100, align: 'right', fontSize: 12 },
    'medicareWages': { x: 670, y: 265, width: 100, align: 'right', fontSize: 12 },
    'medicareTax': { x: 670, y: 300, width: 100, align: 'right', fontSize: 12 },
    'taxYear': { x: 740, y: 45, width: 50, fontSize: 24, fontWeight: '900', align: 'center' }
};

const NEC_COORDS: Record<string, TaxFieldCoord> = {
    'payerTIN': { x: 50, y: 220, width: 150, fontSize: 11 },
    'payerName': { x: 50, y: 80, width: 300, fontSize: 11 },
    'payerAddress': { x: 50, y: 100, width: 300, fontSize: 10 },
    'recipientTIN': { x: 220, y: 220, width: 150, fontSize: 11 },
    'recipientName': { x: 50, y: 390, width: 300, fontSize: 12 },
    'recipientAddress': { x: 50, y: 410, width: 300, fontSize: 10 },
    'compensation': { x: 560, y: 75, width: 100, align: 'right', fontSize: 12, fontWeight: 'bold' },
    'federalTax': { x: 560, y: 315, width: 100, align: 'right', fontSize: 12 },
    'taxYear': { x: 700, y: 450, width: 50, fontSize: 24, fontWeight: '900', align: 'center' }
};

const MISC_COORDS: Record<string, TaxFieldCoord> = {
    'payerTIN': { x: 50, y: 220, width: 150, fontSize: 11 },
    'payerName': { x: 50, y: 80, width: 300, fontSize: 11 },
    'recipientTIN': { x: 220, y: 220, width: 150, fontSize: 11 },
    'recipientName': { x: 50, y: 390, width: 300, fontSize: 12 },
    'rents': { x: 560, y: 75, width: 100, align: 'right', fontSize: 12 },
    'royalties': { x: 560, y: 135, width: 100, align: 'right', fontSize: 12 },
    'otherIncome': { x: 560, y: 195, width: 100, align: 'right', fontSize: 12 },
    'federalTax': { x: 560, y: 255, width: 100, align: 'right', fontSize: 12 },
    'taxYear': { x: 700, y: 450, width: 50, fontSize: 24, fontWeight: '900', align: 'center' }
};

// Reuse for INT/DIV/K if structure is similar, or define specific ones
const INT_COORDS: Record<string, TaxFieldCoord> = {
    'payerName': { x: 50, y: 80, width: 300, fontSize: 11 },
    'interestIncome': { x: 560, y: 75, width: 100, align: 'right', fontSize: 12 },
    'earlyWithdrawalPenalty': { x: 560, y: 135, width: 100, align: 'right', fontSize: 12 },
    'federalTax': { x: 560, y: 255, width: 100, align: 'right', fontSize: 12 },
    'taxYear': { x: 720, y: 50, width: 50, fontSize: 24, fontWeight: '900', align: 'center' }
};

const K_COORDS: Record<string, TaxFieldCoord> = {
    'pseName': { x: 50, y: 80, width: 300, fontSize: 11 },
    'grossAmount': { x: 560, y: 75, width: 100, align: 'right', fontSize: 12 },
    'taxYear': { x: 720, y: 50, width: 50, fontSize: 24, fontWeight: '900', align: 'center' }
};

const DIV_COORDS: Record<string, TaxFieldCoord> = {
    'payerName': { x: 50, y: 80, width: 300, fontSize: 11 },
    'ordinaryDividends': { x: 560, y: 75, width: 100, align: 'right', fontSize: 12 },
    'federalTax': { x: 560, y: 255, width: 100, align: 'right', fontSize: 12 },
    'taxYear': { x: 720, y: 50, width: 50, fontSize: 24, fontWeight: '900', align: 'center' }
};

const TAX_1040_COORDS: Record<string, TaxFieldCoord> = {
    'taxpayerName': { x: 50, y: 190, width: 300, fontSize: 12 },
    'taxpayerSSN': { x: 600, y: 90, width: 150, fontSize: 14, fontWeight: 'bold' },
    'address': { x: 50, y: 210, width: 400, fontSize: 11 },
    'totalIncome': { x: 750, y: 280, width: 100, align: 'right', fontSize: 12 },
    'agi': { x: 750, y: 340, width: 100, align: 'right', fontSize: 12 },
    'taxableIncome': { x: 750, y: 370, width: 100, align: 'right', fontSize: 12 },
    'totalTax': { x: 750, y: 400, width: 100, align: 'right', fontSize: 12 },
    'refundOwed': { x: 750, y: 490, width: 100, align: 'right', fontSize: 14, fontWeight: 'bold' },
    'taxYear': { x: 60, y: 95, width: 50, fontSize: 32, fontWeight: '900', align: 'center' }
};

const REFUND_COORDS: Record<string, TaxFieldCoord> = {
    'refundAmount': { x: 425, y: 110, width: 200, fontSize: 32, fontWeight: 'bold', align: 'center' },
    'estimatedDate': { x: 750, y: 110, width: 100, fontSize: 14, align: 'right' },
    'accountNumber': { x: 150, y: 180, width: 200, fontSize: 12 },
    'routingNumber': { x: 150, y: 210, width: 200, fontSize: 12 },
};

const TaxFormRenderer: React.FC<TaxFormRendererProps> = ({ type, data, scale = 1, borderConfig }) => {
    // Basic IRS W-2 Layout simulation via SVG
    const width = 850;
    const height = 550;

    const renderField = (name: string, value: string, coords: TaxFieldCoord) => {
        const textX = coords.align === 'right' ? coords.x + coords.width : coords.align === 'center' ? coords.x + coords.width / 2 : coords.x;

        return (
            <text
                key={name}
                x={textX}
                y={coords.y}
                fontSize={coords.fontSize || 10}
                fontWeight={coords.fontWeight || 'normal'}
                textAnchor={coords.align === 'right' ? 'end' : coords.align === 'center' ? 'middle' : 'start'}
                fill="#000"
                fontFamily="Arial, sans-serif"
            >
                {value}
            </text>
        );
    };

    return (
        <div style={{ overflow: 'hidden', border: '1px solid #ccc', boxShadow: '0 0 10px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
            <svg
                width={width * scale}
                height={height * scale}
                viewBox={`0 0 ${width} ${height}`}
                style={{ display: 'block' }}
            >
                {borderConfig && <BorderlineEngine width={width} height={height} config={borderConfig} />}
                {/* Form Background */}
                <rect width={width} height={height} fill="#fff" />

                {/* W-2 Lines and Boxes */}
                {type === 'W2' && (
                    <>
                        <path d="M40,40 L810,40 L810,510 L40,510 Z" fill="none" stroke="#222" strokeWidth="2" />
                        <line x1="40" y1="80" x2="810" y2="80" stroke="#444" strokeWidth="1" />
                        <line x1="40" y1="140" x2="810" y2="140" stroke="#444" strokeWidth="1" />
                        <line x1="440" y1="40" x2="440" y2="140" stroke="#444" strokeWidth="1" />
                        <line x1="640" y1="80" x2="640" y2="510" stroke="#444" strokeWidth="1" />

                        {/* Static Labels */}
                        <text x="45" y="55" fontSize="8" fill="#666">a Employee's social security number</text>
                        <text x="45" y="95" fontSize="8" fill="#666">b Employer identification number (EIN)</text>
                        <text x="45" y="152" fontSize="8" fill="#666">c Employer's name, address, and ZIP code</text>
                        <text x="45" y="240" fontSize="8" fill="#666">e Employee's first name and initial, last name</text>
                        <text x="645" y="95" fontSize="8" fill="#666">1 Wages, tips, other compensation</text>
                        <text x="645" y="152" fontSize="8" fill="#666">2 Federal income tax withheld</text>

                        {/* Branding */}
                        <text x="50" y="500" fontSize="16" fontWeight="bold" fill="#000">W-2</text>
                        <text x="100" y="500" fontSize="10" fill="#000">Wage and Tax Statement</text>
                        <text x="750" y="500" fontSize="10" fill="#000">OMB No. 1545-0008</text>
                    </>
                )}

                {/* 1099-NEC (Nonemployee Compensation) */}
                {type === '1099-NEC' && (
                    <>
                        {/* Outer Border */}
                        <rect x="40" y="40" width="770" height="470" fill="none" stroke="#222" strokeWidth="2" />

                        {/* Vertical Dividers */}
                        <line x1="380" y1="40" x2="380" y2="510" stroke="#444" strokeWidth="1" />
                        <line x1="580" y1="40" x2="580" y2="510" stroke="#444" strokeWidth="1" />

                        {/* Horizontal Dividers - Column 1 */}
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#444" strokeWidth="1" />
                        <line x1="40" y1="350" x2="380" y2="350" stroke="#444" strokeWidth="1" />

                        {/* Horizontal Dividers - Column 2/3 */}
                        <line x1="380" y1="120" x2="810" y2="120" stroke="#444" strokeWidth="1" />
                        <line x1="380" y1="200" x2="810" y2="200" stroke="#444" strokeWidth="1" />
                        <line x1="380" y1="280" x2="810" y2="280" stroke="#444" strokeWidth="1" />
                        <line x1="380" y1="360" x2="810" y2="360" stroke="#444" strokeWidth="1" />

                        {/* Labels */}
                        <text x="45" y="55" fontSize="9" fill="#666">PAYER'S name, street address, city, state, and ZIP</text>
                        <text x="45" y="195" fontSize="9" fill="#666">PAYER'S TIN</text>
                        <text x="215" y="195" fontSize="9" fill="#666">RECIPIENT'S TIN</text>
                        <text x="45" y="365" fontSize="9" fill="#666">RECIPIENT'S name, address, and city</text>

                        <text x="390" y="55" fontSize="9" fill="#666">1 Nonemployee compensation</text>
                        <text x="390" y="135" fontSize="9" fill="#666">2 Payer made direct sales of $5,000+</text>
                        <text x="390" y="215" fontSize="9" fill="#666">3 (Other info)</text>
                        <text x="390" y="295" fontSize="9" fill="#666">4 Federal income tax withheld</text>

                        {/* Form ID */}
                        <text x="700" y="490" fontSize="16" fontWeight="bold" fill="#000">1099-NEC</text>
                        <text x="40" y="540" fontSize="10" fill="#000">Nonemployee Compensation</text>
                    </>
                )}

                {/* 1099-MISC */}
                {type === '1099-MISC' && (
                    <>
                        <rect x="40" y="40" width="770" height="470" fill="none" stroke="#222" strokeWidth="2" />
                        <line x1="380" y1="40" x2="380" y2="510" stroke="#444" strokeWidth="1" />
                        <line x1="580" y1="40" x2="580" y2="510" stroke="#444" strokeWidth="1" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#444" strokeWidth="1" />
                        <line x1="40" y1="350" x2="380" y2="350" stroke="#444" strokeWidth="1" />

                        {/* Right side dividers */}
                        <line x1="380" y1="100" x2="810" y2="100" stroke="#444" strokeWidth="1" />
                        <line x1="380" y1="160" x2="810" y2="160" stroke="#444" strokeWidth="1" />
                        <line x1="380" y1="220" x2="810" y2="220" stroke="#444" strokeWidth="1" />
                        <line x1="380" y1="280" x2="810" y2="280" stroke="#444" strokeWidth="1" />

                        <text x="45" y="55" fontSize="9" fill="#666">PAYER'S name, address, ZIP code</text>
                        <text x="390" y="55" fontSize="9" fill="#666">1 Rents</text>
                        <text x="390" y="115" fontSize="9" fill="#666">2 Royalties</text>
                        <text x="390" y="175" fontSize="9" fill="#666">3 Other income</text>
                        <text x="390" y="235" fontSize="9" fill="#666">4 Federal income tax withheld</text>

                        <text x="700" y="490" fontSize="16" fontWeight="bold" fill="#000">1099-MISC</text>
                        <text x="40" y="540" fontSize="10" fill="#000">Miscellaneous Information</text>
                    </>
                )}

                {/* 1099-INT */}
                {type === '1099-INT' && (
                    <>
                        <rect x="40" y="40" width="770" height="400" fill="none" stroke="#222" strokeWidth="2" />
                        <line x1="380" y1="40" x2="380" y2="440" stroke="#444" strokeWidth="1" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#444" strokeWidth="1" />

                        <text x="45" y="55" fontSize="9" fill="#666">PAYER'S name, address, ZIP code</text>
                        <text x="390" y="55" fontSize="9" fill="#666">1 Interest income</text>
                        <text x="390" y="115" fontSize="9" fill="#666">2 Early withdrawal penalty</text>
                        <text x="390" y="175" fontSize="9" fill="#666">3 Interest on US Savings Bonds</text>
                        <text x="390" y="235" fontSize="9" fill="#666">4 Federal income tax withheld</text>

                        <text x="650" y="380" fontSize="16" fontWeight="bold" fill="#000">1099-INT</text>
                        <text x="650" y="400" fontSize="10" fill="#000">Interest Income</text>
                    </>
                )}

                {/* 1099-DIV */}
                {type === '1099-DIV' && (
                    <>
                        <rect x="40" y="40" width="770" height="400" fill="none" stroke="#222" strokeWidth="2" />
                        <line x1="380" y1="40" x2="380" y2="440" stroke="#444" strokeWidth="1" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#444" strokeWidth="1" />

                        <text x="45" y="55" fontSize="9" fill="#666">PAYER'S name, address, ZIP code</text>
                        <text x="390" y="55" fontSize="9" fill="#666">1a Total ordinary dividends</text>
                        <text x="390" y="115" fontSize="9" fill="#666">1b Qualified dividends</text>
                        <text x="390" y="175" fontSize="9" fill="#666">2a Total capital gain distr.</text>
                        <text x="390" y="235" fontSize="9" fill="#666">4 Federal income tax withheld</text>

                        <text x="650" y="380" fontSize="16" fontWeight="bold" fill="#000">1099-DIV</text>
                        <text x="650" y="400" fontSize="10" fill="#000">Dividends and Distributions</text>
                    </>
                )}

                {/* 1099-K */}
                {type === '1099-K' && (
                    <>
                        <rect x="40" y="40" width="770" height="470" fill="none" stroke="#222" strokeWidth="2" />
                        <line x1="380" y1="40" x2="380" y2="510" stroke="#444" strokeWidth="1" />
                        <line x1="40" y1="180" x2="380" y2="180" stroke="#444" strokeWidth="1" />

                        <text x="45" y="55" fontSize="9" fill="#666">FILER'S name, address, ZIP code</text>
                        <text x="45" y="195" fontSize="9" fill="#666">PAYEE'S name, address, ZIP code</text>

                        <text x="390" y="55" fontSize="9" fill="#666">1a Gross amount of payment card/third party network transactions</text>
                        <text x="390" y="135" fontSize="9" fill="#666">5a Number of payment transactions</text>
                        <text x="390" y="215" fontSize="9" fill="#666">4 Federal income tax withheld</text>

                        <text x="700" y="490" fontSize="16" fontWeight="bold" fill="#000">1099-K</text>
                        <text x="40" y="540" fontSize="10" fill="#000">Payment Card Transactions</text>
                    </>
                )}

                {/* TAX REFUND */}
                {type === 'TAX_REFUND' && (
                    <>
                        <rect x="40" y="40" width="770" height="250" fill="#f0fff4" stroke="#22c55e" strokeWidth="2" rx="15" />
                        <text x="425" y="80" fontSize="24" fontWeight="bold" fill="#15803d" textAnchor="middle">Tax Refund Summary</text>

                        <text x="60" y="120" fontSize="12" fill="#666">Total Refund Amount</text>
                        <text x="750" y="120" fontSize="12" fill="#666" textAnchor="end">Est. Deposit Date</text>

                        <line x1="60" y1="140" x2="790" y2="140" stroke="#22c55e" strokeWidth="1" strokeDasharray="5,5" />

                        <text x="60" y="180" fontSize="11" fill="#444">Bank Account:</text>
                        <text x="60" y="210" fontSize="11" fill="#444">Routing Number:</text>

                        <text x="425" y="230" fontSize="10" fill="#22c55e" textAnchor="middle">This is a summary of your expected refund.</text>
                    </>
                )}

                {/* 1040 (Simplified Page 1) */}
                {type === '1040' && (
                    <>
                        {/* Header */}
                        <path d="M40,40 L810,40 L810,140 L40,140 Z" fill="none" stroke="#222" strokeWidth="2" />
                        <text x="45" y="60" fontSize="24" fontWeight="bold" fill="#000">1040</text>
                        <text x="120" y="60" fontSize="14" fill="#000">U.S. Individual Income Tax Return</text>

                        {/* Address Block */}
                        <rect x="40" y="150" width="770" height="80" fill="none" stroke="#222" strokeWidth="1" />
                        <text x="45" y="165" fontSize="9" fill="#666">Filing Status / Name and Address</text>

                        {/* Income Section */}
                        <rect x="40" y="240" width="770" height="200" fill="none" stroke="#222" strokeWidth="1" />
                        <line x1="600" y1="240" x2="600" y2="440" stroke="#444" strokeWidth="1" />

                        <text x="45" y="255" fontSize="11" fontWeight="bold" fill="#000">Income</text>
                        <text x="45" y="280" fontSize="10" fill="#000">1. Total amount from Forms W-2, box 1</text>
                        <text x="45" y="310" fontSize="10" fill="#000">8. Other income (Schedule 1)</text>
                        <text x="45" y="340" fontSize="10" fill="#000">11. Adjusted Gross Income</text>
                        <text x="45" y="370" fontSize="10" fill="#000">15. Taxable Income</text>
                        <text x="45" y="400" fontSize="10" fill="#000">24. Total Tax</text>

                        {/* Refund Section */}
                        <rect x="40" y="450" width="770" height="80" fill="#eef" stroke="#222" strokeWidth="1" />
                        <text x="45" y="465" fontSize="11" fontWeight="bold" fill="#000">Refund</text>
                        <text x="45" y="490" fontSize="10" fill="#000">34. Amount you overpaid (Refund)</text>
                        <text x="45" y="515" fontSize="10" fill="#000">37. Amount you owe</text>
                    </>
                )}

                {/* Render Dynamic Data */}
                {Object.entries(data).map(([key, val]) => {
                    // Combine coordinate lookups based on active type
                    let coordMap = W2_COORDS;
                    if (type === '1099-NEC') coordMap = NEC_COORDS;
                    if (type === '1099-MISC') coordMap = MISC_COORDS;
                    if (type === '1099-INT') coordMap = INT_COORDS;
                    if (type === '1099-K') coordMap = K_COORDS;
                    if (type === '1099-DIV') coordMap = DIV_COORDS;
                    if (type === '1040') coordMap = TAX_1040_COORDS;
                    if (type === 'TAX_REFUND') coordMap = REFUND_COORDS;

                    const coords = coordMap[key];
                    return coords ? renderField(key, val, coords) : null;
                })}
            </svg>
        </div>
    );
};

export default TaxFormRenderer;
