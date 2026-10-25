import { fabric } from 'fabric';

/**
 * CheckBackEngine - standard bank check back layout
 *
 * Arranged the way real check backs are printed (the previous design was
 * built sideways - a vertical endorsement strip down the right edge with
 * every text rotated 90 degrees, and a background panel that did not
 * cover the full page):
 * - Full-page background.
 * - Endorsement band across the TOP: "ENDORSE HERE", the X mark and three
 *   horizontal endorsement lines, with the mobile-deposit checkbox and
 *   instruction to the right of the lines.
 * - A divider line under the band with "DO NOT WRITE, SIGN OR STAMP BELOW
 *   THIS LINE", then "RESERVED FOR FINANCIAL INSTITUTION USE*" - the rest
 *   of the page stays clear for bank stamps.
 * - Security-features box, upright and readable, at the bottom-left.
 * - Faint ORIGINAL / DOCUMENT watermark centred on the page, sized to fit.
 * - Reg CC legal line along the bottom edge.
 * Every object keeps a stable unique 'id' for position persistence.
 */
export class CheckBackEngine {
    static generateCheckBack(width: number, height: number, config: any, scaleFactor: number, depositConfig?: any, signatureImage?: string | null): fabric.Object[] {
        const objects: fabric.Object[] = [];
        const scale = scaleFactor / 72;
        const style = config.style || 'mobile'; // Default to mobile if not specified

        const bandH = height * 0.44; // endorsement band across the top

        // 0. Backgrounds: one full-page panel (covers the whole back) plus a
        // lighter tint over the endorsement band.
        objects.push(new fabric.Rect({
            id: 'back-bg-left',
            left: 0,
            top: 0,
            width: width,
            height: height,
            fill: '#e3f2fd',
            selectable: true, evented: true, hasControls: true, lockRotation: true
        } as any));

        objects.push(new fabric.Rect({
            id: 'back-bg-right',
            left: 0,
            top: 0,
            width: width,
            height: bandH,
            fill: '#ffffff',
            opacity: 0.45,
            selectable: true, evented: true, hasControls: true, lockRotation: true
        } as any));

        // 1. Watermark (centred, behind everything else)
        this.addWatermark(width, height, objects);

        // 2. Endorsement band (top)
        this.addEndorsementBand(width, height, scale, bandH, objects, style);

        // 3. Divider + reserved area notices
        this.addReservedArea(width, height, scale, bandH, objects);

        // 4. Security features box (bottom-left, upright)
        this.addSecurityBox(width, height, scale, objects);

        // 5. Legal line (bottom edge)
        objects.push(new fabric.Text("FEDERAL RESERVE REG CC COMPLIANT", {
            id: 'legal-text-compliance',
            left: 36 * scale,
            top: height - (14 * scale),
            fontSize: 6 * scale,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: '#999',
            selectable: true, evented: true, hasControls: true
        } as any));

        return objects;
    }

    private static addWatermark(width: number, height: number, objects: fabric.Object[]): void {
        const commonProps = {
            left: width / 2,
            // Sized from the page width so each word fits INSIDE the paper.
            fontSize: Math.max(38, width * 0.088),
            fontFamily: 'Arial Black, Arial',
            fontWeight: 900,
            fill: 'rgba(180, 180, 180, 0.16)',
            originX: 'center',
            originY: 'center',
            selectable: true, evented: true, hasControls: true,
            charSpacing: width * 0.02
        };

        objects.push(new fabric.Text("ORIGINAL", {
            ...commonProps,
            id: 'watermark-original',
            top: height * 0.40
        } as any));

        objects.push(new fabric.Text("DOCUMENT", {
            ...commonProps,
            id: 'watermark-document',
            top: height * 0.60
        } as any));
    }

