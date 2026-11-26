import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCategorias, useCuentas } from '../hooks/useFinanzas'
import { finanzasService } from '../services/finanzas'
import { movimientosService } from '../services/movimientos'
import { SIMULADOR_USANDO_EJEMPLO } from '../services/simulador'
import type { EscenarioSimulacion, SimulacionResponse } from '../types/simulador'
import { agruparCuentas, notaAlRegistrar } from '../utils/cuentas'
import { mensajeError } from '../utils/errores'
import { hoyIso } from '../utils/finanzas'
import { pesos } from '../utils/pesos'
import { datoDelEscenario, nombreEscenario } from '../utils/simulador'
import { cambioDeScore, conceptoDeGasto, textoRegistro } from '../utils/simuladorVista'
import ConfirmDialog from './ConfirmDialog'
import FormAlert from './FormAlert'
import RegistrarCompra from './RegistrarCompra'

interface RegistroDeCompraProps {
  data: SimulacionResponse
  elegido: EscenarioSimulacion | null
}

/**
 * RF-50: registra la compra con la forma de pago que se eligió, siempre con confirmación. A MSI crea el plan
 * en la tarjeta; de contado, un gasto de hoy que, si se elige cuenta, sale de ella.
 */
function RegistroDeCompra({ data, elegido }: RegistroDeCompraProps) {
  const navigate = useNavigate()
  const { datos: cuentas } = useCuentas()
  const { datos: categorias } = useCategorias()
  // null = lo que se propone: la primera de débito y "Compras".
  const [cuentaElegida, setCuentaElegida] = useState<string | null>(null)
  const [categoriaElegida, setCategoriaElegida] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Con datos de ejemplo las tarjetas no son reales: se puede elegir, pero no registrar.
  if (SIMULADOR_USANDO_EJEMPLO) {
    return (
      <RegistrarCompra
        resumen="Con datos de ejemplo no se registra."
        advertencia={null}
        contado={null}
        textoBoton="Registrar compra"
        listo={false}
        onRegistrar={() => {}}
      />
    )
  }

  const conDinero = cuentas ? agruparCuentas(cuentas.filter((c) => c.activa)).dinero : null
  const cuentaId = cuentaElegida ?? String((conDinero?.find((c) => c.tipo === 'debito') ?? conDinero?.[0])?.id ?? '')
  const cuenta = conDinero?.find((c) => String(c.id) === cuentaId)
  const categoriaId =
    categoriaElegida ?? String((categorias?.find((c) => c.nombre === 'Compras') ?? categorias?.[0])?.id ?? '')

  const esContado = elegido?.tipo === 'contado'
  const texto = elegido
    ? textoRegistro(elegido, {
        descripcion: data.descripcion, precio: data.precio, cuenta: cuenta?.nombre ?? null, formatear: pesos,
      })
    : null
  const motivo =
    elegido?.veredicto === 'no_recomendable'
      ? ((elegido.regla === 'RN-16' ? elegido.razon : datoDelEscenario(elegido)) ?? 'tu dinero quedaría muy justo.')
      : null
  const listo = !!elegido && (esContado ? !!cuentas && !!categoriaId : elegido.tarjeta_id !== null && elegido.mensualidad !== null)

  async function registrar() {
    if (!elegido) return
    setGuardando(true)
    setError(null)
    try {
      if (elegido.tipo === 'contado') {
        await movimientosService.crear({
          tipo: 'gasto',
          concepto: conceptoDeGasto(data.descripcion),
          monto: data.precio,
          fecha: hoyIso(),
          frecuencia: 'unico',
          categoria_id: Number(categoriaId),
          clase: 'variable',
          cuenta_id: cuenta?.id ?? null,
        })
        navigate('/movimientos', { state: { aviso: `Compra "${data.descripcion}" registrada.` } })
      } else {
        await finanzasService.crearPlanMsi(elegido.tarjeta_id!, {
          descripcion: data.descripcion,
          monto_original: data.precio,
          num_mensualidades: elegido.meses!,
          mensualidades_pagadas: 0,
          monto_mensualidad: elegido.mensualidad!,
          fecha_compra: hoyIso(),
        })
        navigate(`/tarjetas/${elegido.tarjeta_id}`, {
          state: { aviso: `Compra "${data.descripcion}" agregada a ${elegido.meses} MSI.` },
        })
      }
    } catch (err) {
      setError(mensajeError(err))
      setGuardando(false)
    }
  }

  const score = elegido && cambioDeScore(elegido, data.score_actual)

  return (
    <>
      <RegistrarCompra
        resumen={texto && (esContado ? `${texto.resumen} Se registra como un gasto de este mes.` : `${texto.resumen} La verás en tus compras a MSI y en tu proyección.`)}
        advertencia={motivo}
        contado={
          esContado
            ? {
                cuentas: conDinero,
                cuentaId,
                onCuenta: setCuentaElegida,
                categorias,
                categoriaId,
                onCategoria: setCategoriaElegida,
                nota: notaAlRegistrar({
                  cuenta, monto: data.precio, esIngreso: false, seRepite: false, esFuturo: false, formatear: pesos,
                }),
              }
            : null
        }
        textoBoton={!elegido ? 'Registrar compra' : esContado ? 'Registrar compra de contado' : `Registrar a ${elegido.meses} MSI`}
        listo={listo}
        onRegistrar={() => {
          setError(null)
          setConfirmando(true)
        }}
      />

      <ConfirmDialog
        abierto={confirmando && !!elegido}
        titulo="¿Registrar esta compra?"
        textoConfirmar="Sí, registrar"
        textoCancelar="Volver"
        varianteConfirmar="primario"
        procesando={guardando}
        onConfirmar={registrar}
        onCancelar={() => setConfirmando(false)}
      >
        {elegido && texto && (
          <>
            <dl className="sim-confirmar">
              <div>
                <dt>Compra</dt>
                <dd>{data.descripcion} · {pesos(data.precio)}</dd>
              </div>
              <div>
                <dt>Forma de pago</dt>
                <dd>{nombreEscenario(elegido)}</dd>
              </div>
              <div>
                <dt>{esContado ? 'Sale de' : 'Tarjeta'}</dt>
                <dd>{esContado ? (cuenta?.nombre ?? 'Sin cuenta') : elegido.tarjeta_nombre}</dd>
              </div>
              <div>
                <dt>{esContado ? 'Pagas hoy' : 'Cada mes'}</dt>
                <dd>{pesos(esContado ? data.precio : (elegido.mensualidad ?? 0))}</dd>
              </div>
            </dl>
            <p>{texto.efecto}</p>
            {score && <p>{score}</p>}
            {motivo && <FormAlert tipo="precaucion">No te lo recomendamos: {motivo}</FormAlert>}
            {error && <FormAlert tipo="critico">{error}</FormAlert>}
          </>
        )}
      </ConfirmDialog>
    </>
  )
}

export default RegistroDeCompra
