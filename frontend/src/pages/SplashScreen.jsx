import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Pure CSS + Framer Motion Cinematic Splash Screen
// Guaranteed to work on all devices without WebGL crashes
const messages = [
  'Initializing secure uplink...',
  'Decrypting government datastores...',
  'Establishing AI neural pathways...',
  'Verifying identity clusters...',
  'System Ready.'
];

const seededValue = (seed) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const particles = Array.from({ length: 40 }).map((_, i) => ({
  id: i,
  size: seededValue(i + 1) * 4 + 1,
  left: `${seededValue(i + 41) * 100}%`,
  top: `${seededValue(i + 81) * 100}%`,
  duration: seededValue(i + 121) * 10 + 10,
  delay: seededValue(i + 161) * 5,
}));

const SplashScreen = ({ onComplete, theme, onToggleTheme }) => {
  const [phase, setPhase] = useState(0);
  const [isOutro, setIsOutro] = useState(false);
  const [loadingText, setLoadingText] = useState('Initializing secure uplink...');
  const logoSrc = theme === 'light' ? '/logo-light.png' : '/logo.png';

  useEffect(() => {
    let currentPhase = 0;
    let outroTimeout;
    const interval = setInterval(() => {
      currentPhase++;
      if (currentPhase < messages.length) {
        setLoadingText(messages[currentPhase]);
        setPhase(currentPhase);
      } else {
        clearInterval(interval);
        setIsOutro(true);
        outroTimeout = setTimeout(onComplete, 1200); 
      }
    }, 1500); 

    return () => {
      clearInterval(interval);
      clearTimeout(outroTimeout);
    };
  }, [onComplete]);
  return (
    <div className="screen splash on" style={{ position: 'relative', backgroundColor: 'var(--splash-bg)', overflow: 'hidden', height: '100vh', width: '100vw' }}>
      <div style={{ position: 'absolute', top: '18px', right: '18px', zIndex: 8 }}>
      </div>
      
      {/* 1. Cinematic Radial Background Glow */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute', top: '50%', left: '50%', width: '150vw', height: '150vw',
          transform: 'translate(-50%, -50%)',
          background: 'var(--splash-glow)',
          zIndex: 0, pointerEvents: 'none'
        }}
      />

      {/* 2. Encrypted Grid Layer (SVG) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60%', zIndex: 1,
        perspective: '1000px', pointerEvents: 'none', opacity: 0.5
      }}>
        <motion.div
          animate={{ backgroundPosition: ['0px 0px', '0px 100px'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            width: '100%', height: '200%',
            transformOrigin: 'top', transform: 'rotateX(75deg)',
            backgroundImage: `
              linear-gradient(var(--splash-grid-line) 1px, transparent 1px),
              linear-gradient(90deg, var(--splash-grid-line) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 80%)'
          }}
        />
      </div>

      {/* 3. Floating Particles */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
        {particles.map(p => (
          <motion.div
            key={p.id}
            animate={{ 
              y: ['0vh', '-100vh'], 
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{ 
              duration: p.duration, 
              repeat: Infinity, 
              delay: p.delay,
              ease: "linear" 
            }}
            style={{
              position: 'absolute',
              width: `${p.size}px`, height: `${p.size}px`,
              left: p.left, top: p.top,
              backgroundColor: '#ff4444',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(255,68,68,0.8)'
            }}
          />
        ))}
      </div>

      {/* 4. Cinematic Vignette Overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'var(--splash-vignette)',
        zIndex: 3, pointerEvents: 'none'
      }} />

      {/* Foreground UI */}
      <div style={{
        position: 'relative', zIndex: 4, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text)'
      }}>
        
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95, filter: 'blur(10px)' }}
          animate={isOutro
            ? { opacity: [1, 1, 0], y: [0, 0, -8], scale: [1, 2.2, 3.4], filter: ['blur(0px)', 'blur(0px)', 'blur(14px)'] }
            : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
          }
          transition={isOutro
            ? { duration: 1.15, ease: [0.16, 1, 0.3, 1], times: [0, 0.72, 1] }
            : { duration: 1.5, ease: "easeOut" }
          }
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <img
            src={logoSrc}
            alt="VIRGIL"
            style={{ 
              width: '180px', 
              marginBottom: '20px', 
              filter: theme === 'light' ? 'none' : 'drop-shadow(0 0 35px rgba(255,0,0,0.8))' 
            }}
          />
          
          <motion.div 
            initial={{ opacity: 0, letterSpacing: '2px' }}
            animate={isOutro ? { opacity: 0, letterSpacing: '12px' } : { opacity: 1, letterSpacing: '8px' }}
            transition={isOutro ? { duration: 0.25, ease: "easeOut" } : { delay: 0.5, duration: 2, ease: "easeOut" }}
            style={{ 
              fontSize: '12px', 
              textTransform: 'uppercase', 
              color: 'var(--red-bright)', 
              fontWeight: 600,
              letterSpacing: '8px',
              marginBottom: '60px',
              marginLeft: '8px'
            }}
          >
            Payroll Integrity Intelligence
          </motion.div>
        </motion.div>

        <motion.div
          animate={isOutro ? { opacity: 0, y: 18 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ position: 'absolute', bottom: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={loadingText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'monospace', letterSpacing: '1px' }}
            >
              {loadingText}
            </motion.div>
          </AnimatePresence>
          
          <div style={{ width: '240px', height: '2px', background: 'var(--splash-track)', marginTop: '20px', overflow: 'hidden', position: 'relative' }}>
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: `${(phase / (messages.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{ 
                position: 'absolute',
                top: 0, left: 0, height: '100%', 
                background: '#ff0000', 
                boxShadow: '0 0 12px #ff0000' 
              }}
            />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SplashScreen;
