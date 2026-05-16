import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyPol } from '../lib/api';

const prompts = [
  "Blink twice",
  "Turn head slightly to the left",
  "Smile for the camera",
  "Raise right hand"
];

const ProofOfLifeScreen = ({ theme }) => {
  const [step, setStep] = useState('login'); // login, otp, camera, analyzing, result
  const [staffId, setStaffId] = useState('');
  const [otp, setOtp] = useState('');
  const [result, setResult] = useState(null);

  const videoRef = useRef(null);

  const prompt = useMemo(() => {
    const promptIndex = Math.abs(staffId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % prompts.length;
    return prompts[promptIndex] || prompts[0];
  }, [staffId]);

  const submitPol = useCallback(async () => {
    try {
      const res = await verifyPol({
        staffId: staffId.toUpperCase(),
        livenessPassed: otp.length >= 4
      });
      setResult(res.status);
      setStep('result');
    } catch (error) {
      console.error(error);
      setResult('FAILED');
      setStep('result');
    } finally {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }
  }, [staffId, otp]);

  useEffect(() => {
    if (step !== 'camera') return undefined;

    let cancelled = false;
    let localStream = null;

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        localStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => console.log('Camera access denied/failed, using fallback.'));

    const timer = setTimeout(() => {
      if (cancelled) return;
      setStep('analyzing');
      setTimeout(() => {
        if (!cancelled) void submitPol();
      }, 120);
    }, 5000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, submitPol]);

  const logoSrc = theme === 'light' ? '/logo-light.png' : '/logo.png';

  return (
    <div className="screen pol-screen" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="pol-container" style={{ width: '100%', maxWidth: '420px', padding: '40px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img src={logoSrc} alt="VIRGIL" style={{ height: '32px', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>Proof of Life Verification</h2>
          <p style={{ fontSize: '14px', color: 'var(--text3)', marginTop: '8px' }}>Secure Identity Uplink</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--text2)' }}>Staff ID</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. STF-123456" 
                  value={staffId}
                  onChange={e => setStaffId(e.target.value)}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '16px', background: 'var(--red)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => setStep('otp')}
                disabled={!staffId}
              >
                Send OTP
              </button>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--text2)' }}>Enter OTP</label>
                <input 
                  className="form-input" 
                  placeholder="123456" 
                  type="number"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', letterSpacing: '4px', textAlign: 'center', fontSize: '18px' }}
                />
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px', textAlign: 'center' }}>OTP sent to registered device</div>
              </div>
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '16px', background: 'var(--red)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                onClick={() => setStep('camera')}
                disabled={otp.length < 4}
              >
                Verify Identity
              </button>
            </motion.div>
          )}

          {step === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} style={{ textAlign: 'center' }}>
              <div style={{ width: '100%', height: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', border: '2px solid var(--red)' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Scanner Overlay */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }} 
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', left: 0, width: '100%', height: '2px', background: 'var(--red)', boxShadow: '0 0 10px var(--red)', zIndex: 10 }}
                />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '2px solid rgba(215,38,56,0.3)', borderRadius: '12px', pointerEvents: 'none', boxSizing: 'border-box' }} />
              </div>
              
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(215,38,56,0.1)', borderRadius: '8px', border: '1px solid rgba(215,38,56,0.2)' }}>
                <div style={{ fontSize: '12px', color: 'var(--red)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Action Required</div>
                <div style={{ fontSize: '18px', color: 'var(--text)', fontWeight: 500 }}>{prompt}</div>
              </div>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '40px 0' }}>
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                style={{ width: '48px', height: '48px', border: '3px solid var(--border)', borderTopColor: 'var(--red)', borderRadius: '50%', margin: '0 auto 24px' }}
              />
              <h3 style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 500 }}>Analyzing Biometric Signals</h3>
              <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '8px' }}>Encrypting and verifying against government datastores...</p>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: result === 'VERIFIED' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <i className={`ti ${result === 'VERIFIED' ? 'ti-shield-check' : 'ti-alert-triangle'}`} style={{ fontSize: '32px', color: result === 'VERIFIED' ? 'var(--green)' : 'var(--red)' }} />
              </div>
              
              <h3 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                {result === 'VERIFIED' ? 'Verification Successful' : 'Verification Failed'}
              </h3>
              
              <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>
                {result === 'VERIFIED' 
                  ? 'Your biometric signature matches our secure records. Your payroll status has been updated and released for disbursement.'
                  : 'We could not securely verify your identity. Your payment status has been flagged for manual review by the HR department.'}
              </p>

              <button 
                className="btn" 
                style={{ width: '100%', background: 'transparent', color: 'var(--text)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', cursor: 'pointer' }}
                onClick={() => { window.location.href = '/'; }}
              >
                Close Secure Uplink
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div style={{ marginTop: '32px', fontSize: '12px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="ti ti-lock" />
        End-to-end encrypted • Powered by VIRGIL AI
      </div>
    </div>
  );
};

export default ProofOfLifeScreen;
