import { useEffect, useState } from 'react'

const reducirMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Cuenta de 0 al valor indicado en `ms` milisegundos. Con "reducir movimiento" devuelve el valor directo. */
export function useContador(objetivo: number, ms = 900): number {
  const [valor, setValor] = useState(0)
  const reducido = reducirMovimiento()

  useEffect(() => {
    if (reducido) return
    let cuadro = 0
    const inicio = performance.now()
    const paso = (ahora: number) => {
      const avance = Math.min((ahora - inicio) / ms, 1)
      setValor(objetivo * (1 - Math.pow(1 - avance, 3))) // desacelera al final
      if (avance < 1) cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [objetivo, ms, reducido])

  return reducido ? objetivo : valor
}
