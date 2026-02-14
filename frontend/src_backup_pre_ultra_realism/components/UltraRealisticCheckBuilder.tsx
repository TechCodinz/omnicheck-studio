import React, { useState, useRef, useEffect } from 'react';
import {
    PhysicalPropertiesEngine,
    PaperType
} from '../engines/PhysicalPropertiesEngine';
import {
    HandwritingEngine
} from '../engines/HandwritingEngine';
import { CheckCloneEngine, CheckType } from '../engines/CheckCloneEngine';
import { BankAcceptanceValidator, ValidationResult } from '../validators/BankAcceptanceValidator';
import { ultraRealisticTemplates } from '../data/ultraRealisticTemplates';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { fabric } from 'fabric';
import UltimateCustomizationPanel from './UltimateCustomizationPanel'; // Import Panel

export type ExportFormat = 'pdf-high-res' | 'pdf-mobile' | 'png-print' | 'svg-vector' | 'ach-file' | 'batch-payroll';

const UltraRealisticCheckBuilder: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<'upload' | 'design' | 'customize' | 'validate' | 'export'>('upload');
    const [selectedPaper, setSelectedPaper] = useState<PaperType>('premium');
    const [penType, setPenType] = useState<'ballpoint' | 'fountain' | 'gel' | 'rollerball'>('ballpoint');
    const [inkColor, setInkColor] = useState('blue-black');
    const [checkType, setCheckType] = useState<CheckType>('business');
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    const threeContainerRef = useRef<HTMLDivElement>(null);
    const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    // Use useMemo or useRef to initialize engines to avoid re-instantiation on every render, 
    // but for simplicity following the provided structure.
    const physicalEngine = new PhysicalPropertiesEngine();
    const handwritingEngine = new HandwritingEngine();
    const cloneEngine = new CheckCloneEngine();
    const validator = new BankAcceptanceValidator();

    // Initialize 3D scene
    useEffect(() => {
        if (!threeContainerRef.current) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75,
            threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight,
            0.1, 1000
        );
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        renderer.setSize(
            threeContainerRef.current.clientWidth,
            threeContainerRef.current.clientHeight
        );
        renderer.setPixelRatio(window.devicePixelRatio);
        threeContainerRef.current.appendChild(renderer.domElement);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        scene.add(directionalLight);

        // Add controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Create check paper
        const paperTexture = physicalEngine.generatePaperTexture(selectedPaper, {
            aged: false,
            securityFibers: true
        });

        const paperMesh = physicalEngine.generate3DPaperEffect(paperTexture);
        scene.add(paperMesh);

        camera.position.z = 5;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!threeContainerRef.current) return;

            camera.aspect = threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(
                threeContainerRef.current.clientWidth,
                threeContainerRef.current.clientHeight
            );
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            if (threeContainerRef.current) {
                threeContainerRef.current.removeChild(renderer.domElement);
            }
        };
    }, [selectedPaper]); // Re-run effect when selectedPaper changes

    // Handle check upload and cloning
    const handleCheckUpload = async (file: File) => {
        setCurrentStep('design');

        // Extract template from uploaded check
        const clonedTemplate = await cloneEngine.cloneExactCheck(file, checkType);

        // Initialize fabric canvas with cloned template
        if (fabricCanvasRef.current) {
            // Mock loading JSON since fabric types in basic setup might be tricky without full mock
            // In real app: fabricCanvasRef.current.loadFromJSON(...)
            console.log('Template loaded:', clonedTemplate);
        }
    };

    // Capture handwritten signature
    const startSignatureCapture = () => {
        if (!signatureCanvasRef.current) return;

        const session = handwritingEngine.startHandwritingCapture(
            signatureCanvasRef.current,
            (signatureData) => {
                // Apply signature to check
                const signatureGroup = handwritingEngine.createHandwrittenSignature(
                    'Signature',
                    penType,
                    inkColor,
                    { withTremor: true, cursive: true }
                );

                // Add to 3D scene or fabric canvas
                console.log('Signature captured:', signatureData);
            }
        );
    };

    // Validate for bank acceptance
    const validateCheck = async () => {
        // Mock gathering check data
        const checkData: any = {
            id: 'mock-id',
            amount: 100.00
            // ... populate with real data
        };

        const result = await validator.validateForBankAcceptance(checkData, 'ALL');
        setValidationResult(result);
        setCurrentStep('validate');

        // Generate acceptance certificate
        if (result.isValid) {
            const certificate = validator.generateAcceptanceCertificate(checkData, result);
            console.log('Bank Acceptance Certificate:', certificate);
        }
    };

    // Export in various formats
    const exportCheck = async (format: ExportFormat) => {
        console.log('Exporting as:', format);
        // Implementation would call corresponding export services
    };

    return (
        <div className="ultra-realistic-builder">
            {/* Step Navigation */}
            <div className="builder-steps">
                <StepIndicator step={1} current={currentStep === 'upload'} label="Upload/Clone" />
                <StepIndicator step={2} current={currentStep === 'design'} label="Design" />
                <StepIndicator step={3} current={currentStep === 'customize'} label="Customize" />
                <StepIndicator step={4} current={currentStep === 'validate'} label="Validate" />
                <StepIndicator step={5} current={currentStep === 'export'} label="Export" />
            </div>

            {/* Main Content */}
            <div className="builder-content">
                {currentStep === 'upload' && (
                    <UploadStep onUpload={handleCheckUpload} />
                )}

                {currentStep === 'design' && (
                    <div className="design-container">
                        {/* 3D Paper Preview */}
                        <div className="paper-preview-3d" ref={threeContainerRef} style={{ width: '100%', height: '400px' }} />

                        {/* Paper Selection */}
                        <div className="paper-selection">
                            <h3>Select Paper Type</h3>
                            <div className="paper-grid">
                                {Object.entries(ultraRealisticTemplates).map(([key, paper]) => (
                                    <PaperCard
                                        key={key}
                                        paper={paper}
                                        selected={selectedPaper === key}
                                        onClick={() => setSelectedPaper(key as PaperType)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 'customize' && (
                    <div className="customization-wrapper" style={{ width: '100%', height: '100%' }}>
                        <UltimateCustomizationPanel
                            onDelivery={(method) => {
                                console.log('Delivery method selected:', method);
                                // Optional: auto-advance to export or handle here
                            }}
                        />
                    </div>
                )}

                {currentStep === 'validate' && validationResult && (
                    <ValidationStep result={validationResult} />
                )}

                {currentStep === 'export' && (
                    <ExportStep onExport={exportCheck} />
                )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
                {currentStep !== 'upload' && (
                    <button onClick={() => setCurrentStep(prev => {
                        const steps = ['upload', 'design', 'customize', 'validate', 'export'];
                        const currentIndex = steps.indexOf(prev);
                        return steps[Math.max(0, currentIndex - 1)] as any;
                    })}>
                        Previous
                    </button>
                )}

                {currentStep !== 'export' && (
                    <button onClick={() => {
                        if (currentStep === 'validate') {
                            validateCheck();
                        } else {
                            setCurrentStep(prev => {
                                const steps = ['upload', 'design', 'customize', 'validate', 'export'];
                                const currentIndex = steps.indexOf(prev);
                                return steps[Math.min(steps.length - 1, currentIndex + 1)] as any;
                            });
                        }
                    }}>
                        {currentStep === 'validate' ? 'Validate Check' : 'Next'}
                    </button>
                )}
            </div>
        </div>
    );
};

// Supporting Components

const StepIndicator: React.FC<{ step: number; current: boolean; label: string }> = ({ step, current, label }) => (
    <div className={`step ${current ? 'active' : ''}`}>
        <div className="step-number">{step}</div>
        <div className="step-label">{label}</div>
    </div>
);

const UploadStep: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => (
    <div className="upload-step">
        <input type="file" onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
        <p>Upload a check image to clone</p>
    </div>
);

const InkColorButton: React.FC<{ color: string; name: string; selected: boolean; onClick: () => void }> = ({ color, name, selected, onClick }) => (
    <button
        style={{ backgroundColor: color, width: '30px', height: '30px', borderRadius: '50%', border: selected ? '2px solid black' : 'none' }}
        title={name}
        onClick={onClick}
    />
);

const CheckTypeCard: React.FC<{ type: string; selected: boolean; onClick: () => void }> = ({ type, selected, onClick }) => (
    <div className={`check-type-card ${selected ? 'selected' : ''}`} onClick={onClick}>
        <h4>{type.toUpperCase()}</h4>
    </div>
);

const PaperCard: React.FC<{
    paper: any;
    selected: boolean;
    onClick: () => void;
}> = ({ paper, selected, onClick }) => (
    <div className={`paper-card ${selected ? 'selected' : ''}`} onClick={onClick}>
        <div className="paper-info">
            <h4>{paper.name}</h4>
            <p>{paper.description}</p>
            {/* 
        This div was using inline styles with complex gradients/textures which might require more setup.
        Simplified for brevity.
      */}
        </div>
    </div>
);

const StatBox: React.FC<{ label: string; value: string | number; type: string }> = ({ label, value, type }) => (
    <div className={`stat-box ${type}`}>
        <div className="value">{value}</div>
        <div className="label">{label}</div>
    </div>
);

const ValidationStep: React.FC<{ result: ValidationResult }> = ({ result }) => (
    <div className="validation-results">
        <div className={`validation-header ${result.isValid ? 'valid' : 'invalid'}`}>
            <h2>{result.isValid ? '✅ Check Ready for Deposit' : '❌ Check Needs Adjustments'}</h2>
            <div className="validation-score">
                <div className="score-circle">
                    <span>{result.score}%</span>
                </div>
                <p>Acceptance Score</p>
            </div>
        </div>

        <div className="validation-details">
            <div className="stats-grid">
                <StatBox label="Passed Tests" value={result.passedTests.length} type="success" />
                <StatBox label="Failed Tests" value={result.failedTests.length} type="error" />
                <StatBox label="Warnings" value={result.warnings.length} type="warning" />
                <StatBox label="Acceptance Rate" value={`${result.estimatedAcceptanceRate}%`} type="info" />
            </div>

            <div className="test-results">
                <h3>Test Results</h3>
                <div className="results-list">
                    {result.passedTests.map((test, i) => (
                        <div key={i} className="test-result passed">
                            ✅ {test}
                        </div>
                    ))}
                    {result.failedTests.map((test, i) => (
                        <div key={i} className="test-result failed">
                            ❌ {test}
                        </div>
                    ))}
                    {result.warnings.map((warning, i) => (
                        <div key={i} className="test-result warning">
                            ⚠️ {warning}
                        </div>
                    ))}
                </div>
            </div>

            {result.recommendations.length > 0 && (
                <div className="recommendations">
                    <h3>Recommendations</h3>
                    <ul>
                        {result.recommendations.map((rec, i) => (
                            <li key={i}>• {rec}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    </div>
);

const ExportOption: React.FC<{
    title: string;
    description: string;
    format: string;
    recommendedFor: string[];
    onClick: () => void;
}> = ({ title, description, recommendedFor, onClick }) => (
    <div className="export-option" onClick={onClick}>
        <h4>{title}</h4>
        <p>{description}</p>
        <div className="recommended-for">
            {recommendedFor.map(r => <span key={r} className="tag">{r}</span>)}
        </div>
    </div>
);

const ExportStep: React.FC<{ onExport: (format: ExportFormat) => void }> = ({ onExport }) => (
    <div className="export-options">
        <h2>Export Check</h2>
        <p className="export-description">
            Choose export format based on your deposit method
        </p>

        <div className="export-grid">
            <ExportOption
                title="High-Resolution PDF"
                description="Print-ready, 300 DPI with all security features"
                format="pdf-high-res"
                recommendedFor={['Bank Teller', 'Business Records']}
                onClick={() => onExport('pdf-high-res')}
            />

            <ExportOption
                title="Mobile Deposit PDF"
                description="Optimized for mobile banking apps"
                format="pdf-mobile"
                recommendedFor={['Chase Mobile', 'Bank of America', 'Wells Fargo']}
                onClick={() => onExport('pdf-mobile')}
            />

            <ExportOption
                title="Print-Ready PNG"
                description="High-quality image for printing"
                format="png-print"
                recommendedFor={['Home Printing', 'Office Printing']}
                onClick={() => onExport('png-print')}
            />

            <ExportOption
                title="Vector SVG"
                description="Scalable vector for professional printing"
                format="svg-vector"
                recommendedFor={['Commercial Printing', 'Archival']}
                onClick={() => onExport('svg-vector')}
            />

            <ExportOption
                title="ACH File"
                description="Electronic payment file for direct deposit"
                format="ach-file"
                recommendedFor={['Payroll', 'Vendor Payments']}
                onClick={() => onExport('ach-file')}
            />

            <ExportOption
                title="Payroll Batch"
                description="Multiple checks for payroll processing"
                format="batch-payroll"
                recommendedFor={['Employee Payments', 'Contractor Payments']}
                onClick={() => onExport('batch-payroll')}
            />
        </div>

        <div className="export-tips">
            <h3>📋 Deposit Tips</h3>
            <ul>
                <li>For mobile deposit: Ensure good lighting and flat surface</li>
                <li>For bank deposit: Print on check stock paper for best results</li>
                <li>Keep digital copy for 7 years for record keeping</li>
                <li>Endorse check with "For Deposit Only" for security</li>
            </ul>
        </div>
    </div>
);

export default UltraRealisticCheckBuilder;
