export const ultraRealisticTemplates = {
    // Premium Cotton Paper (100% Cotton Fiber)
    premiumCotton: {
        name: "100% Cotton Premium",
        description: "Bank-grade cotton paper with watermark and security fibers",
        physicalProperties: {
            weight: "24 lb",
            thickness: "0.12 mm",
            opacity: "94%",
            brightness: "92",
            fiberContent: "100% cotton",
            finish: "laid finish"
        },
        textures: {
            base: "cotton-weave",
            fibers: {
                count: 5000,
                colors: ["#f5f5f0", "#fafaf5", "#fffefa", "#f0f0eb"],
                length: "2-10mm",
                distribution: "random"
            },
            watermark: {
                type: "genuine",
                pattern: "diagonal-lines",
                intensity: 0.1,
                visibility: "transmitted-light"
            },
            surface: {
                roughness: 3.2,
                smoothness: "extra-smooth",
                gloss: "matte"
            }
        },
        securityFeatures: {
            fibers: {
                fluorescent: true,
                colors: ["red", "blue", "green"],
                distribution: "random"
            },
            watermark: "bank-logo",
            microprint: "border-and-background",
            reaction: {
                toBleach: "stains-brown",
                toHeat: "discolors",
                toLight: "fades-slowly"
            }
        },
        printingProperties: {
            inkAbsorption: "low",
            dryingTime: "fast",
            bleedResistance: "high",
            smudgeResistance: "excellent"
        }
    },

    // Security Paper with Thread
    securityThreaded: {
        name: "Security Thread Embedded",
        description: "Paper with embedded holographic security thread",
        physicalProperties: {
            weight: "28 lb",
            thickness: "0.15 mm",
            opacity: "96%",
            brightness: "94",
            fiberContent: "cotton-linen blend",
            finish: "wove finish"
        },
        textures: {
            base: "security-weave",
            securityThread: {
                type: "holographic",
                width: "1.5mm",
                position: "centered",
                pattern: "microtext-bankname",
                visible: "transmitted-light",
                uvReactive: true
            },
            planchettes: {
                enabled: true,
                count: 150,
                colors: ["red", "green", "blue"],
                size: "0.5-2mm",
                distribution: "random"
            },
            surface: {
                roughness: 2.8,
                smoothness: "premium",
                gloss: "satin"
            }
        },
        securityFeatures: {
            thread: {
                metallic: true,
                magnetic: true,
                uvReactive: true,
                irVisible: true
            },
            planchettes: {
                fluorescent: true,
                colorChanging: false,
                thermochromic: false
            },
            copyDetection: {
                pattern: "void-pantograph",
                reaction: "void-appears"
            }
        }
    },

    // Recycled Business Paper
    recycledBusiness: {
        name: "Eco Recycled Business",
        description: "Environmentally friendly recycled paper with natural texture",
        physicalProperties: {
            weight: "20 lb",
            thickness: "0.10 mm",
            opacity: "90%",
            brightness: "84",
            fiberContent: "100% post-consumer recycled",
            finish: "natural"
        },
        textures: {
            base: "recycled-speckle",
            specks: {
                count: 8000,
                colors: ["#8b4513", "#654321", "#d2b48c"],
                size: "0.1-1mm",
                distribution: "clustered"
            },
            fibers: {
                visible: true,
                variedLength: true,
                naturalColors: true
            },
            surface: {
                roughness: 4.5,
                smoothness: "natural",
                gloss: "low-matte"
            }
        },
        securityFeatures: {
            uvFibers: false,
            watermark: "subtle-eco-logo",
            reaction: {
                toBleach: "discolors",
                toHeat: "normal",
                toLight: "fades-naturally"
            }
        },
        ecoProperties: {
            recycledContent: "100%",
            fscCertified: true,
            chlorineFree: true,
            acidFree: true
        }
    },

    // Checkbook Standard
    checkbookStandard: {
        name: "Checkbook Standard",
        description: "Standard checkbook paper with carbonless copy feature",
        physicalProperties: {
            weight: "22 lb",
            thickness: "0.11 mm",
            opacity: "92%",
            brightness: "88",
            fiberContent: "wood-pulp blend",
            finish: "vellum"
        },
        textures: {
            base: "standard-check",
            carbonless: {
                enabled: true,
                layers: 2,
                cbCoating: true,
                cfCoating: true
            },
            perforation: {
                type: "micro-perf",
                spacing: "3-inch",
                strength: "easy-tear"
            },
            surface: {
                roughness: 3.5,
                smoothness: "business",
                gloss: "matte"
            }
        },
        functionalFeatures: {
            carbonCopy: true,
            stubRetention: true,
            filingPerforation: true,
            numbering: "sequential"
        }
    },

    // Ultra Premium with Foil
    ultraPremiumFoil: {
        name: "Ultra Premium Foil Stamp",
        description: "Luxury paper with hot foil stamping and embossing",
        physicalProperties: {
            weight: "32 lb",
            thickness: "0.18 mm",
            opacity: "98%",
            brightness: "96",
            fiberContent: "cotton-silk blend",
            finish: "linen"
        },
        textures: {
            base: "linen-weave",
            foilStamping: {
                areas: ["logo", "border", "signature-line"],
                colors: ["gold", "silver", "holographic"],
                technique: "hot-foil"
            },
            embossing: {
                areas: ["company-name", "amount-box"],
                depth: "0.3mm",
                technique: "blind-emboss"
            },
            deckleEdge: {
                enabled: true,
                style: "hand-torn",
                irregularity: "natural"
            }
        },
        luxuryFeatures: {
            foilStamping: true,
            embossing: true,
            deckleEdges: true,
            tippedOn: false,
            handNumbered: true
        }
    },

    // Mobile Deposit Optimized
    mobileOptimized: {
        name: "Mobile Deposit Ready",
        description: "Paper optimized for mobile deposit scanning",
        physicalProperties: {
            weight: "20 lb",
            thickness: "0.10 mm",
            opacity: "95%",
            brightness: "95",
            fiberContent: "smooth-wood",
            finish: "high-smooth"
        },
        textures: {
            base: "mobile-optimized",
            contrast: {
                foreground: "enhanced",
                background: "reduced",
                micrContrast: "maximum"
            },
            reflection: {
                glareReduction: true,
                matteAreas: ["signature", "amount"],
                antiGlareCoating: true
            },
            corners: {
                rounded: true,
                radius: "3mm",
                darkContrast: true
            }
        },
        mobileFeatures: {
            qrCode: true,
            depositGuidelines: true,
            cameraTargets: true,
            shadowElimination: true,
            autoCropMarkers: true
        },
        compatibility: {
            chaseMobile: "excellent",
            bankOfAmerica: "excellent",
            wellsFargo: "excellent",
            citiMobile: "excellent",
            usaa: "excellent"
        }
    }
};
