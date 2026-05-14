export const Sidebar = ({ active, onNav, theme, onToggleTheme }) => {
  const logoSrc = theme === 'light' ? '/logo-light.png' : '/logo.png';
  const items = [
    { id:'overview', ic:'ti-layout-dashboard', label:'Overview' },
    { id:'detection', ic:'ti-shield-search', label:'Detection', badge:'958' },
    { id:'workers', ic:'ti-users', label:'Workers' },
    { id:'payments', ic:'ti-credit-card', label:'Payments' },
    { id:'audit', ic:'ti-clipboard-list', label:'Audit Trail' },
    { id:'reports', ic:'ti-chart-bar', label:'Reports' },
    { id:'settings', ic:'ti-settings', label:'Settings' },
  ];
  return (
    <div className="sidebar">
      <div className="sb-brand">
        <img src={logoSrc} alt="VIRGIL" style={{ height: '28px', width: 'auto' }} />
      </div>
      <nav className="sb-nav">
        {items.map(it => (
          <div key={it.id} className={`sb-item ${active===it.id?'active':''}`} onClick={() => onNav && onNav(it.id)}>
            <i className={`ti ${it.ic}`} style={{fontSize:'15px'}}></i>
            {it.label}
            {it.badge && <span className="sb-badge">{it.badge}</span>}
          </div>
        ))}
      </nav>
      <div className="sb-footer">
        <div className="sb-avatar">AU</div>
        <div>
          <div style={{fontSize:'11px',fontWeight:600,color:'var(--text)'}}>Admin User</div>
          <div style={{fontSize:'10px',color:'var(--text3)'}}>Super Admin</div>
        </div>
      </div>
    </div>
  );
};
