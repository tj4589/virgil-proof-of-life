import { motion } from 'framer-motion';
import MobileShell from '../../components/verify/MobileShell';

export default function VerifyLanding({ onNext, ministry = 'Federal Ministry of Finance' }) {
  return (
    <MobileShell step={1} showProgress={false}>
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <img src="/logo.png" alt="VIRGIL" style={{ height: '48px', marginBottom: '24px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>Identity Verification</h1>
          <p style={{ color: 'var(--text3)', fontSize: '16px', marginBottom: '40px' }}>
            {ministry}
          </p>

          <div style={{ 
            background: 'rgba(215,38,56,0.1)', 
            padding: '20px', 
            borderRadius: '12px', 
            border: '1px solid rgba(215,38,56,0.2)',
            marginBottom: '40px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--red)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="ti ti-info-circle" />
              Before you start
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--text2)', margin: 0 }}>
              <li>Ensure you are in a well-lit environment</li>
              <li>Have your Staff ID number ready</li>
              <li>Face the camera directly during liveness check</li>
            </ul>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ 
              width: '100%', 
              padding: '16px', 
              fontSize: '16px', 
              fontWeight: 600,
              background: 'var(--red)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(215,38,56,0.3)'
            }}
            onClick={onNext}
          >
            Begin Verification
          </button>
        </motion.div>
      </div>
    </MobileShell>
  );
}
