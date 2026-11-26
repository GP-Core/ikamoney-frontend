import type { Tarjeta } from '../types/finanzas'
import { pesos } from '../utils/pesos'
import { campoTarjetaCambiado, tarjetaEditada } from '../utils/revisionEstado'
import type { CampoObligatorio, CampoTarjeta, Errores, EstadoTarjeta } from '../utils/revisionEstado'
import AyudaTermino from './AyudaTermino'
import TextField from './TextField'

interface RevisionTarjetaProps {
  tarjetas: Tarjeta[]
  destinoId: string
  /** La tarjeta se eligió sola porque el banco coincide. */
  sugerida: boolean
  onDestino: (id: string) => void
  nombre: string
  onNombre: (nombre: string) => void
  tarjeta: EstadoTarjeta
  onCampo: (campo: CampoTarjeta, valor: string) => void
  errores: Errores['tarjeta']
  faltan: Partial<Record<CampoObligatorio, string>>
  fechaCorte: string
  onFechaCorte: (fecha: string) => void
  errorFecha: string
  hoy: string
}

type Clase = 'monto' | 'dia' | 'tasa' | 'texto'

/** Segundo paso: de qué tarjeta es y los datos que se van a guardar en ella. */
function RevisionTarjeta({
  tarjetas, destinoId, sugerida, onDestino, nombre, onNombre, tarjeta, onCampo, errores, faltan,
  fechaCorte, onFechaCorte, errorFecha, hoy,
}: RevisionTarjetaProps) {
  const actual = tarjetas.find((t) => String(t.id) === destinoId)
  const nueva = !actual

  function sugerencia(campo: CampoTarjeta): string {
    if (actual) {
      const valores: Partial<Record<CampoTarjeta, string>> = {
        limiteCredito: pesos(actual.limite_credito).replace('$', ''),
        saldoActual: pesos(actual.saldo_actual).replace('$', ''),
        diaCorte: String(actual.dia_corte),
        diaLimitePago: String(actual.dia_pago),
        tasaAnual: actual.tasa_anual === null ? undefined : String(actual.tasa_anual),
      }
      const v = valores[campo]
      if (v) return `Hoy: ${v}`
    }
    return tarjeta.original && tarjeta.original[campo] === null ? 'No se detectó' : ''
  }

  const campo = (clave: CampoTarjeta, etiqueta: string, clase: Clase) => {
    const obligatorio = nueva && (clave in faltan || ['banco', 'limiteCredito', 'diaCorte', 'diaLimitePago'].includes(clave))
    return (
      <div className={campoTarjetaCambiado(tarjeta, clave) ? 'estado-cambiado' : ''}>
        <TextField
          etiqueta={obligatorio ? `${etiqueta} (obligatorio)` : etiqueta}
          inputMode={clase === 'texto' ? 'text' : clase === 'dia' ? 'numeric' : 'decimal'}
          prefijo={clase === 'monto' ? '$' : undefined}
          maxLength={clase === 'dia' ? 2 : 60}
          value={tarjeta.valores[clave] ?? ''}
          placeholder={sugerencia(clave)}
          error={errores[clave] ?? faltan[clave as CampoObligatorio]}
          onChange={(e) => onCampo(clave, e.target.value)}
        />
      </div>
    )
  }

  return (
    <>
      <section className="estado-ficha" aria-labelledby="estado-destino">
        <h2 id="estado-destino">¿De qué tarjeta es?</h2>
        <label className="estado-selector">
          <span className="campo__etiqueta">Tarjeta</span>
          <select value={destinoId} onChange={(e) => onDestino(e.target.value)}>
            <option value="nueva">Una tarjeta nueva</option>
            {tarjetas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </label>
        {sugerida && <p className="estado-nota">La elegimos por el banco; cámbiala si no es.</p>}
        {actual && (
          <p className="estado-nota">
            Se actualizará <strong>{actual.nombre}</strong>. Lo que dejes vacío se queda como está.
          </p>
        )}
      </section>

      <section className="estado-ficha" aria-labelledby="estado-datos">
        <div className="estado-ficha__titulo">
          <h2 id="estado-datos">Datos de la tarjeta</h2>
          {tarjeta.original && (
            <span className={`estado-marca estado-marca--${tarjetaEditada(tarjeta) ? 'editado' : 'ia'}`}>
              {tarjetaEditada(tarjeta) ? 'Editado por ti' : 'Leído por la IA'}
            </span>
          )}
        </div>

        {nueva && (
          <div className="estado-grupo">
            <TextField
              etiqueta="Nombre para reconocerla"
              maxLength={60}
              value={nombre}
              placeholder={tarjeta.valores.banco ? String(tarjeta.valores.banco) : 'Ej. BBVA Azul'}
              error={faltan.nombre}
              onChange={(e) => onNombre(e.target.value)}
            />
            {campo('banco', 'Banco', 'texto')}
          </div>
        )}

        <h3>Saldo y límite</h3>
        <div className="estado-grupo">
          {campo('saldoActual', 'Saldo al corte', 'monto')}
          {campo('limiteCredito', 'Límite de crédito', 'monto')}
        </div>

        <h3>Este periodo</h3>
        <div className="estado-grupo">
          <TextField
            etiqueta="Fecha de corte de este estado"
            type="date"
            max={hoy}
            value={fechaCorte}
            error={errorFecha}
            onChange={(e) => onFechaCorte(e.target.value)}
          />
          {campo('diaCorte', 'Día de corte (cada mes)', 'dia')}
          {campo('diaLimitePago', 'Día límite de pago', 'dia')}
          {campo('pagoMinimo', 'Pago mínimo', 'monto')}
          {campo('pagoNoIntereses', 'Pago para no generar intereses', 'monto')}
          {campo('tasaAnual', 'Tasa anual %', 'tasa')}
        </div>
        <p className="estado-terminos">
          <AyudaTermino termino="fechaCorte">Fecha de corte</AyudaTermino>
          <AyudaTermino termino="pagoMinimo">Pago mínimo</AyudaTermino>
          <AyudaTermino termino="pagoNoIntereses">Pago para no generar intereses</AyudaTermino>
          <AyudaTermino termino="tasaAnual">Tasa anual</AyudaTermino>
        </p>
      </section>
    </>
  )
}

export default RevisionTarjeta
