/** Pantalla mínima mientras se verifica la sesión guardada. */
function PantallaCargando() {
  return (
    <main
      style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', color: 'var(--gris-azulado)' }}
      aria-busy="true"
    >
      <p role="status">Cargando…</p>
    </main>
  )
}

export default PantallaCargando