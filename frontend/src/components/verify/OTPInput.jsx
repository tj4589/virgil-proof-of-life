import { useState, useRef, useEffect } from 'react';

export default function OTPInput({ length = 6, onComplete }) {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputRefs = useRef([]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.value !== "" && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  useEffect(() => {
    if (otp.every(v => v !== "")) {
      onComplete(otp.join(""));
    }
  }, [otp]);

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength="1"
          ref={(el) => (inputRefs.current[index] = el)}
          value={data}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          style={{
            width: '45px',
            height: '56px',
            borderRadius: '8px',
            border: '2px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '24px',
            fontWeight: 700,
            textAlign: 'center',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--red)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
        />
      ))}
    </div>
  );
}
