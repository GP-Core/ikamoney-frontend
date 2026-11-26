/** Iniciales para la ficha de usuario: "Usuario Demo" → "UD", "Ana" → "A". */
export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0).toLocaleUpperCase('es-MX'))
    .join('')
}

/**
 * Quita los códigos internos del equipo que vienen en textos del backend ("(RN-19)", "de T25",
 * "(Fórmula 9)", "F12:", "(T24)"). Temporal: lo correcto es que el backend no los mande.
 */
export function sinCodigosInternos(texto: string): string {
  return texto
    .replace(/\bF\d{1,2}:\s*/g, '')
    .replace(/\s*\((?:[^()]*\bde )?T\d+\)/g, '')
    .replace(/\s*\((?:RN|IC|IU|IS|REQ|CE|CP)-\d+[^)]*\)/g, '')
    .replace(/\s*\((?:T\d+[,:]?\s*)?Fórmula \d+[^)]*\)/g, '')
    .replace(/\s+de T\d+\b/g, '')
}