    private static addEndorsementBand(width: number, height: number, scale: number, bandH: number, objects: fabric.Object[], style: string): void {
        const marginX = 36 * scale;
        const lineStartX = 58 * scale;
        const lineEndX = width * 0.60;
        const firstLineY = 52 * scale;
        const lineGap = 32 * scale;

        // "ENDORSE HERE" header
        objects.push(new fabric.Text("ENDORSE HERE", {
            id: 'endorse-header',
            left: marginX,
            top: 14 * scale,
            fontSize: 11 * scale,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: '#333',
            selectable: true, evented: true, hasControls: true
        } as any));

        // Signature X (sits just left of the first line)
        objects.push(new fabric.Text("X", {
            id: 'endorse-x',
            left: marginX,
            top: firstLineY - (8 * scale),
            fontSize: 16 * scale,
            fontFamily: 'Arial',
            fill: '#000',
            selectable: true, evented: true, hasControls: true
        } as any));

        // 3 horizontal endorsement lines
        for (let i = 0; i < 3; i++) {
            const ly = firstLineY + (i * lineGap);
            objects.push(new fabric.Line([lineStartX, ly, lineEndX, ly], {
                id: `endorse-line-${i}`,
                stroke: '#bbb',
                strokeWidth: 1.5 * scale,
                selectable: true, evented: true, hasControls: true
            } as any));
        }

        // Mobile deposit checkbox + instruction, right of the lines
        if (style === 'mobile') {
            const cbX = width * 0.66;
            const cbY = firstLineY - (8 * scale);

            objects.push(new fabric.Rect({
                id: 'mobile-checkbox',
                left: cbX,
                top: cbY,
                width: 16 * scale,
                height: 16 * scale,
                fill: 'transparent',
                stroke: '#222',
                strokeWidth: 1.5 * scale,
                selectable: true, evented: true, hasControls: true
            } as any));

            objects.push(new fabric.Text("CHECK HERE IF MOBILE DEPOSIT", {
                id: 'mobile-instruction',
                left: cbX + (24 * scale),
                top: cbY + (3 * scale),
                fontSize: 8 * scale,
                fontWeight: 'bold',
                fontFamily: 'Arial',
                fill: '#222',
                selectable: true, evented: true, hasControls: true
            } as any));
        }
    }

    private static addReservedArea(width: number, height: number, scale: number, bandH: number, objects: fabric.Object[]): void {
        const marginX = 36 * scale;

        // Divider line under the endorsement band
        objects.push(new fabric.Line([0, bandH, width, bandH], {
            id: 'endorse-divider',
            stroke: '#999',
            strokeWidth: 1.2 * scale,
            selectable: true, evented: true, hasControls: true
        } as any));

        objects.push(new fabric.Text("DO NOT WRITE, SIGN OR STAMP BELOW THIS LINE", {
            id: 'endorse-warning',
            left: marginX,
            top: bandH + (9 * scale),
            fontSize: 8 * scale,
            fontWeight: '800',
            fontFamily: 'Arial',
            fill: '#444',
            selectable: true, evented: true, hasControls: true
        } as any));

        objects.push(new fabric.Text("RESERVED FOR FINANCIAL INSTITUTION USE*", {
            id: 'endorse-reserved',
            left: marginX,
            top: bandH + (25 * scale),
            fontSize: 7 * scale,
            fontFamily: 'Arial',
            fill: '#888',
            selectable: true, evented: true, hasControls: true
        } as any));
    }

    private static addSecurityBox(width: number, height: number, scale: number, objects: fabric.Object[]): void {
        const boxLeft = 36 * scale;
        const boxW = width * 0.44;
        const boxH = height * 0.32;
        const boxTop = height - boxH - (24 * scale);

        // Frame
        objects.push(new fabric.Rect({
            id: 'security-box-frame',
            left: boxLeft, top: boxTop, width: boxW, height: boxH,
            fill: 'transparent', stroke: '#888', strokeWidth: 1.2 * scale,
            selectable: true, evented: true, hasControls: true
        } as any));

        // Header
        objects.push(new fabric.Text("SECURITY FEATURES", {
            id: 'security-header',
            left: boxLeft + (10 * scale),
            top: boxTop + (8 * scale),
            fontSize: 9 * scale,
            fontWeight: 'bold',
            fontFamily: 'Arial',
            fill: '#111',
            selectable: true, evented: true, hasControls: true
        } as any));

        // Feature list: two upright columns of three
        const features = [
            "• AUTHENTIC DOCUMENT WATERMARK",
            "• ROUTING NUMBER VERIFICATION",
            "• SECURITY SCREEN BACKDROP",
            "• MICROPRINTING ALONG LINES (MP)",
            "• CHEMICAL SENSITIVE PAPER STOCK",
            "• FLUORESCENT FIBER TECHNOLOGY"
        ];
        const colGapX = boxW / 2;
        const rowStartY = boxTop + (30 * scale);
        const rowGap = 17 * scale;

        features.forEach((f, i) => {
            const col = i < 3 ? 0 : 1;
            const row = i % 3;
            objects.push(new fabric.Text(f, {
                id: `security-feature-${i}`,
                left: boxLeft + (10 * scale) + (col * colGapX),
                top: rowStartY + (row * rowGap),
                fontSize: 7 * scale,
                fontFamily: 'Arial',
                fontWeight: '600',
                fill: '#222',
                selectable: true, evented: true, hasControls: true
            } as any));
        });
    }
}
