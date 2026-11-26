import './Marca.css'

/** Logo de la guía (T20): anillo azul, flecha verde y estrella dorada, junto al nombre. */
function Marca({ tamano = 'chico' }: { tamano?: 'chico' | 'grande' }) {
  return (
    <span className={`marca marca--${tamano}`}>
      <img src="/favicon.svg" alt="" />
      <span>
        <span className="marca__ika">Ika</span>
        <span className="marca__money">Money</span>
      </span>
    </span>
  )
}

export default Marca
