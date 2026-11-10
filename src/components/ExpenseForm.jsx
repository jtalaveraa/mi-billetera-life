import { useState } from 'react';
import { CATEGORIAS } from '../categories.js';

const ESTADO_INICIAL = { concepto: '', monto: '', categoria: 'Comida' };

export default function ExpenseForm({ onAdd }) {
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const actualizar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrores((prev) => ({ ...prev, [campo]: undefined }));
  };

  const validar = () => {
    const nuevos = {};
    if (!form.concepto.trim()) nuevos.concepto = 'Falta el concepto';
    const monto = Number(form.monto);
    if (form.monto === '' || Number.isNaN(monto)) nuevos.monto = 'Falta el monto';
    else if (monto <= 0) nuevos.monto = 'Debe ser mayor a 0';
    return nuevos;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    await onAdd({
      concepto: form.concepto,
      monto: Number(form.monto),
      categoria: form.categoria,
    });
    setForm({ ...ESTADO_INICIAL, categoria: form.categoria });
    setEnviando(false);
  };

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2 className="card__title">Nuevo gasto</h2>

      <div className="field">
        <label htmlFor="concepto">Concepto</label>
        <input
          id="concepto"
          type="text"
          inputMode="text"
          autoComplete="off"
          placeholder="Café"
          maxLength={60}
          value={form.concepto}
          onChange={(e) => actualizar('concepto', e.target.value)}
          aria-invalid={Boolean(errores.concepto)}
        />
        {errores.concepto && <p className="field__error">{errores.concepto}</p>}
      </div>

      <div className="field">
        <label htmlFor="monto">Monto</label>
        <div className="field__money">
          <span aria-hidden="true">$</span>
          <input
            id="monto"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.monto}
            onChange={(e) => actualizar('monto', e.target.value)}
            aria-invalid={Boolean(errores.monto)}
          />
        </div>
        {errores.monto && <p className="field__error">{errores.monto}</p>}
      </div>

      <div className="field">
        <span className="field__legend" id="label-categoria">Categoría</span>
        <div className="chips" role="radiogroup" aria-labelledby="label-categoria">
          {CATEGORIAS.map(({ id, label }) => {
            const activa = form.categoria === id;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={activa}
                className={`chip ${activa ? 'chip--active' : ''}`}
                onClick={() => actualizar('categoria', id)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <button type="submit" className="btn btn--primary btn--block" disabled={enviando}>
        Guardar gasto
      </button>
    </form>
  );
}
