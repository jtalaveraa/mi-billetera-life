/** Catálogo de categorías del enunciado: Comida, Transporte, Servicios, Ocio, Otros. */

export const CATEGORIAS = [
  { id: 'Comida', label: 'Comida' },
  { id: 'Transporte', label: 'Transporte' },
  { id: 'Servicios', label: 'Servicios' },
  { id: 'Ocio', label: 'Ocio' },
  { id: 'Otros', label: 'Otros' },
];

export const getCategoria = (id) =>
  CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[CATEGORIAS.length - 1];
