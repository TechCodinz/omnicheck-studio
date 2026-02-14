export interface CashiersCheckSpecs {
    issuingBank: string;
    bankOfficerSignature: string;
    bankStamp: string;
    guaranteeNumber: string;
    drawnOn: string; // "Treasurer" or specific officer
    issuerTitle: string;
    verificationPhone: string;
    clearingHouseCode: string;
    settlementDate: string;
    certifiedAmount: number;
    maxLiability: number;
}

export interface ECheckSpecs {
    ACHCompanyId: string;
    ACHBatchNumber: string;
    SECCode: 'CCD' | 'PPD' | 'WEB' | 'TEL';
    DFIAccountNumber: string;
    ODFIName: string;
    ODFIId: string;
    transactionCode: 22 | 23 | 27 | 28 | 32 | 33 | 37 | 38;
    traceNumber: string;
    addendaRecords: number;
    discretionaryData: string;
    entryDescription: string;
}

export interface CertifiedCheckSpecs {
    certificationDate: string;
    certifyingBank: string;
    certificationNumber: string;
    holdPeriod: number; // days
    guaranteePeriod: number; // days
    verificationRequired: boolean;
    officerName: string;
    officerId: string;
}

export interface TravelersCheckSpecs {
    issuer: 'AmericanExpress' | 'Visa' | 'ThomasCook';
    checkSerial: string;
    purchaseDate: string;
    purchaseLocation: string;
    purchaserSignature: string;
    countersignature: string;
    refundPhone: string;
    denominations: number[];
    securityQuestions: string[];
}

export interface GovernmentCheckSpecs {
    agencyName: string;
    treasurySymbol: string;
    treasuryAccount: string;
    appropriationCode: string;
    scheduleNumber: string;
    fiscalYear: string;
    paymentVoucher: string;
    appropriationManager: string;
    grantNumber?: string;
    contractNumber?: string;
}
