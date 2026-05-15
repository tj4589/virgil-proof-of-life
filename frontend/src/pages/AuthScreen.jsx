import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../components/ThemeToggle';

const AuthScreen = ({ onLogin, theme, onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const logoSrc = theme === 'light' ? '/logo-light.png' : '/logo.png';

  const handleLogin = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="screen on" style={{ background: 'var(--bg)', flexDirection: 'column' }}>
      <div className="ob-topbar">
        <div className="ob-brand">
          <img src={logoSrc} alt="VIRGIL" style={{ height: '40px', width: 'auto' }} />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Secure Uplink</div>
        <div className="ob-steps-dots">
          <div className="ob-dot on" />
        </div>
      </div>

      <div className="ob-body">
        <div className="ob-left-panel">
          <div className="ob-eyebrow">Enterprise Access</div>
          <div className="ob-headline">
            Payroll Integrity Intelligence.
          </div>
          <div className="ob-desc">
            Authorized personnel only. Secure access gateway for approved organizations.
          </div>
          <div className="ob-left-visual" aria-hidden="true">
            <div className="ob-planet">
              <div className="ob-planet-ring" />
              <div className="ob-orbit orbit-one">
                <span><i className="ti ti-shield-lock" /></span>
              </div>
              <div className="ob-orbit orbit-two">
                <span><i className="ti ti-key" /></span>
              </div>
              <div className="ob-orbit orbit-three">
                <span><i className="ti ti-lock" /></span>
              </div>
              <div className="ob-core">
                <i className="ti ti-fingerprint" />
              </div>
            </div>
            <div className="ob-floating-card card-a">
              <span>Status</span>
              <strong>Protected</strong>
            </div>
            <div className="ob-floating-card card-b">
              <span>Uplink</span>
              <strong>Secured</strong>
            </div>
          </div>
        </div>

        <div className="ob-right-panel">
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Secure Sign In</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '24px' }}>Enter your credentials to access the uplink.</div>

          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input 
                type="email"
                className="form-input" 
                placeholder="officer@ministry.gov" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <a href="#" style={{ fontSize: '12px', color: 'var(--red)', textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <input 
                type="password"
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              className="ob-continue" 
              disabled={isLoading || !email || !password}
              style={{ opacity: (isLoading || !email || !password) ? 0.6 : 1, width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              {isLoading ? (
                <><i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }} /> Authenticating...</>
              ) : (
                <>Continue Securely <i className="ti ti-arrow-right" /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
            No account? <button type="button" onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 0, fontSize: '13px', textDecoration: 'underline' }}>Request Access</button>
          </div>
        </div>
      </div>

      {/* Request Access Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
            >
              <div style={{ margin: '0 auto 20px' }}>
                <img src={logoSrc} alt="VIRGIL" style={{ height: '48px' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Enterprise Access Only</h3>
              <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.5, marginBottom: '24px' }}>
                VIRGIL access is provisioned for approved organizations only. Contact the VIRGIL team to onboard your agency.
              </p>
              <button 
                onClick={() => setShowModal(false)}
                style={{ width: '100%', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthScreen;
