import { useCallback, useEffect, useState } from 'react';
import Header from './components/Header.jsx';
import SummaryCard from './components/SummaryCard.jsx';
import ExpenseForm from './components/ExpenseForm.jsx';
import ExpenseList from './components/ExpenseList.jsx';
import { addGasto, getGastos } from './db.js';

export default function App() {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('Todos');
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  const [installEvent, setInstallEvent] = useState(null);

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
    const yaInstalada = () => setInstallEvent(null);
    window.addEventListener('beforeinstallprompt', alInstalar);
    window.addEventListener('appinstalled', yaInstalada);
    return () => {
      window.removeEventListener('beforeinstallprompt', alInstalar);
      window.removeEventListener('appinstalled', yaInstalada);
    };
  }, []);

  /* -------------------------------- acciones ----------------------------- */
  const handleAdd = useCallback(async (datos) => {
    const gasto = await addGasto(datos);
    setGastos((prev) => [gasto, ...prev]);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }, [installEvent]);

  return (
    <div className="app">
      <Header canInstall={Boolean(installEvent)} onInstall={handleInstall} />

      {!online && (
        <p className="banner" role="status">
          Sin conexión. Tus gastos se guardan en este dispositivo.
        </p>
      )}

      <main>
        <SummaryCard gastos={gastos} />
        <ExpenseForm onAdd={handleAdd} />
        {cargando ? (
          <section className="card">
            <p className="empty">Cargando...</p>
          </section>
        ) : (
          <ExpenseList gastos={gastos} filtro={filtro} onFiltro={setFiltro} />
        )}
      </main>
    </div>
  );
}
