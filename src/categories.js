/** Catálogo de categorías del enunciado: Comida, Transporte, Servicios, Ocio, Otros. */

export const CATEGORIAS = [
  { id: 'Comida', label: 'Comida', color: '#FB7185' },
  { id: 'Transporte', label: 'Transporte', color: '#38BDF8' },
  { id: 'Servicios', label: 'Servicios', color: '#FBBF24' },
  { id: 'Ocio', label: 'Ocio', color: '#A78BFA' },
  { id: 'Otros', label: 'Otros', color: '#94A3B8' },
];

export const getCategoria = (id) =>
  CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1];
