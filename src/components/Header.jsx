export default function Header({ canInstall, onInstall }) {
  return (
    <header className="header">
      <span className="brand">Mi Billetera Lite</span>

      {canInstall && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onInstall}>
          Instalar
        </button>
      )}
    </header>
  );
}
