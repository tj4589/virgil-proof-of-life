import { useEffect, useState } from 'react';
import SplashScreen     from './pages/SplashScreen';
import AuthScreen       from './pages/AuthScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import SystemInitializationScreen from './pages/SystemInitializationScreen';
import DashboardScreen  from './pages/DashboardScreen';
import UploadScreen     from './pages/UploadScreen';
import AILoadingScreen  from './pages/AILoadingScreen';
import ResultsScreen    from './pages/ResultsScreen';
import PaymentsScreen   from './pages/PaymentsScreen';
import WorkersScreen    from './pages/WorkersScreen';
import AuditTrailScreen from './pages/AuditTrailScreen';
import ReportsScreen    from './pages/ReportsScreen';
import SettingsScreen   from './pages/SettingsScreen';
import ProofOfLifeScreen from './pages/ProofOfLifeScreen';

const getInitialTheme = () => {
  const saved = localStorage.getItem('virgil-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [theme, setTheme] = useState(getInitialTheme);
  const isVerify = window.location.pathname === '/verify';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('virgil-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(current => current === 'light' ? 'dark' : 'light');

  const handleNav = (id) => {
    if (id === 'overview')  { setScreen('dashboard'); return; }
    if (id === 'payments')  { setScreen('payments');  return; }
    if (id === 'detection') { setScreen('results');   return; }
    if (id === 'workers')   { setScreen('workers');   return; }
    if (id === 'audit')     { setScreen('audit');     return; }
    if (id === 'reports')   { setScreen('reports');   return; }
    if (id === 'settings')  { setScreen('settings');  return; }
    setScreen('dashboard');
  };

  if (isVerify) return <ProofOfLifeScreen theme={theme} onToggleTheme={toggleTheme} />;

  if (screen === 'splash')    return <SplashScreen    onComplete={() => setScreen('auth')} theme={theme} onToggleTheme={toggleTheme} />;
  
  if (screen === 'auth')      return <AuthScreen      onLogin={() => {
    const isSetup = localStorage.getItem('virgil_setup') === 'true';
    setScreen(isSetup ? 'sysinit' : 'onboard');
  }} theme={theme} onToggleTheme={toggleTheme} />;

  if (screen === 'onboard')   return <OnboardingScreen onComplete={() => {
    localStorage.setItem('virgil_setup', 'true');
    setScreen('sysinit');
  }} theme={theme} onToggleTheme={toggleTheme} />;

  if (screen === 'sysinit')   return <SystemInitializationScreen onComplete={() => setScreen('dashboard')} />;
  if (screen === 'upload')    return <UploadScreen    onUpload={() => setScreen('loading')} onNav={handleNav} theme={theme} onToggleTheme={toggleTheme} />;
  if (screen === 'loading')   return <AILoadingScreen onComplete={() => setScreen('results')} theme={theme} onToggleTheme={toggleTheme} />;
  if (screen === 'results')   return <ResultsScreen   onDashboard={() => setScreen('dashboard')} onNav={handleNav} theme={theme} onToggleTheme={toggleTheme} />;
  if (screen === 'payments')  return <PaymentsScreen  onNav={handleNav} theme={theme} onToggleTheme={toggleTheme} />;
  if (screen === 'workers')   return <WorkersScreen   onNav={handleNav} theme={theme} onToggleTheme={toggleTheme} />;
  if (screen === 'audit')     return <AuditTrailScreen onNav={handleNav} theme={theme} onToggleTheme={toggleTheme} />;
  if (screen === 'reports')   return <ReportsScreen   onNav={handleNav} theme={theme} onToggleTheme={toggleTheme} />;
  if (screen === 'settings')  return <SettingsScreen  onNav={handleNav} theme={theme} onToggleTheme={toggleTheme} />;
  return <DashboardScreen onNav={handleNav} onUpload={() => setScreen('upload')} theme={theme} onToggleTheme={toggleTheme} />;
}
