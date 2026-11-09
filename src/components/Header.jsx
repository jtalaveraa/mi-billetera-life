export default function Header({ canInstall, onInstall }) {
  return (
    <header className="header">
      <div className="brand">
        <span className="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="4" y="7.5" width="16" height="12" rx="3.2" fill="currentColor" />
            <rect x="7" y="4" width="10" height="5" rx="1.6" fill="currentColor" opacity="0.45" />
            <circle cx="16.6" cy="13.5" r="1.7" fill="#10b981" />
          </svg>
        </span>
        <span className="brand__text">
          <strong>Mi Billetera</strong>
          <small>Lite</small>
        </span>
      </div>

      <div className="header__actions">
        {canInstall && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onInstall}>
            <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3.5v11" />
                <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
                <path d="M4.5 19.5h15" />
              </g>
            </svg>
            Instalar
          </button>
        )}
      </div>
    </header>
  );
}
