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
    <div className="screen on" style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex' }}>
      {/* Left side: branding/visuals */}
      <div className="auth-left" style={{ flex: 1, background: 'var(--surface)', display: 'flex', flexDirection: 'column', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <img src={logoSrc} alt="VIRGIL" style={{ height: '32px', marginBottom: '60px' }} />
          <h1 style={{ fontSize: '36px', color: 'var(--text)', fontWeight: 600, letterSpacing: '-0.5px', marginBottom: '16px', lineHeight: 1.2 }}>
            Payroll Integrity<br />Intelligence
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: '16px', maxWidth: '300px', lineHeight: 1.5 }}>
            Authorized personnel only. Secure access gateway for approved organizations.
          </p>
        </div>
        
        {/* Abstract intelligence visual */}
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', opacity: 0.3, pointerEvents: 'none' }}>
           <div style={{ width: '600px', height: '600px', border: '1px solid var(--red)', borderRadius: '50%', position: 'absolute' }} />
           <div style={{ width: '400px', height: '400px', border: '1px dashed var(--red)', borderRadius: '50%', position: 'absolute', top: '100px', left: '100px' }} />
           <div style={{ width: '200px', height: '200px', background: 'radial-gradient(circle, var(--red) 0%, transparent 70%)', borderRadius: '50%', position: 'absolute', top: '200px', left: '200px', filter: 'blur(40px)' }} />
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="auth-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} compact />
        </div>

        <div style={{ width: '100%', maxWidth: '360px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Secure Sign In</h2>
            <p style={{ fontSize: '14px', color: 'var(--text3)' }}>Enter your credentials to access the uplink.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ color: 'var(--text2)' }}>Work Email</label>
              <input 
                type="email"
                className="form-input" 
                placeholder="officer@ministry.gov" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ color: 'var(--text2)', marginBottom: 0 }}>Password</label>
                <a href="#" style={{ fontSize: '12px', color: 'var(--red)', textDecoration: 'none' }}>Forgot password?</a>
              </div>
              <input 
                type="password"
                className="form-input" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)', marginTop: '8px' }}
              />
            </div>

            <button 
              type="submit"
              className="btn btn-primary" 
              disabled={isLoading || !email || !password}
              style={{ width: '100%', background: 'var(--red)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, opacity: (isLoading || !email || !password) ? 0.7 : 1 }}
            >
              {isLoading ? (
                <><i className="ti ti-loader" style={{ animation: 'spin 1s linear infinite' }} /> Authenticating...</>
              ) : (
                <>Continue Securely <i className="ti ti-arrow-right" /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
            No account? <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: 0, fontSize: '13px', textDecoration: 'underline' }}>Request Access</button>
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
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(215,38,56,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="ti ti-shield-lock" style={{ fontSize: '24px', color: 'var(--red)' }} />
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
