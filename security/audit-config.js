module.exports = {
    securityStandards: {
        pciDSS: {
            enabled: true,
            requirements: [
                'encryptAllSensitiveData',
                'secureKeyManagement',
                'accessControl',
                'monitoringAndTesting',
                'informationSecurityPolicy'
            ]
        },
        soc2: {
            enabled: true,
            principles: ['security', 'availability', 'processingIntegrity', 'confidentiality', 'privacy']
        },
        gdpr: {
            enabled: true,
            requirements: ['dataMinimization', 'purposeLimitation', 'storageLimitation', 'integrityAndConfidentiality']
        }
    },

    encryption: {
        algorithm: 'aes-256-gcm',
        keyRotation: '30 days',
        keyStorage: 'awsKms',
        dataAtRest: 'encrypted',
        dataInTransit: 'tls1.3'
    },

    monitoring: {
        realTimeAlerts: true,
        anomalyDetection: true,
        auditLogging: true,
        siemIntegration: true,
        fraudDetection: {
            machineLearning: true,
            patternRecognition: true,
            velocityChecking: true,
            geolocationAnalysis: true
        }
    },

    accessControl: {
        mfa: true,
        roleBased: true,
        leastPrivilege: true,
        sessionTimeout: '15 minutes',
        ipWhitelisting: true,
        deviceFingerprinting: true
    },

    compliance: {
        checkRetention: '7 years',
        auditTrail: true,
        versionControl: true,
        changeManagement: true,
        disasterRecovery: {
            rto: '4 hours',
            rpo: '15 minutes',
            backupFrequency: 'hourly'
        }
    }
};
