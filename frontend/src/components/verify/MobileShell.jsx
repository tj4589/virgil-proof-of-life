import { motion } from 'framer-motion';

export default function MobileShell({ children, step, totalSteps = 6, showProgress = true }) {
  const progress = (step / totalSteps) * 100;

  return (
    <div className="mobile-verify-container" style={{ 
      minHeight: '100vh', 
      background: 'var(--bg)', 
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '430px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {showProgress && (
        <div className="verify-progress-bar" style={{
          height: '4px',
          background: 'var(--border)',
          width: '100%',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            style={{ 
              height: '100%', 
              background: 'var(--red)',
              boxShadow: '0 0 10px rgba(215,38,56,0.5)'
            }} 
          />
        </div>
      )}

      <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      <footer style={{ 
        padding: '24px', 
        textAlign: 'center', 
        fontSize: '12px', 
        color: 'var(--text3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}>
        <i className="ti ti-lock" />
        Secured by VIRGIL AI • End-to-end Encrypted
      </footer>
    </div>
  );
}
