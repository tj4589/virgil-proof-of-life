import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "Verification policies secured...",
  "AI detection layers initialized...",
  "Audit channels active...",
  "Squad disbursement gateway connected...",
  "Environment Ready."
];

const SystemInitializationScreen = ({ onComplete }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < messages.length - 1) {
      const timer = setTimeout(() => setIndex(prev => prev + 1), 900);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => onComplete(), 1200); // Hold on Environment Ready
      return () => clearTimeout(timer);
    }
  }, [index, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
      style={{ 
        height: '100vh', 
        width: '100vw', 
        background: '#050505', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        color: '#F5F5F7',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Ambient Red Glow */}
      <motion.div 
        animate={{ opacity: [0.1, 0.25, 0.1], scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(215,38,56,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          zIndex: 0
        }}
      />

      {/* Central Abstract Ring */}
      <div style={{ position: 'relative', zIndex: 1, width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,255,255,0.03)', borderTopColor: 'rgba(215,38,56,0.6)', borderRadius: '50%' }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute', inset: 12, border: '1px dashed rgba(255,255,255,0.05)', borderBottomColor: 'rgba(215,38,56,0.4)', borderRadius: '50%' }}
        />
        <motion.div
          animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: '4px', height: '4px', background: '#D72638', borderRadius: '50%', boxShadow: '0 0 20px 4px rgba(215,38,56,0.8)' }}
        />
      </div>

      {/* Text Sequence */}
      <div style={{ height: '40px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ 
              fontSize: index === messages.length - 1 ? '15px' : '14px',
              fontWeight: index === messages.length - 1 ? 500 : 400,
              color: index === messages.length - 1 ? '#D72638' : '#9CA3AF',
              letterSpacing: '0.5px',
              textAlign: 'center'
            }}
          >
            {messages[index]}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* System Baseline Progress Line */}
      <div style={{ position: 'absolute', bottom: 40, width: '100%', display: 'flex', justifyContent: 'center', opacity: 0.3 }}>
        <motion.div 
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '200px', opacity: 1 }}
          transition={{ duration: 4.5, ease: "easeInOut" }}
          style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--red), transparent)' }}
        />
      </div>
    </motion.div>
  );
};

export default SystemInitializationScreen;
