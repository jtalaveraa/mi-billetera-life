import { formatMoney } from '../format.js';

export default function SummaryCard({ gastos }) {
  const total = gastos.reduce((acc, g) => acc + g.monto, 0);

  return (
    <section className="summary" aria-label="Total de gastos registrados">
      <p className="summary__label">Total gastado</p>
      <p className="summary__total">{formatMoney(total)}</p>
      <p className="summary__meta">
        {gastos.length} {gastos.length === 1 ? 'movimiento' : 'movimientos'}
      </p>
    </section>
  );
}
