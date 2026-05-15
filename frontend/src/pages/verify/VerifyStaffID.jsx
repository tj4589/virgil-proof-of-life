import { useState } from 'react';
import { motion } from 'framer-motion';
import MobileShell from '../../components/verify/MobileShell';

export default function VerifyStaffID({ onNext, onBack }) {
  const [staffId, setStaffId] = useState('');
  const [dob, setDob] = useState('');

  const isValid = staffId.length > 3 && dob;

  return (
    <MobileShell step={2}>
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

        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Personal Details</h2>
        <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '32px' }}>
          Enter your official details as they appear on the payroll register.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Staff ID Number
            </label>
            <input 
              type="text" 
              placeholder="e.g. FMF/2019/0847" 
              value={staffId}
              onChange={(e) => setStaffId(e.target.value.toUpperCase())}
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '8px', 
                border: '1px solid var(--border)', 
                background: 'var(--bg)', 
                color: 'var(--text)',
                fontSize: '16px'
              }}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Date of Birth
            </label>
            <input 
              type="date" 
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '14px', 
                borderRadius: '8px', 
                border: '1px solid var(--border)', 
                background: 'var(--bg)', 
                color: 'var(--text)',
                fontSize: '16px'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingBottom: '20px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--text3)', 
            textAlign: 'center', 
            marginBottom: '16px',
            lineHeight: 1.5
          }}>
            By continuing, you authorize VIRGIL to verify these details against government biometric datastores.
          </div>
          <button 
            className="btn btn-primary" 
            disabled={!isValid}
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: '16px', 
              fontWeight: 600,
              background: isValid ? 'var(--red)' : 'var(--border)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: isValid ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            onClick={() => onNext({ staffId, dob })}
          >
            Verify Details
          </button>
        </div>
      </motion.div>
    </MobileShell>
  );
}
