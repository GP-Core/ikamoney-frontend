import { useRegisterSW } from 'virtual:pwa-register/react'

const UNA_HORA = 60 * 60 * 1000

/**
 * Registra el service worker de la PWA y avisa cuando hay una versión nueva o cuando la app ya puede abrirse
 * sin conexión. En `npm run dev` no hay service worker, así que nunca avisa nada.
 */
export function useActualizacionPwa() {
  const {
    needRefresh: [hayVersionNueva, setHayVersionNueva],
    offlineReady: [listaSinConexion, setListaSinConexion],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registro) {
      if (!registro) return
      // Una app instalada puede quedarse abierta días: busca versión nueva cada hora y cada vez que se vuelve a ella.
      const buscar = () => {
        if (navigator.onLine) registro.update().catch(() => {})
      }
      setInterval(buscar, UNA_HORA)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') buscar()
      })
    },
  })

  return {
    hayVersionNueva,
    listaSinConexion,
    /** Activa la versión nueva y recarga la página. */
    actualizar: () => updateServiceWorker(),
    /** Oculta el aviso. Si había versión nueva, entra la próxima vez que se abra la app. */
    cerrar: () => {
      setHayVersionNueva(false)
      setListaSinConexion(false)
    },
  }
}
