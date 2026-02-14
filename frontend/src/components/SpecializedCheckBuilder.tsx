import React, { useState } from 'react';
import { CashiersCheckSpecs, ECheckSpecs, CertifiedCheckSpecs } from '../types/specializedChecks';

export const SpecializedCheckBuilder: React.FC = () => {
    const [checkType, setCheckType] = useState<'personal' | 'business' | 'cashier' | 'echeck' | 'certified' | 'travelers'>('personal');

    const renderCashiersCheckForm = () => (
        <div className="cashier-check-form">
            <h3>Cashier's Check Specifications</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label>Issuing Bank/Branch</label>
                    <input type="text" placeholder="Main Branch, City, State" />
                </div>
                <div className="form-group">
                    <label>Bank Officer Name</label>
                    <input type="text" placeholder="Jane Smith, Vice President" />
                </div>
                <div className="form-group">
                    <label>Bank Officer Signature</label>
                    <div className="signature-box">
                        <canvas id="officerSignature" width="300" height="100"></canvas>
                        <button>Draw Signature</button>
                    </div>
                </div>
                <div className="form-group">
                    <label>Guarantee Number</label>
                    <input type="text" placeholder="G-2024-123456" />
                </div>
                <div className="form-group">
                    <label>Verification Phone</label>
                    <input type="tel" placeholder="(800) 123-4567" />
                </div>
                <div className="form-group">
                    <label>Clearing House Code</label>
                    <input type="text" placeholder="CHC-9876" />
                </div>
                <div className="form-group">
                    <label>Settlement Date</label>
                    <input type="date" />
                </div>
                <div className="form-group">
                    <label>Bank Stamp/Seal</label>
                    <select>
                        <option value="embossed">Embossed Seal</option>
                        <option value="inked">Inked Stamp</option>
                        <option value="foil">Foil Stamp</option>
                        <option value="digital">Digital Seal</option>
                    </select>
                </div>
            </div>

            <div className="security-features">
                <h4>Enhanced Security Features (Cashier's Check)</h4>
                <div className="security-grid">
                    <label>
                        <input type="checkbox" /> Watermark with Bank Logo
                    </label>
                    <label>
                        <input type="checkbox" /> Holographic Security Thread
                    </label>
                    <label>
                        <input type="checkbox" /> Color-Shifting Ink
                    </label>
                    <label>
                        <input type="checkbox" /> Microprinted Border
                    </label>
                    <label>
                        <input type="checkbox" /> UV-Reactive Fibers
                    </label>
                    <label>
                        <input type="checkbox" /> Thermochromic Ink
                    </label>
                    <label>
                        <input type="checkbox" /> Tactile Printing
                    </label>
                    <label>
                        <input type="checkbox" /> Anti-Copy Pantograph
                    </label>
                </div>
            </div>
        </div>
    );

    const renderECheckForm = () => (
        <div className="echeck-form">
            <h3>Electronic Check (eCheck) Specifications</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label>ACH Company Identification</label>
                    <input type="text" placeholder="1234567890" />
                </div>
                <div className="form-group">
                    <label>ACH Standard Entry Class (SEC) Code</label>
                    <select>
                        <option value="CCD">CCD - Corporate Credit or Debit</option>
                        <option value="PPD">PPD - Prearranged Payment & Deposit</option>
                        <option value="WEB">WEB - Internet-Initiated Entry</option>
                        <option value="TEL">TEL - Telephone-Initiated Entry</option>
                        <option value="RCK">RCK - Re-presented Check Entry</option>
                        <option value="ARC">ARC - Accounts Receivable Entry</option>
                        <option value="BOC">BOC - Back Office Conversion</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>ODFI Identification Number</label>
                    <input type="text" placeholder="081000210" />
                </div>
                <div className="form-group">
                    <label>Trace Number</label>
                    <input type="text" placeholder="123456789012345" />
                </div>
                <div className="form-group">
                    <label>Transaction Code</label>
                    <select>
                        <option value="22">22 - Checking Credit</option>
                        <option value="23">23 - Checking Debit</option>
                        <option value="27">27 - Savings Credit</option>
                        <option value="28">28 - Savings Debit</option>
                        <option value="32">32 - GL Credit</option>
                        <option value="33">33 - GL Debit</option>
                        <option value="37">37 - Loan Credit</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Addenda Records</label>
                    <input type="number" min="0" max="99" defaultValue="0" />
                </div>
                <div className="form-group">
                    <label>Discretionary Data Field</label>
                    <input type="text" placeholder="Optional" />
                </div>
                <div className="form-group">
                    <label>Entry Description</label>
                    <input type="text" placeholder="PAYROLL, INVOICE, etc." />
                </div>
                <div className="form-group">
                    <label>Effective Entry Date</label>
                    <input type="date" />
                </div>
            </div>

            <div className="echeck-fields">
                <h4>EPC (Expedited Payments Code)</h4>
                <input type="text" readOnly className="epc-code" value="WEB123456789ABCDEF" />
                <p className="note">This code enables faster electronic processing</p>
            </div>
        </div>
    );

    const renderCertifiedCheckForm = () => (
        <div className="certified-check-form">
            <h3>Certified Check Specifications</h3>
            <div className="form-grid">
                <div className="form-group">
                    <label>Certification Number</label>
                    <input type="text" placeholder="CERT-2024-12345" />
                </div>
                <div className="form-group">
                    <label>Certification Date</label>
                    <input type="datetime-local" />
                </div>
                <div className="form-group">
                    <label>Certifying Officer Title</label>
                    <input type="text" placeholder="Assistant Treasurer" />
                </div>
                <div className="form-group">
                    <label>Officer ID Number</label>
                    <input type="text" placeholder="ID-98765" />
                </div>
                <div className="form-group">
                    <label>Hold Period (Days)</label>
                    <input type="number" min="0" max="90" defaultValue="10" />
                </div>
                <div className="form-group">
                    <label>Guarantee Period (Days)</label>
                    <input type="number" min="30" max="365" defaultValue="90" />
                </div>
                <div className="form-group">
                    <label>Verification Required</label>
                    <select>
                        <option value="yes">Yes - Call to Verify</option>
                        <option value="no">No - Standard Processing</option>
                    </select>
                </div>
            </div>

            <div className="certification-stamp">
                <h4>Certification Stamp Design</h4>
                <div className="stamp-options">
                    <label>
                        <input type="radio" name="stampType" value="circular" defaultChecked />
                        Circular Bank Stamp
                    </label>
                    <label>
                        <input type="radio" name="stampType" value="rectangular" />
                        Rectangular Certification Box
                    </label>
                    <label>
                        <input type="radio" name="stampType" value="signature" />
                        Signature with "Certified" Overlay
                    </label>
                </div>

                <div className="stamp-preview">
                    <div className="circular-stamp">
                        <div className="stamp-text">
                            <div className="stamp-title">CERTIFIED</div>
                            <div className="stamp-subtitle">[BANK NAME]</div>
                            <div className="stamp-date">DATE: {new Date().toLocaleDateString()}</div>
                            <div className="stamp-officer">OFFICER: _________________</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="specialized-check-builder">
            <div className="check-type-selector">
                <h2>Select Check Type</h2>
                <div className="type-buttons">
                    <button
                        className={checkType === 'personal' ? 'active' : ''}
                        onClick={() => setCheckType('personal')}
                    >
                        Personal Check
                    </button>
                    <button
                        className={checkType === 'business' ? 'active' : ''}
                        onClick={() => setCheckType('business')}
                    >
                        Business Check
                    </button>
                    <button
                        className={checkType === 'cashier' ? 'active' : ''}
                        onClick={() => setCheckType('cashier')}
                    >
                        Cashier's Check
                    </button>
                    <button
                        className={checkType === 'echeck' ? 'active' : ''}
                        onClick={() => setCheckType('echeck')}
                    >
                        Electronic Check
                    </button>
                    <button
                        className={checkType === 'certified' ? 'active' : ''}
                        onClick={() => setCheckType('certified')}
                    >
                        Certified Check
                    </button>
                    <button
                        className={checkType === 'travelers' ? 'active' : ''}
                        onClick={() => setCheckType('travelers')}
                    >
                        Traveler's Check
                    </button>
                </div>
            </div>

            <div className="check-form-container">
                {checkType === 'cashier' && renderCashiersCheckForm()}
                {checkType === 'echeck' && renderECheckForm()}
                {checkType === 'certified' && renderCertifiedCheckForm()}
                {/* Add other check type forms */}
            </div>
        </div>
    );
};
