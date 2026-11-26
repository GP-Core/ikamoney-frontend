const PASOS = ['Sube', 'Revisa', 'Listo']

/** En qué punto del flujo del estado de cuenta está el usuario. */
function PasosEstadoCuenta({ paso }: { paso: 1 | 2 | 3 }) {
  return (
    <ol className="estado-pasos" aria-label="Pasos">
      {PASOS.map((texto, i) => (
        <li
          key={texto}
          className={`estado-pasos__paso ${i + 1 < paso ? 'estado-pasos__paso--hecho' : ''}`}
          aria-current={i + 1 === paso ? 'step' : undefined}
        >
          <span className="estado-pasos__numero">{i + 1}</span>
          {texto}
        </li>
      ))}
    </ol>
  )
}

export default PasosEstadoCuenta
