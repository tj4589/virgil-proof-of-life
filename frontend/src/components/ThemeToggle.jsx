export const ThemeToggle = ({ theme, onToggle, compact = false }) => {
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? 'compact' : ''}`}
      onClick={onToggle}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
    >
      <i className={`ti ${isLight ? 'ti-moon' : 'ti-sun'}`} />
      {!compact && <span>{isLight ? 'Dark' : 'Light'}</span>}
    </button>
  );
};
