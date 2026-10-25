/**
 * IdentityVerification — user-facing screen for the biometric KYC flow.
 *
 * Wires the existing backend endpoints (previously without any UI):
 *   POST /api/verify/start      { userId, method: 'BIOMETRIC' }
 *   POST /api/verify/biometrics multipart: userId + idImage + selfieImage
 *
 * The server reads the ID (OCR) and compares the live selfie against the
 * ID portrait, then marks the user's kyc_verifications record VERIFIED or
 * REJECTED, which is what unlocks mobile deposit.
 */
import React, { useRef, useState } from 'react';
import { FiShield, FiCamera, FiCreditCard, FiCheckCircle, FiXCircle, FiAlertTriangle, FiRefreshCw, FiLock } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { apiUrl } from '../config';
import { getAuthToken } from '../services/apiClient';

type Phase = 'intro' | 'collect' | 'submitting' | 'verified' | 'rejected' | 'error';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

// The OCR step on the server can be slow on a cold start; never leave the
// user on a spinner forever.
const fetchWithTimeout = async (url: string, init: RequestInit, ms: number): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
};

const failureMessage = (err: any, fallback: string): string =>
    err?.name === 'AbortError'
        ? 'The verification service took too long to respond. Please try again.'
        : err?.message === 'Failed to fetch'
            ? 'The verification service is unreachable right now. Please try again shortly.'
            : (err?.message || fallback);

const REASON_TEXT: Record<string, string> = {
    FACIAL_MISMATCH: 'Your live photo did not match the portrait on your ID closely enough. Make sure your face is well lit, uncovered, and fills the frame, then try again.',
    IMAGE_PROCESSING_FAILURE: 'We could not process those images. Try clearer photos of your ID and face, then try again.'
};

