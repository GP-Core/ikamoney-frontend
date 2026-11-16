import { useState } from 'react'
import { registrarTarjeta, TARJETAS_USANDO_EJEMPLO } from '../services/tarjetas'
import type { Tarjeta, TarjetaNueva } from '../types/simulador'
import { leerPrecio, nombreTarjeta } from '../utils/simulador'
import './BalancePage.css'
import './SimuladorPage.css'

type Campo = 'nombre' | 'banco' | 'limite' | 'corte' | 'pago' | 'ultimos4' | 'saldo' | 'tasa'
type Errores = Partial<Record<Campo, string>>

const ORDEN: Campo[] = ['nombre', 'banco', 'limite', 'corte', 'pago', 'ultimos4', 'saldo', 'tasa']

function leerDia(texto: string): number {
  return /^\d{1,2}$/.test(texto.trim()) ? Number(texto) : NaN
}

/** Registro de tarjeta (T39, caso sin tarjetas): pide solo lo indispensable; el resto es opcional. */
function RegistrarTarjetaPage() {
  const [v, setV] = useState<Record<Campo, string>>({ nombre: '', banco: '', limite: '', corte: '', pago: '', ultimos4: '', saldo: '', tasa: '' })
  const [errores, setErrores] = useState<Errores>({})
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [creada, setCreada] = useState<Tarjeta | null>(null)

  function cambiar(campo: Campo, valor: string) {
    setV((x) => ({ ...x, [campo]: valor }))
    setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  /** Solo formato; los topes y reglas de negocio los valida el backend. */
  function validar(): Errores {
    const e: Errores = {}
    if (!v.nombre.trim()) e.nombre = 'Ponle un nombre a la tarjeta, por ejemplo "Oro".'
    if (!v.banco.trim()) e.banco = 'Escribe el banco.'
    const limite = leerPrecio(v.limite)
    if (v.limite.trim() === '') e.limite = 'Escribe el límite de crédito.'
    else if (Number.isNaN(limite) || limite <= 0) e.limite = 'El límite debe ser un número mayor a cero.'
    for (const [campo, texto, nombre] of [['corte', v.corte, 'corte'], ['pago', v.pago, 'pago']] as const) {
      const dia = leerDia(texto)
      if (texto.trim() === '') e[campo] = `Escribe el día de ${nombre} (1 a 31).`
      else if (Number.isNaN(dia) || dia < 1 || dia > 31) e[campo] = 'Debe ser un día del mes entre 1 y 31.'
    }
    if (v.ultimos4.trim() !== '' && !/^\d{4}$/.test(v.ultimos4.trim())) e.ultimos4 = 'Son exactamente 4 números.'
    if (v.saldo.trim() !== '' && Number.isNaN(leerPrecio(v.saldo))) e.saldo = 'Escribe solo números, por ejemplo 3500.'
    if (v.tasa.trim() !== '') {
      const t = leerPrecio(v.tasa)
      if (Number.isNaN(t) || t > 999.99) e.tasa = 'Escribe un porcentaje entre 0 y 999.99.'
    }
    return e
  }

  async function enviar(evento: React.SyntheticEvent) {
    evento.preventDefault()
    const nuevos = validar()
    setErrores(nuevos)
    const primero = ORDEN.find((c) => nuevos[c])
    if (primero) {
      document.getElementById(`tarjeta-${primero}`)?.focus()
      return
    }

    const datos: TarjetaNueva = {
      nombre: v.nombre.trim(),
      banco: v.banco.trim(),
      limite_credito: leerPrecio(v.limite),
      dia_corte: leerDia(v.corte),
      dia_pago: leerDia(v.pago),
    }
    if (v.ultimos4.trim()) datos.ultimos_4 = v.ultimos4.trim()
    if (v.saldo.trim()) datos.saldo_actual = leerPrecio(v.saldo)
    if (v.tasa.trim()) datos.tasa_anual = leerPrecio(v.tasa)

    setEnviando(true)
    setErrorEnvio(null)
    try {
      setCreada(await registrarTarjeta(datos))
    } catch (error) {
      setErrorEnvio(error instanceof TypeError ? 'No se pudo conectar con el servidor.' : error instanceof Error ? error.message : 'Ocurrió un error inesperado.')
    } finally {
      setEnviando(false)
    }
  }

  function campo(id: Campo, etiqueta: string, opciones: { placeholder?: string; modo?: 'text' | 'numeric' | 'decimal'; opcional?: boolean; maxLength?: number; autoFocus?: boolean } = {}) {
    const error = errores[id]
    return (
      <div className="sim-campo">
        <label htmlFor={`tarjeta-${id}`}>
          {etiqueta} {opciones.opcional && <span className="sim-opcional">(opcional)</span>}
        </label>
        <input
          id={`tarjeta-${id}`}
          inputMode={opciones.modo ?? 'text'}
          autoComplete="off"
          autoFocus={opciones.autoFocus}
          maxLength={opciones.maxLength}
          placeholder={opciones.placeholder}
          value={v[id]}
          aria-invalid={!!error}
          aria-describedby={error ? `tarjeta-${id}-error` : undefined}
          onChange={(e) => cambiar(id, e.target.value)}
        />
        {error && (
          <p id={`tarjeta-${id}-error`} className="sim-error" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <main className="balance">
      <div className="balance__ancho">
        <header className="balance__encabezado">
          <a className="balance__mes-boton score-volver" href="/?simulador" aria-label="Volver al simulador">
            ‹
          </a>
          <div className="balance__mes">
            <h1 className="balance__titulo">Registrar tarjeta</h1>
            {TARJETAS_USANDO_EJEMPLO && <span className="balance__ejemplo">Datos de ejemplo</span>}
          </div>
          <span className="score-volver score-volver--vacio" aria-hidden="true" />
        </header>

        <div className="balance__contenido">
          {creada ? (
            <section className="sim-vacio" role="status" aria-labelledby="tarjeta-lista">
              <h2 id="tarjeta-lista">¡Tarjeta registrada!</h2>
              <p>{creada.banco} · {nombreTarjeta(creada)} ya está lista para usarse en el simulador.</p>
              <a className="sim-boton" href="/?simulador">
                Ir al simulador
              </a>
              <a className="sim-boton sim-boton--suave" href="/?tarjeta-nueva">
                Registrar otra tarjeta
              </a>
            </section>
          ) : (
            <form className="sim-form" onSubmit={enviar} noValidate>
              {campo('nombre', 'Nombre de la tarjeta', { placeholder: 'Ej. Oro', autoFocus: true, maxLength: 60 })}
              {campo('banco', 'Banco', { placeholder: 'Ej. BBVA', maxLength: 60 })}
              {campo('limite', 'Límite de crédito', { placeholder: '30000', modo: 'decimal' })}
              <div className="sim-fila">
                {campo('corte', 'Día de corte', { placeholder: '1 a 31', modo: 'numeric', maxLength: 2 })}
                {campo('pago', 'Día de pago', { placeholder: '1 a 31', modo: 'numeric', maxLength: 2 })}
              </div>

              <details className="sim-mas">
                <summary>Más datos (opcional)</summary>
                <div className="sim-mas__campos">
                  {campo('ultimos4', 'Últimos 4 dígitos', { placeholder: '4417', modo: 'numeric', maxLength: 4, opcional: true })}
                  {campo('saldo', 'Saldo actual', { placeholder: '0', modo: 'decimal', opcional: true })}
                  {campo('tasa', 'Tasa anual (%)', { placeholder: '48', modo: 'decimal', opcional: true })}
                </div>
              </details>

              {errorEnvio && (
                <p className="sim-error" role="alert">
                  {errorEnvio}
                </p>
              )}
              <button type="submit" className="sim-boton" disabled={enviando}>
                {enviando ? 'Guardando…' : 'Guardar tarjeta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default RegistrarTarjetaPage
