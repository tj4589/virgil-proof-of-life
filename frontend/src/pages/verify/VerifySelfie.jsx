import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MobileShell from '../../components/verify/MobileShell';
import useCamera from '../../hooks/useCamera';

export default function VerifySelfie({ onNext, onBack }) {
  const { videoRef, start, stop, capture, error } = useCamera();
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    start();
    return () => stop();
  }, []);

  const handleCapture = () => {
    setIsCapturing(true);
    const image = capture();
    // Simulate a brief delay for "processing"
    setTimeout(() => {
      onNext({ selfie: image });
    }, 1500);
  };

  return (
    <MobileShell step={4}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
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
            marginBottom: '24px',
            cursor: 'pointer',
            padding: 0
          }}
        >
          <i className="ti ti-chevron-left" />
          Back
        </button>

        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Facial Biometrics</h2>
        <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '24px' }}>
          Position your face within the frame and look directly at the camera.
        </p>

        {error ? (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <i className="ti ti-camera-off" style={{ fontSize: '40px', color: 'var(--red)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--text)', fontSize: '16px', fontWeight: 500 }}>{error}</p>
            <button 
              className="btn" 
              style={{ marginTop: '16px', color: 'var(--red)', background: 'transparent', border: '1px solid var(--red)' }}
              onClick={() => start()}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            aspectRatio: '3/4', 
            background: '#000', 
            borderRadius: '24px', 
            overflow: 'hidden',
            border: '2px solid var(--border)'
          }}>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            
            {/* Oval Overlay */}
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              background: 'radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.7) 35%)',
              pointerEvents: 'none'
            }} />

            {/* Corner Brackets */}
            <div className="brackets" style={{ position: 'absolute', top: '15%', left: '15%', right: '15%', bottom: '15%', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '100px', pointerEvents: 'none' }} />

            {/* Scanning Bar */}
            {!isCapturing && (
              <motion.div 
                animate={{ top: ['20%', '80%', '20%'] }} 
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{ 
                  position: 'absolute', 
                  left: '10%', 
                  width: '80%', 
                  height: '2px', 
                  background: 'var(--red)', 
                  boxShadow: '0 0 15px var(--red)',
                  zIndex: 2 
                }} 
              />
            )}

            {isCapturing && (
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                background: 'rgba(0,0,0,0.6)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                zIndex: 10
              }}>
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%' }}
                />
                <p style={{ color: '#fff', marginTop: '16px', fontSize: '14px', fontWeight: 500 }}>Processing Identity...</p>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingBottom: '20px', paddingTop: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ color: 'var(--text3)', fontSize: '20px' }}><i className="ti ti-bulb" /></div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: 1.5 }}>
              Ensure your face is clearly visible. Remove glasses or masks for better accuracy.
            </div>
          </div>
          
          <button 
            className="btn btn-primary" 
            disabled={isCapturing || !!error}
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
              opacity: isCapturing ? 0.7 : 1
            }}
            onClick={handleCapture}
          >
            Capture Identity
          </button>
        </div>
      </motion.div>
    </MobileShell>
  );
}
