import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import crypto from 'crypto';

export async function encryptPDF(pdfBytes, password) {
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Set encryption
    pdfDoc.setCreator('Premium Check Generator');
    pdfDoc.setAuthor('Check Generator Pro');
    pdfDoc.setTitle('Secure Check Document');
    pdfDoc.setSubject('Financial Check');
    pdfDoc.setKeywords(['check', 'bank', 'financial', 'secure']);

    // Encrypt with password
    const encryptedBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
        permissions: {
            printing: 'lowResolution',
            modifying: false,
            copying: false,
            annotating: false,
            fillingForms: false,
            contentAccessibility: false,
            documentAssembly: false
        },
        password: password || generateRandomPassword()
    });

    return encryptedBytes;
}

function generateRandomPassword() {
    return crypto.randomBytes(16).toString('hex');
}

export async function addDigitalSignature(pdfBytes, certificate) {
    // This would require a proper digital certificate implementation
    // For demonstration, we'll add a signature appearance

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Add signature field
    const form = pdfDoc.getForm();
    const signatureField = form.createSignatureField('signature');

    // Position signature field
    signatureField.acroField.setRectangle([
        400, // x
        50,  // y
        550, // width
        80   // height
    ]);

    return await pdfDoc.save();
}