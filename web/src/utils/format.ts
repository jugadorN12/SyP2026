/**
 * Formatea un número como moneda con separador de miles (punto) y decimales (coma).
 * @param amount El número a formatear
 * @returns El string formateado (ej: 40.000)
 */
export const formatPrice = (amount: number | string | undefined | null): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (num === undefined || num === null || isNaN(num)) {
    return '0';
  }

  return num.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};
