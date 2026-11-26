import { useSyncExternalStore } from 'react'

/** Desde este ancho hay barra lateral y barra superior. Debe coincidir con las media queries de CSS. */
const CONSULTA = '(min-width: 1024px)'

function suscribir(alCambiar: () => void) {
  const medio = window.matchMedia(CONSULTA)
  medio.addEventListener('change', alCambiar)
  return () => medio.removeEventListener('change', alCambiar)
}

export function useEsEscritorio(): boolean {
  return useSyncExternalStore(suscribir, () => window.matchMedia(CONSULTA).matches)
}
