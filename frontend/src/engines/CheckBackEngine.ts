import { fabric } from 'fabric';

/**
 * CheckBackEngine - v40 Draggable Fix & Styles
 * 
 * Changes:
 * - Added unique 'id' to EVERY fabric object for persistence.
 * - Implemented 'style' logic:
 *   - 'mobile': Checkbox + Instruction Text
 *   - 'business' / 'standard': Clean endorsement area
 */
export class CheckBackEngine {
    static generateCheckBack(width: number, height: number, config: any, scaleFactor: number, depositConfig?: any, signatureImage?: string | null): fabric.Object[] {
        const objects: fabric.Object[] = [];
        const scale = scaleFactor / 72;
        const style = config.style || 'mobile'; // Default to mobile if not specified

        // 0. Base Draggable Backgrounds (User can adjust split manually)
        const endorsementX = width - (1.5 * 72 * scale);

        // Left Panel (Main Security Body - Light Blue)
        // When the selected design carries a primary colour, the panel
        // takes a pale tint of it, so each design's back is its own;
        // with no design colour it stays the standard security blue.
        objects.push(new fabric.Rect({
            id: 'back-bg-left', // UNIQUE ID
            left: 0,
            top: 0,
            width: endorsementX,
            height: height,
            fill: CheckBackEngine.paleTint(config.tint),
            selectable: true, evented: true, hasControls: true, lockRotation: true
        } as any));

        // Right Panel (Endorsement Zone - Clean White)
        objects.push(new fabric.Rect({
            id: 'back-bg-right', // UNIQUE ID
            left: endorsementX,
            top: 0,
            width: width - endorsementX,
            height: height,
            fill: '#ffffff',
            selectable: true, evented: true, hasControls: true, lockRotation: true
        } as any));

        // 1. Watermark (Horizontal Center - Draggable, Big & Bold)
        this.addHorizontalWatermark(width, height, scale, objects);

        // 1b. Design identity: the bank/design name across the top of
        // the blue field. Until now every design produced the identical
        // back - the name was passed in and never used.
        if (config.bankName && String(config.bankName).trim()) {
            objects.push(new fabric.Text(String(config.bankName).toUpperCase(), {
                id: 'back-bank-name', // UNIQUE ID
                left: endorsementX / 2,
                top: 14 * scale,
                fontSize: 11 * scale,
                fontWeight: '600',
                fontFamily: 'Arial',
                fill: '#2f5d7d',
                charSpacing: 2 * scale,
                originX: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));
        }

        // 2. Endorsement Zone (Right Side - All elements unlocked)
        this.addUnlockedEndorsementZone(width, height, scale, objects, style, depositConfig, signatureImage);

        // 3. Security Box (Left Side - All elements unlocked)
        this.addUnlockedSecurityBox(width, height, scale, objects);

        return objects;
    }

    // Mix a design colour 88% toward white: a pale security tint in the
    // design's family. Anything that is not a #rrggbb colour falls back
    // to the standard security blue.
    private static paleTint(hex: any): string {
        if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return '#e3f2fd';
        const mix = (v: number) => Math.round(v + (255 - v) * 0.88);
        const r = mix(parseInt(hex.slice(1, 3), 16));
        const g = mix(parseInt(hex.slice(3, 5), 16));
        const b = mix(parseInt(hex.slice(5, 7), 16));
        return `rgb(${r}, ${g}, ${b})`;
    }

    private static addHorizontalWatermark(width: number, height: number, scale: number, objects: fabric.Object[]): void {
        const endorsementX = width - (1.5 * 72 * scale);
        // The open area between the security box (ends at 233*scale, see
        // addUnlockedSecurityBox) and the endorsement strip. The watermark
        // is centred and sized on THIS area so it never runs under the box
        // or into the strip.
        const openL = 233 * scale;
        const openW = endorsementX - openL;
        const commonProps = {
            left: openL + (openW / 2),
            fontSize: Math.min(96 * scale, ((openW - (24 * scale)) / 7.74)),
            fontFamily: 'Arial Black, Arial',
            fontWeight: 900,
            fill: 'rgba(180, 180, 180, 0.18)',
            originX: 'center',
            originY: 'center',
            selectable: true, evented: true, hasControls: true,
            charSpacing: 16 * scale
        };

        objects.push(new fabric.Text("ORIGINAL", {
            ...commonProps,
            id: 'watermark-original', // UNIQUE ID
            top: (height * 0.38)
        } as any));

        objects.push(new fabric.Text("DOCUMENT", {
            ...commonProps,
            id: 'watermark-document', // UNIQUE ID
            top: (height * 0.62)
        } as any));
    }

    private static addUnlockedEndorsementZone(width: number, height: number, scale: number, objects: fabric.Object[], style: string, config?: any, signatureImage?: string | null): void {
        const zoneWidth = 1.5 * 72 * scale;
        const zoneX = width - zoneWidth;

        // OWNER'S CALCULATED GEOMETRY - restored exactly as originally
        // designed. The three endorsement lines sit at zoneX + 30% of the
        // zone, then +35 steps, running from y=60 to 55% of the height;
        // the X, header, mobile column and notice columns interlock with
        // those positions. Do not re-space: on a check, small placement
        // errors are what get documents rejected.
        // Only deviation from the original numbers: the two notice texts
        // are vertically centred so their full length stays on the page
        // (at the original 0.88/0.92 centre points they ran off the
        // bottom edge). Their columns are the original ones.

        // --- Divider Line ---
        objects.push(new fabric.Line([zoneX, 0, zoneX, height], {
            id: 'endorse-divider', // UNIQUE ID
            stroke: '#999', strokeWidth: 1.2 * scale,
            selectable: true, evented: true, hasControls: true
        } as any));

        // --- "ENDORSE HERE" Header ---
        objects.push(new fabric.Text("ENDORSE HERE", {
            id: 'endorse-header', // UNIQUE ID
            left: width - (15 * scale),
            top: 40 * scale,
            fontSize: 10 * scale,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: '#333',
            angle: 90,
            selectable: true, evented: true, hasControls: true
        } as any));

        // --- Signature X ---
        // The X belongs ON the first endorsement line, at its start: the
        // reference back (and every real check) puts it there so the
        // signature begins on the line. It previously sat 15 units off
        // the line's column, which read as a stray mark floating beside
        // the signing area. The lines themselves do not move.
        const xPosX = zoneX + (zoneWidth * 0.3);
        objects.push(new fabric.Text("X", {
            id: 'endorse-x', // UNIQUE ID
            left: xPosX,
            top: 60 * scale,
            fontSize: 16 * scale,
            fontFamily: 'Arial',
            fill: '#000',
            angle: 90,
            originX: 'center',
            selectable: true, evented: true, hasControls: true
        } as any));

        // --- 3 Endorsement Lines (the calculated spacing) ---
        const lineStartTop = 60 * scale;
        const lineEndTop = height * 0.55;

        for (let i = 0; i < 3; i++) {
            const lx = xPosX + (i * 35 * scale);
            objects.push(new fabric.Line([lx, lineStartTop, lx, lineEndTop], {
                id: `endorse-line-${i}`, // UNIQUE ID
                stroke: '#ccc', strokeWidth: 1.5 * scale,
                selectable: true, evented: true, hasControls: true
            } as any));
        }

        // --- Mobile Deposit Area ---
        if (style === 'mobile') {
            const mobileY = height * 0.68;

            objects.push(new fabric.Text("CHECK HERE IF MOBILE DEPOSIT", {
                id: 'mobile-instruction', // UNIQUE ID
                left: zoneX + (zoneWidth * 0.75),
                top: mobileY,
                fontSize: 7 * scale,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#222',
                angle: 90,
                originX: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));

            objects.push(new fabric.Rect({
                id: 'mobile-checkbox', // UNIQUE ID
                left: zoneX + (zoneWidth * 0.85),
                top: mobileY,
                width: 16 * scale,
                height: 16 * scale,
                fill: 'transparent',
                stroke: '#222',
                strokeWidth: 1.5 * scale,
                angle: 90,
                originX: 'center',
                originY: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));
        }

        // --- Deposit-Only Styles (Business / ATM) ---
        // Same endorsement columns as the mobile block above: the deposit style
        // changes the restrictive endorsement wording, never the owner's layout.
        if (style === 'business' || style === 'atm') {
            const depositY = height * 0.68;
            objects.push(new fabric.Text("FOR DEPOSIT ONLY", {
                id: 'deposit-only-label',
                left: zoneX + (zoneWidth * 0.75),
                top: depositY,
                fontSize: 7 * scale,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#222',
                angle: 90,
                originX: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));
            if (style === 'business' && config?.accountNumber) {
                objects.push(new fabric.Text(String(config.accountNumber), {
                    id: 'deposit-only-account',
                    left: zoneX + (zoneWidth * 0.85),
                    top: depositY,
                    fontSize: 7 * scale,
                    fontFamily: 'Arial',
                    fill: '#222',
                    angle: 90,
                    originX: 'center',
                    selectable: true, evented: true, hasControls: true
                } as any));
            }
        }

        // --- Warning Text (original column; centred so it stays on-page) ---
        objects.push(new fabric.Text("DO NOT WRITE, STAMP OR SIGN BELOW THIS LINE", {
            id: 'endorse-warning', // UNIQUE ID
            left: zoneX + (zoneWidth * 0.5),
            top: height - (89 * scale),
            fontSize: 6 * scale,
            fontWeight: '800',
            fontFamily: 'Arial',
            fill: '#444',
            angle: 90,
            originX: 'center',
            originY: 'center',
            selectable: true, evented: true, hasControls: true
        } as any));

        // --- Reserved Text (original column; centred so it stays on-page) ---
        objects.push(new fabric.Text("RESERVED FOR FINANCIAL INSTITUTION USE*", {
            id: 'endorse-reserved', // UNIQUE ID
            left: zoneX + (zoneWidth * 0.2),
            top: height - (63 * scale),
            fontSize: 5 * scale,
            fontFamily: 'Arial',
            fill: '#888',
            angle: 90,
            originX: 'center',
            originY: 'center',
            selectable: true, evented: true, hasControls: true
        } as any));
    }

    private static addUnlockedSecurityBox(width: number, height: number, scale: number, objects: fabric.Object[]): void {
        // The security box from the owner's reference back: a titled,
        // bulleted list of the six standard features on an even pitch,
        // one type size throughout, all columns centred on the box's
        // midline, the federal Reg. C.C. line at the far edge. Frame
        // geometry is the owner's and does not change.
        const boxLeft = 28 * scale;
        const boxTop = 26 * scale;
        const boxW = 205 * scale;
        const boxH = height - (52 * scale);
        const colY = boxTop + (boxH / 2);
        const col = (offset: number) => boxLeft + (offset * scale);
        const BODY = 6.0;

        // Frame
        objects.push(new fabric.Rect({
            id: 'security-box-frame', // UNIQUE ID
            left: boxLeft, top: boxTop, width: boxW, height: boxH,
            fill: 'transparent', stroke: '#888', strokeWidth: 1.2 * scale,
            selectable: true, evented: true, hasControls: true
        } as any));

        const colText = (id: string, text: string, offset: number, fontWeight: string, fill: string) => {
            objects.push(new fabric.Text(text, {
                id,
                left: col(offset),
                top: colY,
                fontSize: BODY * scale,
                fontWeight,
                fontFamily: 'Arial',
                fill,
                angle: 90,
                originX: 'center',
                originY: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));
        };

        // Title column, as titled on the reference back
        colText('security-header',
            "SECURITY FEATURES",
            20, 'bold', '#111');

        // The reference back's feature list: six short entries on an
        // even pitch, nothing else. The previous contents (certification
        // prose, an alteration warning and four long description
        // paragraphs) packed the box into a dense grey block that read
        // as scattered next to the reference's clean list.
        const features: string[] = [
            "Fluorescent Fiber Technology",
            "Chemical Sensitive Paper Stock",
            "Microprinting Along Lines (MP)",
            "Security Screen Backdrop",
            "Routing Number Verification",
            "Authentic Document Watermark"
        ];
        features.forEach((name, i) => {
            colText(`security-feature-${i}`, `\u2022 ${name}`, 46 + (i * 22), '600', '#111');
        });

        // Reg. C.C. line (bottom of the box on the sample)
        colText('security-regcc',
            "* FEDERAL RESERVE BOARD OF GOVERNORS REG. C.C.",
            184, 'bold', '#111');
    }

}
