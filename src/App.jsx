import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import SummaryCard from './components/SummaryCard.jsx';
import ExpenseForm from './components/ExpenseForm.jsx';
import ExpenseList from './components/ExpenseList.jsx';
import { addGasto, clearGastos, deleteGasto, getGastos } from './db.js';

export default function App() {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('Todos');
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [toast, setToast] = useState(null);
  const [installEvent, setInstallEvent] = useState(null);
  const toastTimer = useRef(null);

  /* ---------------------------- carga inicial ---------------------------- */
  useEffect(() => {
    let activo = true;
    getGastos().then((items) => {
      if (!activo) return;
      setGastos(items);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, []);

  /* ------------------------- estado de la conexión ----------------------- */
  useEffect(() => {
    const alConectar = () => setOnline(true);
    const alDesconectar = () => setOnline(false);
    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);
    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
    };
  }, []);

  /* ------------------------ prompt de instalación ------------------------ */
  useEffect(() => {
    const alInstalar = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const yaInstalada = () => {
      setInstallEvent(null);
      mostrarToast('¡App instalada! Ya puedes abrirla desde tu pantalla de inicio.');
    };
    window.addEventListener('beforeinstallprompt', alInstalar);
    window.addEventListener('appinstalled', yaInstalada);
    return () => {
      window.removeEventListener('beforeinstallprompt', alInstalar);
      window.removeEventListener('appinstalled', yaInstalada);
    };
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const mostrarToast = useCallback((mensaje) => {
    setToast(mensaje);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  /* -------------------------------- acciones ----------------------------- */
  const handleAdd = useCallback(
    async (datos) => {
      const gasto = await addGasto(datos);
      setGastos((prev) => [gasto, ...prev]);
      mostrarToast(`Gasto "${gasto.concepto}" guardado${navigator.onLine ? '' : ' sin conexión'}.`);
    },
    [mostrarToast]
  );

  const handleDelete = useCallback(
    async (id) => {
      await deleteGasto(id);
      setGastos((prev) => prev.filter((g) => g.id !== id));
      mostrarToast('Gasto eliminado.');
    },
    [mostrarToast]
  );

  const handleClear = useCallback(async () => {
    if (!window.confirm('¿Eliminar todos los gastos registrados? Esta acción no se puede deshacer.')) return;
    await clearGastos();
    setGastos([]);
    mostrarToast('Historial vaciado.');
  }, [mostrarToast]);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome !== 'accepted') mostrarToast('Puedes instalarla más tarde desde el menú del navegador.');
    setInstallEvent(null);
  }, [installEvent, mostrarToast]);

  return (
    <div className="app">
      <Header canInstall={Boolean(installEvent)} onInstall={handleInstall} />

      {!online && (
        <p className="banner" role="status">
          Estás sin conexión. Puedes seguir registrando gastos: se guardan en tu dispositivo.
        </p>
      )}

      <main>
        <SummaryCard gastos={gastos} />
        <ExpenseForm onAdd={handleAdd} />
        {cargando ? (
          <section className="card">
            <div className="skeleton" />
            <div className="skeleton skeleton--sm" />
          </section>
        ) : (
          <ExpenseList
            gastos={gastos}
            filtro={filtro}
            onFiltro={setFiltro}
            onDelete={handleDelete}
            onClear={handleClear}
          />
        )}
      </main>

      <div className="toast-area" aria-live="polite" aria-atomic="true">
        {toast && <div className="toast">{toast}</div>}
      </div>
    </div>
  );
}
