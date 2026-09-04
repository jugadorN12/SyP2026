import CryptoJS from 'crypto-js';

/**
 * Hashea un PIN utilizando SHA-256 para almacenamiento seguro.
 * @param pin PIN de 4 a 6 dígitos
 * @returns Hash en formato string
 */
export const hashPin = (pin: string): string => {
  return CryptoJS.SHA256(pin).toString();
};

/**
 * Compara un PIN en texto plano contra un hash guardado.
 * @param pin PIN ingresado por el usuario
 * @param hash Hash recuperado de la base de datos
 * @returns boolean
 */
export const comparePin = (pin: string, hash: string): boolean => {
  return hashPin(pin) === hash;
};
