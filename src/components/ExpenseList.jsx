import { CATEGORIAS, getCategoria } from '../categories.js';
import { formatMoney, formatDate } from '../format.js';

export default function ExpenseList({ gastos, filtro, onFiltro }) {
  const visibles = filtro === 'Todos' ? gastos : gastos.filter((g) => g.categoria === filtro);

  return (
    <section className="card" aria-label="Historial de gastos">
      <h2 className="card__title">Historial</h2>

      <div className="chips chips--filter" role="tablist" aria-label="Filtrar por categoría">
        {['Todos', ...CATEGORIAS.map((c) => c.id)].map((id) => {
          const activa = filtro === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activa}
              className={`chip chip--sm ${activa ? 'chip--active' : ''}`}
              onClick={() => onFiltro(id)}
            >
              {id}
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <p className="empty">Sin gastos todavía.</p>
      ) : (
        <ul className="items">
          {visibles.map((gasto) => (
            <li key={gasto.id} className="item">
              <span className="item__info">
                <strong className="item__concepto">{gasto.concepto}</strong>
                <small className="item__meta">{getCategoria(gasto.categoria).label}</small>
              </span>

              <span className="item__amount">
                <strong className="item__monto">{formatMoney(gasto.monto)}</strong>
                <small className="item__fecha">{formatDate(gasto.createdAt)}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
