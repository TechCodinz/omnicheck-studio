import React from 'react';

export type BorderStyle = 'NONE' | 'SOLID' | 'DOUBLE' | 'DOTTED' | 'BRAIDED' | 'SCALLOPED' | 'ORNATE' | 'MICROPRINT' | 'ART_DECO' | 'GUILLOCHE' | 'TREASURY' | 'COMMERCIAL' | 'FILIGREE';

export interface BorderConfig {
    style: BorderStyle;
    color: string;
    secondaryColor?: string;
    thickness: number;
    cornerRadius: number;
}

interface BorderlineEngineProps {
    width: number;
    height: number;
    config: BorderConfig;
}

export const BorderlineEngine: React.FC<BorderlineEngineProps> = ({ width, height, config }) => {
    const { style, color, thickness, cornerRadius } = config;
    const secondaryColor = config.secondaryColor || color;
    const uniqueId = React.useMemo(() => `pattern_${Math.random().toString(36).substr(2, 9)}`, []);
    const m = Math.max(3, thickness); // minimum visual weight

    if (style === 'NONE') return null;

    // ── SOLID ────────────────────────────────────────────
    const renderSolid = () => (
        <>
            <rect x={2} y={2} width={width - 4} height={height - 4}
                fill="none" stroke={color} strokeWidth={m} rx={cornerRadius} />
            <rect x={m + 3} y={m + 3} width={width - (m + 3) * 2} height={height - (m + 3) * 2}
                fill="none" stroke={secondaryColor} strokeWidth={0.5} rx={Math.max(0, cornerRadius - 4)} opacity={0.4} />
        </>
    );

    // ── DOUBLE ───────────────────────────────────────────
    const renderDouble = () => (
        <>
            <rect x={2} y={2} width={width - 4} height={height - 4}
                fill="none" stroke={color} strokeWidth={m * 0.6} rx={cornerRadius} />
            <rect x={m + 5} y={m + 5} width={width - (m + 5) * 2} height={height - (m + 5) * 2}
                fill="none" stroke={secondaryColor} strokeWidth={m * 0.6} rx={Math.max(0, cornerRadius - 5)} />
            {/* Hairline accent between the two frames */}
            <rect x={m / 2 + 3} y={m / 2 + 3} width={width - (m + 6)} height={height - (m + 6)}
                fill="none" stroke={color} strokeWidth={0.3} rx={Math.max(0, cornerRadius - 2)} opacity={0.3} />
        </>
    );

    // ── DOTTED ───────────────────────────────────────────
    const renderDotted = () => (
        <>
            <rect x={2} y={2} width={width - 4} height={height - 4}
                fill="none" stroke={color} strokeWidth={m}
                strokeDasharray={`${m * 1.5} ${m * 2}`} strokeLinecap="round"
                rx={cornerRadius} />
            <rect x={m + 4} y={m + 4} width={width - (m + 4) * 2} height={height - (m + 4) * 2}
                fill="none" stroke={secondaryColor} strokeWidth={0.5}
                rx={Math.max(0, cornerRadius - 5)} opacity={0.35} />
        </>
    );

    // ── BRAIDED ──────────────────────────────────────────
    const renderBraided = () => {
        const ps = m * 5; // pattern size
        return (
            <>
                <defs>
                    <pattern id={`${uniqueId}_braid`} x="0" y="0" width={ps} height={ps} patternUnits="userSpaceOnUse">
                        <path d={`M 0,${ps / 2} Q ${ps / 4},${ps} ${ps / 2},${ps / 2} T ${ps},${ps / 2}`}
                            fill="none" stroke={secondaryColor} strokeWidth={m * 0.6} opacity={0.55} />
                        <path d={`M 0,${ps / 2} Q ${ps / 4},0 ${ps / 2},${ps / 2} T ${ps},${ps / 2}`}
                            fill="none" stroke={color} strokeWidth={m * 0.6} />
                    </pattern>
                </defs>
                {/* Outer rail */}
                <rect x={1} y={1} width={width - 2} height={height - 2}
                    fill="none" stroke={color} strokeWidth={1} rx={cornerRadius} />
                {/* Braid fill */}
                <rect x={m} y={m} width={width - m * 2} height={height - m * 2}
                    fill="none" stroke={`url(#${uniqueId}_braid)`}
                    strokeWidth={ps} rx={Math.max(0, cornerRadius - 4)} />
                {/* Inner rail */}
                <rect x={m * 3.5} y={m * 3.5} width={width - m * 7} height={height - m * 7}
                    fill="none" stroke={secondaryColor} strokeWidth={0.5} rx={Math.max(0, cornerRadius - m)} opacity={0.5} />
            </>
        );
    };

    // ── SCALLOPED ────────────────────────────────────────
    const renderScalloped = () => {
        const pw = m * 7;
        return (
            <>
                <defs>
                    <pattern id={`${uniqueId}_scallop`} x="0" y="0" width={pw} height={m * 4} patternUnits="userSpaceOnUse">
                        <path d={`M 0,${m} C ${pw / 2},-${m} ${pw / 2},${m * 3} ${pw},${m}`}
                            fill="none" stroke={color} strokeWidth={m * 0.5} />
                        <path d={`M 0,${m * 1.5} C ${pw / 2},${m * 0.3} ${pw / 2},${m * 3.5} ${pw},${m * 1.5}`}
                            fill="none" stroke={secondaryColor} strokeWidth={m * 0.25} opacity={0.45} />
                    </pattern>
                </defs>
                <rect x={m} y={m} width={width - m * 2} height={height - m * 2}
                    fill="none" stroke={`url(#${uniqueId}_scallop)`}
                    strokeWidth={m * 4} rx={cornerRadius} />
                <rect x={2} y={2} width={width - 4} height={height - 4}
                    fill="none" stroke={color} strokeWidth={0.8} rx={cornerRadius} />
            </>
        );
    };

    // ── ORNATE ───────────────────────────────────────────
    const renderOrnate = () => (
        <>
            <rect x={4} y={4} width={width - 8} height={height - 8}
                fill="none" stroke={color} strokeWidth={1.2} />
            <rect x={9} y={9} width={width - 18} height={height - 18}
                fill="none" stroke={secondaryColor} strokeWidth={2} />
            {/* Corner flourishes */}
            {[[0, 0, ''], [width, 0, 'scale(-1,1)'], [width, height, 'scale(-1,-1)'], [0, height, 'scale(1,-1)']].map(([tx, ty, sc], i) => (
                <g key={i} transform={`translate(${tx},${ty}) ${sc}`}>
                    <path d="M 5,40 C 5,18 18,5 40,5" fill="none" stroke={color} strokeWidth={m} />
                    <path d="M 8,36 C 8,22 22,8 36,8" fill="none" stroke={secondaryColor} strokeWidth={m * 0.5} opacity={0.6} />
                    <path d="M 8,18 L 18,18 L 18,8" fill="none" stroke={color} strokeWidth={m * 0.7} />
                    <circle cx="14" cy="14" r="2.5" fill={secondaryColor} opacity={0.7} />
                    <circle cx="14" cy="14" r="1" fill={color} />
                </g>
            ))}
        </>
    );

    // ── MICROPRINT ───────────────────────────────────────
    const renderMicroprint = () => {
        const fs = Math.max(3.5, m * 1.8);
        const tid = `${uniqueId}_txt`;
        const securityText = "ORIGINAL DOCUMENT • VOID IF ALTERED • SECURITY CHECK • AUTHORIZED • MP ";
        return (
            <g>
                <defs>
                    <path id={`${tid}_p`} d={`M ${m + 2},${m + 2} H ${width - m - 2} V ${height - m - 2} H ${m + 2} Z`} />
                </defs>
                <text fill={color} fontSize={fs} fontWeight="bold" fontFamily="'Courier New', monospace" letterSpacing="0.8">
                    <textPath href={`#${tid}_p`}>{securityText.repeat(60)}</textPath>
                </text>
                <rect x={m - 1} y={m - 1} width={width - (m - 1) * 2} height={height - (m - 1) * 2}
                    fill="none" stroke={secondaryColor} strokeWidth={0.4} />
                <rect x={fs + m + 1} y={fs + m + 1} width={width - (fs + m + 1) * 2} height={height - (fs + m + 1) * 2}
                    fill="none" stroke={color} strokeWidth={0.3} opacity={0.4} />
            </g>
        );
    };

    // ── ART DECO ─────────────────────────────────────────
    const renderArtDeco = () => {
        const ps = 18;
        return (
            <>
                <defs>
                    <pattern id={`${uniqueId}_deco`} x="0" y="0" width={ps} height={ps} patternUnits="userSpaceOnUse">
                        <path d={`M 0,0 L ${ps},${ps} M ${ps},0 L 0,${ps}`} stroke={color} strokeWidth={0.8} />
                        <rect x={4} y={4} width={10} height={10} fill="none" stroke={secondaryColor} strokeWidth={0.6} opacity={0.5} />
                        <circle cx={ps / 2} cy={ps / 2} r={2} fill="none" stroke={color} strokeWidth={0.4} opacity={0.3} />
                    </pattern>
                </defs>
                <rect x={8} y={8} width={width - 16} height={height - 16}
                    fill="none" stroke={`url(#${uniqueId}_deco)`} strokeWidth={ps} />
                <rect x={4} y={4} width={width - 8} height={height - 8}
                    fill="none" stroke={color} strokeWidth={1.8} />
                <rect x={ps / 2 + 8} y={ps / 2 + 8} width={width - ps - 16} height={height - ps - 16}
                    fill="none" stroke={secondaryColor} strokeWidth={0.8} />
            </>
        );
    };

    // ── GUILLOCHE (Premium Bank-Grade) ───────────────────
    const renderGuilloche = () => {
        const ps = 24;
        return (
            <>
                <defs>
                    <pattern id={`${uniqueId}_gui`} x="0" y="0" width={ps} height={ps} patternUnits="userSpaceOnUse">
                        {/* Primary wave */}
                        <path d={`M 0,${ps / 2} C ${ps / 3},${ps * 0.1} ${ps * 2 / 3},${ps * 0.9} ${ps},${ps / 2}`}
                            fill="none" stroke={color} strokeWidth={0.7} />
                        {/* Counter wave */}
                        <path d={`M 0,${ps / 2} C ${ps / 3},${ps * 0.9} ${ps * 2 / 3},${ps * 0.1} ${ps},${ps / 2}`}
                            fill="none" stroke={secondaryColor} strokeWidth={0.5} opacity={0.45} />
                        {/* Rosette center */}
                        <circle cx={ps / 2} cy={ps / 2} r={1.5} fill="none" stroke={color} strokeWidth={0.3} opacity={0.4} />
                    </pattern>
                    <linearGradient id={`${uniqueId}_guiGrad`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                        <stop offset="50%" stopColor={secondaryColor} stopOpacity={0.7} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.9} />
                    </linearGradient>
                </defs>
                {/* Outer rail */}
                <rect x={2} y={2} width={width - 4} height={height - 4}
                    fill="none" stroke={`url(#${uniqueId}_guiGrad)`} strokeWidth={1.5} rx={cornerRadius} />
                {/* Guilloche band */}
                <rect x={6} y={6} width={width - 12} height={height - 12}
                    fill="none" stroke={`url(#${uniqueId}_gui)`} strokeWidth={ps} rx={Math.max(0, cornerRadius - 4)} />
                {/* Inner rail */}
                <rect x={ps / 2 + 8} y={ps / 2 + 8} width={width - ps - 16} height={height - ps - 16}
                    fill="none" stroke={color} strokeWidth={0.8} rx={Math.max(0, cornerRadius - ps / 2)} opacity={0.6} />
            </>
        );
    };

    // ── TREASURY (US Government Style) ───────────────────
    const renderTreasury = () => {
        const band = 16;
        return (
            <>
                <defs>
                    <pattern id={`${uniqueId}_tres`} x="0" y="0" width={band} height={band} patternUnits="userSpaceOnUse">
                        {/* Hash crosshatch */}
                        <line x1="0" y1="0" x2={band} y2={band} stroke={color} strokeWidth={0.5} />
                        <line x1={band} y1="0" x2="0" y2={band} stroke={color} strokeWidth={0.5} />
                        <line x1={band / 2} y1="0" x2={band / 2} y2={band} stroke={secondaryColor} strokeWidth={0.3} opacity={0.3} />
                        <line x1="0" y1={band / 2} x2={band} y2={band / 2} stroke={secondaryColor} strokeWidth={0.3} opacity={0.3} />
                    </pattern>
                </defs>
                {/* Heavy outer frame */}
                <rect x={2} y={2} width={width - 4} height={height - 4}
                    fill="none" stroke={color} strokeWidth={2.5} rx={1} />
                {/* Crosshatch security band */}
                <rect x={6} y={6} width={width - 12} height={height - 12}
                    fill="none" stroke={`url(#${uniqueId}_tres)`} strokeWidth={band} rx={0} />
                {/* Inner frame */}
                <rect x={band / 2 + 8} y={band / 2 + 8} width={width - band - 16} height={height - band - 16}
                    fill="none" stroke={color} strokeWidth={1.5} rx={0} />
                {/* Innermost hairline */}
                <rect x={band / 2 + 11} y={band / 2 + 11} width={width - band - 22} height={height - band - 22}
                    fill="none" stroke={secondaryColor} strokeWidth={0.4} rx={0} opacity={0.5} />
            </>
        );
    };

    // ── COMMERCIAL (Bank Linen Style) ────────────────────
    const renderCommercial = () => {
        const lw = 10;
        return (
            <>
                <defs>
                    <pattern id={`${uniqueId}_comm`} x="0" y="0" width={lw} height={lw} patternUnits="userSpaceOnUse">
                        {/* Fine linen weave */}
                        <line x1="0" y1={lw / 2} x2={lw} y2={lw / 2} stroke={color} strokeWidth={0.4} opacity={0.5} />
                        <line x1={lw / 2} y1="0" x2={lw / 2} y2={lw} stroke={secondaryColor} strokeWidth={0.3} opacity={0.35} />
                    </pattern>
                </defs>
                {/* Triple frame: outer, linen band, inner */}
                <rect x={2} y={2} width={width - 4} height={height - 4}
                    fill="none" stroke={color} strokeWidth={1.8} rx={cornerRadius} />
                <rect x={5} y={5} width={width - 10} height={height - 10}
                    fill="none" stroke={`url(#${uniqueId}_comm)`} strokeWidth={lw} rx={Math.max(0, cornerRadius - 3)} />
                <rect x={lw / 2 + 7} y={lw / 2 + 7} width={width - lw - 14} height={height - lw - 14}
                    fill="none" stroke={color} strokeWidth={1} rx={Math.max(0, cornerRadius - 8)} />
                {/* Accent line */}
                <rect x={lw / 2 + 9} y={lw / 2 + 9} width={width - lw - 18} height={height - lw - 18}
                    fill="none" stroke={secondaryColor} strokeWidth={0.4} rx={Math.max(0, cornerRadius - 10)} opacity={0.4} />
            </>
        );
    };

    // ── FILIGREE (Luxury Certificate Style) ──────────────
    const renderFiligree = () => {
        const ps = 30;
        return (
            <>
                <defs>
                    <pattern id={`${uniqueId}_fili`} x="0" y="0" width={ps} height={ps} patternUnits="userSpaceOnUse">
                        {/* Spiral vine */}
                        <path d={`M 0,${ps / 2} Q ${ps * 0.25},${ps * 0.15} ${ps / 2},${ps / 2} Q ${ps * 0.75},${ps * 0.85} ${ps},${ps / 2}`}
                            fill="none" stroke={color} strokeWidth={0.7} />
                        <path d={`M ${ps / 2},0 Q ${ps * 0.85},${ps * 0.25} ${ps / 2},${ps / 2} Q ${ps * 0.15},${ps * 0.75} ${ps / 2},${ps}`}
                            fill="none" stroke={secondaryColor} strokeWidth={0.5} opacity={0.4} />
                        {/* Leaf node */}
                        <circle cx={ps / 2} cy={ps / 2} r={2} fill="none" stroke={color} strokeWidth={0.4} opacity={0.5} />
                        <circle cx={ps / 2} cy={ps / 2} r={0.8} fill={color} opacity={0.3} />
                    </pattern>
                    <linearGradient id={`${uniqueId}_filiGrad`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="50%" stopColor={secondaryColor} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                    </linearGradient>
                </defs>
                {/* Gradient outer edge */}
                <rect x={2} y={2} width={width - 4} height={height - 4}
                    fill="none" stroke={`url(#${uniqueId}_filiGrad)`} strokeWidth={2} rx={cornerRadius} />
                {/* Filigree band */}
                <rect x={6} y={6} width={width - 12} height={height - 12}
                    fill="none" stroke={`url(#${uniqueId}_fili)`} strokeWidth={ps}
                    rx={Math.max(0, cornerRadius - 4)} />
                {/* Inner frame */}
                <rect x={ps / 2 + 8} y={ps / 2 + 8} width={width - ps - 16} height={height - ps - 16}
                    fill="none" stroke={color} strokeWidth={1} rx={Math.max(0, cornerRadius - ps / 2)} opacity={0.6} />
                {/* Corner diamonds */}
                {[[20, 20], [width - 20, 20], [width - 20, height - 20], [20, height - 20]].map(([cx, cy], i) => (
                    <g key={i}>
                        <path d={`M ${cx},${cy! - 5} L ${cx! + 5},${cy} L ${cx},${cy! + 5} L ${cx! - 5},${cy} Z`}
                            fill="none" stroke={color} strokeWidth={1} opacity={0.6} />
                        <circle cx={cx} cy={cy} r={1.5} fill={color} opacity={0.4} />
                    </g>
                ))}
            </>
        );
    };

    switch (style) {
        case 'SOLID': return renderSolid();
        case 'DOUBLE': return renderDouble();
        case 'DOTTED': return renderDotted();
        case 'BRAIDED': return renderBraided();
        case 'SCALLOPED': return renderScalloped();
        case 'ORNATE': return renderOrnate();
        case 'MICROPRINT': return renderMicroprint();
        case 'ART_DECO': return renderArtDeco();
        case 'GUILLOCHE': return renderGuilloche();
        case 'TREASURY': return renderTreasury();
        case 'COMMERCIAL': return renderCommercial();
        case 'FILIGREE': return renderFiligree();
        default: return null;
    }
};
