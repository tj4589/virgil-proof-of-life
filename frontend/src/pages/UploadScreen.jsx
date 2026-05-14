import { useState } from 'react';
import { uploadWorkers } from '../lib/api';
import { Sidebar } from '../components/Sidebar';

const UploadScreen = ({ onUpload, onNav, theme, onToggleTheme }) => {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const mock = Array.from({ length: 20 }, (_, i) => ({
        firstName: i < 4 ? 'Ghost' : 'Worker',
        lastName: `${i + 1}`,
        nin: i < 4 ? '10000000019' : `10000000${String(i).padStart(2, '0')}`,
        bvn: `20000000${String(i).padStart(2, '0')}`,
        bankAccount: i < 4 ? '0123456789' : `98765432${String(i).padStart(2, '0')}`,
        salary: i < 4 ? 999999 : 150000 + Math.random() * 50000,
        department: i < 4 ? null : 'Executive Council',
        staffId: `VIR-${100000 + i}`,
      }));
      await uploadWorkers(mock);
      onUpload();
    } catch (e) {
      alert(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="screen on" style={{ flexDirection: 'row' }}>
      <Sidebar active="overview" onNav={onNav} theme={theme} onToggleTheme={onToggleTheme} />
      <div className="main-area" style={{ flex: 1 }}>
        <div className="topbar">
          <div>
            <div className="topbar-title">Upload Payroll</div>
            <div className="topbar-sub">Upload your payroll file to begin integrity verification</div>
          </div>
          <div className="topbar-right">
            <span className="batch-tag">May 2026 Batch</span>
            <button className="btn-icon"><i className="ti ti-bell" /></button>
          </div>
        </div>

        <div style={{ padding: '24px', maxWidth: '700px' }}>
          <div className="upload-zone" onClick={handle}>
            <div className="upload-icon">
              <i className="ti ti-cloud-upload" style={{ fontSize: '28px', color: 'var(--red)' }} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)' }}>Drag and drop your file here</div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>or</div>
            <button
              className="btn btn-primary"
              onClick={e => { e.stopPropagation(); handle(); }}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Choose File'}
            </button>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Supports Excel, .xlsx, .xls or CSV files</div>
          </div>

          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--card)', borderRadius: '8px', border: '1px solid var(--border2)', fontSize: '11px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ti ti-lock" style={{ color: 'var(--green)' }} /> Your files are encrypted and never stored
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadScreen;
