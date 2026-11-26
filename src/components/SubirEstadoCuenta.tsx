import { useState } from 'react'
import type { DragEvent } from 'react'
import { useEsEscritorio } from '../hooks/useEsEscritorio'
import type { ApiError } from '../services/api'
import { esReintentable } from '../services/estadosCuenta'
import type { CupoExtraccion } from '../types/estadoCuenta'
import { puedeLeerConIa, textoCupo, textoPeso } from '../utils/revisionEstado'
import Button from './Button'
import CupoLecturas from './CupoLecturas'
import FormAlert from './FormAlert'
import Icon from './Icon'

interface SubirEstadoCuentaProps {
  maxMb: number
  cupo: CupoExtraccion | null
  archivo: File | null
  errorArchivo: string
  errorApi: ApiError | null
  onArchivo: (archivo: File | null) => void
  onLeer: () => void
  onManual: () => void
  onCancelar: () => void
}

/** Primer paso: elegir el PDF, o capturar a mano. */
function SubirEstadoCuenta({
  maxMb, cupo, archivo, errorArchivo, errorApi, onArchivo, onLeer, onManual, onCancelar,
}: SubirEstadoCuentaProps) {
  const escritorio = useEsEscritorio()
  const [arrastrando, setArrastrando] = useState(false)
  const conIa = puedeLeerConIa(cupo)

  function soltar(e: DragEvent) {
    e.preventDefault()
    setArrastrando(false)
    onArchivo(e.dataTransfer.files[0] ?? null)
  }

  return (
    <div className="estado-subir">
      {cupo && cupo.restantes > 0 && <CupoLecturas cupo={cupo} />}

      {!conIa ? (
        <FormAlert tipo="precaucion">{textoCupo(cupo)}</FormAlert>
      ) : archivo ? (
        <div className="estado-archivo">
          <Icon nombre="recibo" />
          <p>
            <strong>{archivo.name}</strong>
            <span>{textoPeso(archivo.size)}</span>
          </p>
          <button type="button" className="estado-enlace" onClick={() => onArchivo(null)}>
            Quitar
          </button>
        </div>
      ) : (
        <label
          className={`estado-zona ${arrastrando ? 'estado-zona--encima' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setArrastrando(true)
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={soltar}
        >
          <input
            type="file"
            accept="application/pdf"
            className="estado-zona__input"
            onChange={(e) => onArchivo(e.target.files?.[0] ?? null)}
          />
          <Icon nombre="subir" tamano={32} />
          <strong>{escritorio ? 'Arrastra tu PDF aquí o haz clic para elegirlo' : 'Elegir PDF'}</strong>
          <span>PDF de hasta {maxMb} MB</span>
        </label>
      )}

      {errorArchivo && <FormAlert tipo="critico">{errorArchivo}</FormAlert>}
      {errorApi && (
        <FormAlert tipo="critico">
          <p>{errorApi.message}</p>
          {esReintentable(errorApi) && archivo && (
            <button type="button" className="estado-enlace" onClick={onLeer}>
              Reintentar
            </button>
          )}
        </FormAlert>
      )}

      <ul className="estado-ayudas">
        <li>
          <Icon nombre="tarjeta" tamano={20} />
          Solo estados de cuenta de tarjeta de crédito, en PDF.
        </li>
        <li>
          <Icon nombre="ojoTachado" tamano={20} />
          Antes de mandarlo a la IA ocultamos tu número de tarjeta, CLABE, RFC, CURP y nombre. No guardamos el PDF.
        </li>
        <li>
          <Icon nombre="sano" tamano={20} />
          Revisas todo antes: nada se guarda hasta que confirmes.
        </li>
      </ul>

      <div className="estado-botones">
        {conIa && (
          <Button onClick={onLeer} disabled={!archivo}>
            Leer con IA{cupo ? ' · usa 1 lectura' : ''}
          </Button>
        )}
        <Button variante={conIa ? 'secundario' : 'primario'} onClick={onManual}>
          {conIa ? 'Prefiero capturar a mano' : 'Capturar a mano'}
        </Button>
        <button type="button" className="estado-enlace" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

export default SubirEstadoCuenta