const IdentityVerification: React.FC = () => {
    const { user, isAuthenticated, openAuthModal } = useAuth();
    const [phase, setPhase] = useState<Phase>('intro');
    const [idFile, setIdFile] = useState<File | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [idPreview, setIdPreview] = useState<string>('');
    const [selfiePreview, setSelfiePreview] = useState<string>('');
    const [score, setScore] = useState<number | null>(null);
    const [idRead, setIdRead] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [busy, setBusy] = useState<boolean>(false);
    const idInputRef = useRef<HTMLInputElement>(null);
    const selfieInputRef = useRef<HTMLInputElement>(null);

    const pickFile = (which: 'id' | 'selfie') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setMessage('Please choose an image file.');
            setPhase('error');
            return;
        }
        if (file.size > MAX_FILE_BYTES) {
            setMessage('That image is larger than 10 MB. Please use a smaller photo.');
            setPhase('error');
            return;
        }
        const url = URL.createObjectURL(file);
        if (which === 'id') { setIdFile(file); setIdPreview(url); }
        else { setSelfieFile(file); setSelfiePreview(url); }
    };

    const begin = async () => {
        if (!user) return;
        setBusy(true);
        setMessage('');
        try {
            const res = await fetchWithTimeout(apiUrl('/api/verify/start'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAuthToken() || ''}` },
                body: JSON.stringify({ userId: String(user.id), method: 'BIOMETRIC' })
            }, 30000);
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.success === false) {
                throw new Error(data.error || data.message || 'The verification service refused to start a session.');
            }
            setPhase('collect');
        } catch (err: any) {
            setMessage(failureMessage(err, 'Something went wrong starting verification.'));
            setPhase('error');
        } finally {
            setBusy(false);
        }
    };

    const submit = async () => {
        if (!user || !idFile || !selfieFile) return;
        setPhase('submitting');
        setMessage('');
        try {
            const form = new FormData();
            form.append('userId', String(user.id));
            form.append('idImage', idFile);
            form.append('selfieImage', selfieFile);
            const res = await fetchWithTimeout(apiUrl('/api/verify/biometrics'), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${getAuthToken() || ''}` },
                body: form
            }, 120000);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || 'The verification service returned an error.');
            }
            if (data.success) {
                setScore(typeof data.score === 'number' ? data.score : null);
                setIdRead(Boolean(data.extractedData?.hasName || data.extractedData?.isDocumentLegible));
                setPhase('verified');
            } else {
                setMessage(REASON_TEXT[data.reason] || 'Verification could not be completed with those photos. Please try again with clearer images.');
                setPhase('rejected');
            }
        } catch (err: any) {
            setMessage(failureMessage(err, 'Something went wrong submitting your verification.'));
            setPhase('error');
        }
    };

    const reset = () => {
        setIdFile(null); setSelfieFile(null);
        setIdPreview(''); setSelfiePreview('');
        setScore(null); setIdRead(false); setMessage('');
        setPhase('intro');
    };

    const uploadCard = (
        title: string,
        hint: string,
        icon: React.ReactNode,
        preview: string,
        inputRef: React.RefObject<HTMLInputElement>,
        onPick: (e: React.ChangeEvent<HTMLInputElement>) => void,
        capture?: 'user' | 'environment'
    ) => (
        <div className="flex-1 min-w-[240px] rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">{icon}{title}</div>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{hint}</p>
            <div className="mt-3 h-44 rounded-xl overflow-hidden border border-white/10 bg-black/30 flex items-center justify-center">
                {preview
                    ? <img src={preview} alt={title} className="w-full h-full object-cover" />
                    : <span className="text-slate-500 text-xs px-4 text-center">No photo yet</span>}
            </div>
            <input ref={inputRef} type="file" accept="image/*" capture={capture} onChange={onPick} className="hidden" />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-3 w-full py-2.5 rounded-full text-sm font-bold bg-white/[0.06] border border-white/15 text-slate-100 hover:bg-white/[0.1] transition-all"
            >
                {preview ? 'Retake / replace' : 'Add photo'}
            </button>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="oc-glass rounded-3xl p-6 sm:p-8 shadow-panel">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-500 to-amber-600 flex items-center justify-center text-white shadow-glow-amber-sm">
                        <FiShield size={22} />
                    </div>
                    <div>
                        <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-50">Identity Verification</h1>
                        <p className="text-slate-400 text-sm">Verify once to unlock mobile deposit.</p>
                    </div>
                </div>

                {!isAuthenticated && (
                    <div className="mt-8 text-center py-8">
                        <FiLock className="mx-auto text-slate-500" size={28} />
                        <p className="text-slate-300 mt-3">Sign in first — verification is tied to your account.</p>
                        <button
                            type="button"
                            onClick={() => openAuthModal('login')}
                            className="mt-4 px-6 py-2.5 rounded-full font-bold text-white bg-gradient-to-r from-primary-500 to-amber-600 shadow-glow-amber-sm hover:shadow-glow-amber transition-all"
                        >
                            Sign In
                        </button>
                    </div>
                )}

                {isAuthenticated && phase === 'intro' && (
                    <div className="mt-6">
                        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                            <p><strong className="text-slate-100">1. Photograph your government ID</strong> — driver's licence or passport, flat and fully readable.</p>
                            <p><strong className="text-slate-100">2. Take a live selfie</strong> — the camera opens so the photo is of you, right now.</p>
                            <p><strong className="text-slate-100">3. We compare them on the server</strong> — the text on your ID is read and your selfie is matched against the ID portrait. Nothing is checked on this device.</p>
                        </div>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={begin}
                            className="mt-6 w-full sm:w-auto px-8 py-3 rounded-full font-bold text-white bg-gradient-to-r from-primary-500 to-amber-600 shadow-glow-amber-sm hover:shadow-glow-amber transition-all disabled:opacity-50"
                        >
                            {busy ? 'Starting…' : 'Begin Verification'}
                        </button>
                    </div>
                )}

                {isAuthenticated && phase === 'collect' && (
                    <div className="mt-6">
                        <div className="flex flex-wrap gap-4">
                            {uploadCard('Government ID', 'Full document, no glare, all text readable.', <FiCreditCard size={16} />, idPreview, idInputRef, pickFile('id'))}
                            {uploadCard('Live Selfie', 'Face the camera, good light, no sunglasses or hat.', <FiCamera size={16} />, selfiePreview, selfieInputRef, pickFile('selfie'), 'user')}
                        </div>
                        <button
                            type="button"
                            disabled={!idFile || !selfieFile}
                            onClick={submit}
                            className="mt-6 w-full sm:w-auto px-8 py-3 rounded-full font-bold text-white bg-gradient-to-r from-primary-500 to-amber-600 shadow-glow-amber-sm hover:shadow-glow-amber transition-all disabled:opacity-40"
                        >
                            Submit for Verification
                        </button>
                        {(!idFile || !selfieFile) && (
                            <p className="text-slate-500 text-xs mt-3">Add both photos to continue.</p>
                        )}
                    </div>
                )}

                {isAuthenticated && phase === 'submitting' && (
                    <div className="mt-8 text-center py-8">
                        <FiRefreshCw className="mx-auto text-primary-400 animate-spin" size={30} />
                        <p className="text-slate-300 mt-3">Reading your ID and comparing your photos…</p>
                    </div>
                )}

                {isAuthenticated && phase === 'verified' && (
                    <div className="mt-8 text-center py-6">
                        <FiCheckCircle className="mx-auto text-emerald-400" size={40} />
                        <h2 className="font-display text-xl font-bold text-slate-50 mt-3">You're verified</h2>
                        <p className="text-slate-400 text-sm mt-2">
                            {score !== null ? <>Match score: <strong className="text-slate-200">{Math.round(score * 100)}%</strong>. </> : null}
                            {idRead ? 'Your ID was read successfully. ' : ''}
                            Mobile deposit is now unlocked for your account.
                        </p>
                    </div>
                )}

                {isAuthenticated && (phase === 'rejected' || phase === 'error') && (
                    <div className="mt-8 text-center py-6">
                        {phase === 'rejected'
                            ? <FiXCircle className="mx-auto text-red-400" size={40} />
                            : <FiAlertTriangle className="mx-auto text-amber-400" size={40} />}
                        <h2 className="font-display text-xl font-bold text-slate-50 mt-3">
                            {phase === 'rejected' ? 'Not verified yet' : 'Something went wrong'}
                        </h2>
                        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto leading-relaxed">{message}</p>
                        <button
                            type="button"
                            onClick={reset}
                            className="mt-5 px-6 py-2.5 rounded-full font-bold text-white bg-gradient-to-r from-primary-500 to-amber-600 shadow-glow-amber-sm hover:shadow-glow-amber transition-all"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
            <p className="text-slate-500 text-xs text-center mt-4 leading-relaxed">
                Your photos go only to the verification service for this check. Verification status is recorded on your account.
            </p>
        </div>
    );
};

export default IdentityVerification;
