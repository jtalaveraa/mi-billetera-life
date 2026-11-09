import { getCategoria, CATEGORIAS } from '../categories.js';
import { formatMoney, formatDate } from '../format.js';

function EmptyState({ filtrando }) {
  return (
    <div className="empty">
      <span className="empty__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="6" width="18" height="13" rx="3" />
            <path d="M3 10.5h18" />
            <path d="M16.5 15h2" />
          </g>
        </svg>
      </span>
      <p className="empty__title">
        {filtrando ? 'Sin gastos en esta categoría' : 'Todavía no hay gastos'}
      </p>
      <p className="empty__text">
        {filtrando
          ? 'Prueba con otra categoría o registra uno nuevo.'
          : 'Registra tu primer gasto con el formulario de arriba. Funciona igual sin internet.'}
      </p>
    </div>
  );
}

export default function ExpenseList({ gastos, filtro, onFiltro, onDelete, onClear }) {
  const visibles = filtro === 'Todos' ? gastos : gastos.filter((g) => g.categoria === filtro);

  return (
    <section className="card list" aria-label="Historial de gastos">
      <div className="list__head">
        <h2 className="card__title">Historial</h2>
        {gastos.length > 0 && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onClear}>
            Vaciar
          </button>
        )}
      </div>

      <div className="chips chips--filter" role="tablist" aria-label="Filtrar por categoría">
        {['Todos', ...CATEGORIAS.map((c) => c.id)].map((id) => {
          const cat = id === 'Todos' ? null : getCategoria(id);
          const activa = filtro === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activa}
              className={`chip chip--sm ${activa ? 'chip--active' : ''}`}
              style={activa && cat ? { '--chip-color': cat.color } : undefined}
              onClick={() => onFiltro(id)}
            >
              {id}
            </button>
          );
        })}
      </div>

      {visibles.length === 0 ? (
        <EmptyState filtrando={gastos.length > 0} />
      ) : (
        <ul className="items">
          {visibles.map((gasto, index) => {
            const { color, label } = getCategoria(gasto.categoria);
            return (
              <li
                key={gasto.id}
                className="item"
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
              >
                <span className="item__info">
                  <strong className="item__concepto">{gasto.concepto}</strong>
                  <small className="item__meta" style={{ color }}>{label}</small>
                </span>

                <span className="item__amount">
                  <strong className="item__monto">{formatMoney(gasto.monto)}</strong>
                  <small className="item__fecha">{formatDate(gasto.createdAt)}</small>
                </span>

                <button
                  type="button"
                  className="item__delete"
                  onClick={() => onDelete(gasto.id)}
                  aria-label={`Eliminar ${gasto.concepto}`}
                  title="Eliminar"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4.5 7h15" />
                      <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
                      <path d="M6.5 7.5 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-11.5" />
                    </g>
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
