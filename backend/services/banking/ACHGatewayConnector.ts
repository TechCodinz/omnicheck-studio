/**
 * ACHGatewayConnector
 * 
 * Handles secure transmission of ACH files to the ODFI (Originating Bank).
 * Uses SFTP or HTTPS Secure Upload.
 * 
 * NOTE: For this implementation, we simulate the transmission with a 
 * success trace ID, as we don't have real banking credentials.
 */
import * as fs from 'fs';
import * as path from 'path';

export class ACHGatewayConnector {
    private gatewayUrl: string;
    private sftpPath: string;
    private localOutbox: string;

    constructor() {
        this.gatewayUrl = process.env.ACH_GATEWAY_URL || 'sftp.federalreserve.gov';
        this.sftpPath = '/inbound/ach/production';

        // Setup local simulation directory
        this.localOutbox = path.join(__dirname, '../../../data/sftp_out');
        if (!fs.existsSync(this.localOutbox)) {
            fs.mkdirSync(this.localOutbox, { recursive: true });
        }
    }

    /**
     * Transmits an ACH file to the banking network (Simulated via Local SFTP)
     */
    async transmitFile(fileContent: string, fileName: string): Promise<ACHTransmissionResult> {
        console.log(`[ACH GATEWAY] Connecting to ${this.gatewayUrl}...`);
        console.log(`[ACH GATEWAY] Uploading ${fileName} (${fileContent.length} bytes)...`);

        // Simulate network latency (0.8s - 2.5s)
        const latency = 800 + Math.random() * 1700;
        await new Promise(resolve => setTimeout(resolve, latency));

        try {
            // Write to local "SFTP" folder
            const filePath = path.join(this.localOutbox, fileName);
            fs.writeFileSync(filePath, fileContent);

            // Generate ODFI confirmation file
            const traceId = `ACH-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
            const responseFile = {
                file: fileName,
                status: 'ACCEPTED',
                traceId: traceId,
                timestamp: new Date().toISOString(),
                odfi: 'Wells Fargo / Federal Reserve Gateway',
                message: 'File received and validated structure.'
            };
            fs.writeFileSync(
                path.join(this.localOutbox, `${fileName}.response.json`),
                JSON.stringify(responseFile, null, 2)
            );

            console.log(`[ACH GATEWAY] Upload Complete. File accepted by ODFI (Trace: ${traceId}).`);
            console.log(`[ACH GATEWAY] File persisted to: ${filePath}`);

            // 1% Chance of random network failure
            if (Math.random() > 0.99) {
                throw new Error('Connection reset by peer');
            }

            return {
                success: true,
                traceId: traceId,
                timestamp: new Date().toISOString(),
                status: 'ACCEPTED'
            };

        } catch (error: any) {
            console.error('[ACH GATEWAY] Transmission Failed:', error.message);
            return {
                success: false,
                traceId: `ERR-${Date.now()}`,
                timestamp: new Date().toISOString(),
                status: 'REJECTED',
                error: error.message
            };
        }
    }
}

export interface ACHTransmissionResult {
    success: boolean;
    traceId: string;
    timestamp: string;
    status: 'ACCEPTED' | 'REJECTED';
    error?: string;
}
