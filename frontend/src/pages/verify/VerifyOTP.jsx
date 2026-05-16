import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MobileShell from '../../components/verify/MobileShell';
import OTPInput from '../../components/verify/OTPInput';

export default function VerifyOTP({ onNext, onBack, phone = '080****5521' }) {
  const [timer, setTimer] = useState(300); // 5 minutes
  const canResend = timer === 0;

  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <MobileShell step={3}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        style={{ flex: 1 }}
      >
        <button 
          onClick={onBack}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text3)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            fontSize: '14px',
            marginBottom: '32px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <i className="ti ti-chevron-left" />
          Back
        </button>

        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Security Code</h2>
        <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '40px' }}>
          We've sent a 6-digit verification code to <strong style={{ color: 'var(--text)' }}>{phone}</strong>.
        </p>

        <OTPInput onComplete={(code) => onNext({ otp: code })} />

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '12px' }}>
            Code expires in <span style={{ color: 'var(--red)', fontWeight: 600 }}>{formatTime(timer)}</span>
          </div>
          
          <button 
            disabled={!canResend}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: canResend ? 'var(--red)' : 'var(--text3)', 
              fontSize: '14px', 
              fontWeight: 600,
              cursor: canResend ? 'pointer' : 'not-allowed',
              textDecoration: canResend ? 'underline' : 'none'
            }}
            onClick={() => {
              setTimer(300);
            }}
          >
            Resend Code
          </button>
        </div>

        <div style={{ 
          marginTop: 'auto', 
          padding: '16px', 
          background: 'rgba(255,255,255,0.03)', 
          borderRadius: '12px', 
          border: '1px solid var(--border)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            background: 'rgba(215,38,56,0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--red)'
          }}>
            <i className="ti ti-shield-lock" />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.4 }}>
            VIRGIL will never call you to ask for this code. Keep it private.
          </div>
        </div>
      </motion.div>
    </MobileShell>
  );
}
