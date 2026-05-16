import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MobileShell from '../../components/verify/MobileShell';
import useCamera from '../../hooks/useCamera';

const PROMPTS = [
  { id: 'smile',      emoji: '😄', text: 'Please SMILE now',           sub: 'Hold your smile for 2 seconds' },
  { id: 'blink',      emoji: '😑', text: 'Please BLINK twice',         sub: 'Blink both eyes clearly' },
  { id: 'turn_left',  emoji: '👈', text: 'Turn your head LEFT',        sub: 'Slowly turn to your left' },
  { id: 'turn_right', emoji: '👉', text: 'Turn your head RIGHT',       sub: 'Slowly turn to your right' },
  { id: 'open_mouth', emoji: '😮', text: 'Please OPEN your mouth',     sub: 'Open wide for 1 second' },
  { id: 'eyebrows',   emoji: '🤨', text: 'RAISE your eyebrows',        sub: 'Raise both eyebrows up' },
  { id: 'nod',        emoji: '🙆', text: 'NOD your head up and down',  sub: 'Two slow nods' },
];

export default function VerifyLiveness({ onNext }) {
  const { videoRef, start, stop } = useCamera();
  const [selectedPrompts] = useState(() => [...PROMPTS].sort(() => 0.5 - Math.random()).slice(0, 4));
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  useEffect(() => {
    if (selectedPrompts.length > 0 && currentIdx < 4) {
      // Simulate prompt verification
      const timer = setTimeout(() => {
        if (currentIdx < 3) {
          setCurrentIdx(prev => prev + 1);
        } else {
          setTimeout(() => onNext({ liveness: 'PASSED' }), 800);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, onNext, selectedPrompts]);

  const currentPrompt = selectedPrompts[currentIdx];

  return (
    <MobileShell step={5}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Liveness Check</h2>
        <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '24px' }}>
          Follow the instructions on screen to prove you are physically present.
        </p>

        {/* Small progress bars */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ 
              flex: 1, 
              height: '4px', 
              background: i < currentIdx ? 'var(--green)' : i === currentIdx ? 'var(--red)' : 'var(--border)',
              borderRadius: '2px',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        <div style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: '1/1', 
          background: '#000', 
          borderRadius: '50%', 
          overflow: 'hidden',
          border: '4px solid var(--red)',
          boxShadow: '0 0 30px rgba(215,38,56,0.2)',
          margin: '0 auto 40px'
        }}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>

        <AnimatePresence mode="wait">
          {currentPrompt && (
            <motion.div 
              key={currentPrompt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ 
                textAlign: 'center', 
                padding: '24px', 
                background: 'rgba(215,38,56,0.05)', 
                borderRadius: '16px',
                border: '1px solid rgba(215,38,56,0.1)'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>{currentPrompt.emoji}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{currentPrompt.text}</div>
              <div style={{ fontSize: '14px', color: 'var(--text3)' }}>{currentPrompt.sub}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ marginTop: 'auto', textAlign: 'center', color: 'var(--text3)', fontSize: '12px', paddingBottom: '20px' }}>
          Real-time AI verification in progress...
        </div>
      </div>
    </MobileShell>
  );
}
