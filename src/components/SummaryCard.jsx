import { CATEGORIAS } from '../categories.js';
import { formatMoney } from '../format.js';

export default function SummaryCard({ gastos }) {
  const total = gastos.reduce((acc, g) => acc + g.monto, 0);

  const porCategoria = CATEGORIAS.map((cat) => {
    const subtotal = gastos
      .filter((g) => g.categoria === cat.id)
      .reduce((acc, g) => acc + g.monto, 0);
    return { ...cat, subtotal, porcentaje: total > 0 ? (subtotal / total) * 100 : 0 };
  }).filter((c) => c.subtotal > 0);

  const mayor = porCategoria.reduce(
    (max, c) => (c.subtotal > (max?.subtotal ?? 0) ? c : max),
    null
  );

  return (
    <section className="summary" aria-label="Total de gastos registrados">
      <p className="summary__label">Total gastado</p>
      <p className="summary__total">{formatMoney(total)}</p>

      <div className="summary__meta">
        <span>
          <strong>{gastos.length}</strong> {gastos.length === 1 ? 'movimiento' : 'movimientos'}
        </span>
        {mayor && (
          <span>
            Mayor gasto en <strong>{mayor.label}</strong>
          </span>
        )}
      </div>

      {porCategoria.length > 0 && (
        <>
          <div className="bar" role="img" aria-label="Distribución de gastos por categoría">
            {porCategoria.map((c) => (
              <span
                key={c.id}
                className="bar__segment"
                style={{ width: `${c.porcentaje}%`, background: c.color }}
                title={`${c.label}: ${formatMoney(c.subtotal)}`}
              />
            ))}
          </div>
          <ul className="legend">
            {porCategoria.map((c) => (
              <li key={c.id}>
                <span className="legend__dot" style={{ background: c.color }} aria-hidden="true" />
                {c.label}
                <b>{Math.round(c.porcentaje)}%</b>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
