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
        objects.push(new fabric.Rect({
            id: 'back-bg-left', // UNIQUE ID
            left: 0,
            top: 0,
            width: endorsementX,
            height: height,
            fill: '#e3f2fd',
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

        // 2. Endorsement Zone (Right Side - All elements unlocked)
        this.addUnlockedEndorsementZone(width, height, scale, objects, style, depositConfig, signatureImage);

        // 3. Security Box (Left Side - All elements unlocked)
        this.addUnlockedSecurityBox(width, height, scale, objects);

        return objects;
    }

    private static addHorizontalWatermark(width: number, height: number, scale: number, objects: fabric.Object[]): void {
        const endorsementX = width - (1.5 * 72 * scale);
        const commonProps = {
            // Centred over the blue panel (not the full page) and sized to
            // fit inside it - at 110px DOCUMENT ran into the endorsement
            // strip and off the right edge.
            left: endorsementX / 2,
            fontSize: Math.min(110 * scale, (endorsementX * 0.86) / 7.6),
            fontFamily: 'Arial Black, Arial',
            fontWeight: 900,
            fill: 'rgba(180, 180, 180, 0.18)',
            originX: 'center',
            originY: 'center',
            selectable: true, evented: true, hasControls: true,
            charSpacing: 22 * scale
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

        // Column order inside the strip, matching real check backs
        // (owner's reference samples): divider | RESERVED | DO NOT WRITE |
        // endorsement lines with the mobile-deposit column between them |
        // ENDORSE HERE at the far edge. The lines run most of the height,
        // the X sits at the top end of the first line, and the two notice
        // texts are centred in their own columns - previously the X, the
        // lines and the texts were placed independently and collided.
        const colReserved = zoneX - (12 * scale);
        const colWarning = zoneX + (16 * scale);
        const line3X = zoneX + (34 * scale);
        const line2X = zoneX + (50 * scale);
        const colMobile = zoneX + (63 * scale);
        const line1X = zoneX + (76 * scale);
        const colHeader = width - (12 * scale);
        const lineTop = 40 * scale;
        const lineBottom = height - (24 * scale);

        // --- Divider Line ---
        objects.push(new fabric.Line([zoneX, 0, zoneX, height], {
            id: 'endorse-divider', // UNIQUE ID
            stroke: '#444', strokeWidth: 2.5 * scale,
            selectable: true, evented: true, hasControls: true
        } as any));

        // --- "ENDORSE HERE" Header (rightmost column, from the top) ---
        objects.push(new fabric.Text("ENDORSE HERE", {
            id: 'endorse-header', // UNIQUE ID
            left: colHeader,
            top: 24 * scale,
            fontSize: 10 * scale,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: '#333',
            angle: 90,
            selectable: true, evented: true, hasControls: true
        } as any));

        // --- Signature X (top end of the first endorsement line) ---
        objects.push(new fabric.Text("X", {
            id: 'endorse-x', // UNIQUE ID
            left: line1X - (6 * scale),
            top: 12 * scale,
            fontSize: 16 * scale,
            fontFamily: 'Arial',
            fill: '#000',
            angle: 90,
            selectable: true, evented: true, hasControls: true
        } as any));

        // --- 3 Endorsement Lines (long, evenly spaced across the strip) ---
        [line3X, line2X, line1X].forEach((lx, i) => {
            objects.push(new fabric.Line([lx, lineTop, lx, lineBottom], {
                id: `endorse-line-${i}`, // UNIQUE ID
                stroke: '#ccc', strokeWidth: 1.5 * scale,
                selectable: true, evented: true, hasControls: true
            } as any));
        });

        // --- Mobile Deposit (checkbox at the top of its column, text centred) ---
        if (style === 'mobile') {
            objects.push(new fabric.Rect({
                id: 'mobile-checkbox', // UNIQUE ID
                left: colMobile - (8 * scale),
                top: 48 * scale,
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

            objects.push(new fabric.Text("CHECK HERE IF MOBILE DEPOSIT", {
                id: 'mobile-instruction', // UNIQUE ID
                left: colMobile,
                top: height * 0.58,
                fontSize: 7 * scale,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#222',
                angle: 90,
                originX: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));
        }

        // --- Warning Text (own column left of the lines, centred) ---
        objects.push(new fabric.Text("DO NOT WRITE, STAMP OR SIGN BELOW THIS LINE", {
            id: 'endorse-warning', // UNIQUE ID
            left: colWarning,
            top: height / 2,
            fontSize: 6 * scale,
            fontWeight: '800',
            fontFamily: 'Arial',
            fill: '#444',
            angle: 90,
            originX: 'center',
            selectable: true, evented: true, hasControls: true
        } as any));

        // --- Reserved Text (column beside the divider, centred) ---
        objects.push(new fabric.Text("RESERVED FOR FINANCIAL INSTITUTION USE*", {
            id: 'endorse-reserved', // UNIQUE ID
            left: colReserved,
            top: height / 2,
            fontSize: 5 * scale,
            fontFamily: 'Arial',
            fill: '#888',
            angle: 90,
            originX: 'center',
            selectable: true, evented: true, hasControls: true
        } as any));
    }

    private static addUnlockedSecurityBox(width: number, height: number, scale: number, objects: fabric.Object[]): void {
        // The security box from the reference back: padlock certification
        // line, the alteration warning, the feature list with descriptions,
        // and the Reg. C.C. line - laid out as columns inside the frame
        // (the box is presented rotated, like the sample's landscape form).
        const boxLeft = 28 * scale;
        const boxTop = 26 * scale;
        const boxW = 205 * scale;
        const boxH = height - (52 * scale);
        const colY = boxTop + (boxH / 2);
        const col = (offset: number) => boxLeft + (offset * scale);

        // Frame
        objects.push(new fabric.Rect({
            id: 'security-box-frame', // UNIQUE ID
            left: boxLeft, top: boxTop, width: boxW, height: boxH,
            fill: 'transparent', stroke: '#888', strokeWidth: 1.2 * scale,
            selectable: true, evented: true, hasControls: true
        } as any));

        const colText = (id: string, text: string, offset: number, fontSize: number, fontWeight: string, fill: string) => {
            objects.push(new fabric.Text(text, {
                id,
                left: col(offset),
                top: colY,
                fontSize: fontSize * scale,
                fontWeight,
                fontFamily: 'Arial',
                fill,
                angle: 90,
                originX: 'center',
                originY: 'center',
                selectable: true, evented: true, hasControls: true
            } as any));
        };

        // Padlock certification line + alteration warning
        colText('security-header',
            "Padlock design is a certification mark of the Check Payment Systems Association",
            20, 6.5, 'normal', '#111');
        colText('security-warning',
            "Warning: Absence of the following Security Features may indicate alteration",
            36, 6.5, 'bold', '#111');

        // Feature list: name + description columns, as printed on the sample
        const features: Array<[string, string]> = [
            ["MP Microprint", "Tiny type on front and back of document fills in to form solid lines when scanned or photocopied."],
            ["Security Pantograph", "Copy resistant security pantograph on front of document discourages clear duplication."],
            ["Warning Bands/MP Padlock Logos", "Warn receivers to be aware of detailed security features."],
            ["Security Screen Backer", "\"Original Document\" text, and weave pattern visible on back of check, will not appear if scanned or photocopied."]
        ];
        features.forEach(([name, desc], i) => {
            const base = 52 + (i * 30);
            colText(`security-feature-${i}`, name, base, 6.5, '600', '#111');
            colText(`security-feature-desc-${i}`, desc, base + 13, 5.2, 'normal', '#222');
        });

        // Reg. C.C. line (bottom of the box on the sample)
        colText('security-regcc',
            "* FEDERAL RESERVE BOARD OF GOVERNORS REG. C.C.",
            178, 6, 'bold', '#111');
    }

}
