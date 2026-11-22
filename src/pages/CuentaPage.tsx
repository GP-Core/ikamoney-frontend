import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router'
import Button from '../components/Button'
import ConfirmDialog from '../components/ConfirmDialog'
import EncabezadoPagina from '../components/EncabezadoPagina'
import FormAlert from '../components/FormAlert'
import Icon from '../components/Icon'
import NotaSinConexion from '../components/NotaSinConexion'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useConexion } from '../hooks/useConexion'
import { mensajeErrorAuth } from '../utils/authErrors'
import './Finanzas.css'
import './Cuenta.css'

/** Lo que borra DELETE /api/v1/cuenta. Debe coincidir con el aviso de privacidad (T55). */
const SE_PIERDE = [
  'Tu cuenta: nombre, correo y contraseña.',
  'Tus tarjetas y tus compras a meses sin intereses.',
  'Tus cuentas de débito, ahorro y efectivo, con sus movimientos.',
  'Tus deudas.',
  'Tus ingresos y gastos, y las categorías que creaste.',
  'Tus estados de cuenta y sus movimientos.',
  'Tu score y su historial.',
  'Tus avisos y la configuración de cuándo recibirlos.',
  'Los datos guardados en este dispositivo.',
]

/** Datos de la cuenta y eliminación de la cuenta con todos sus datos (T56). */
function CuentaPage() {
  const { usuario, eliminarCuenta } = useAuth()
  const enLinea = useConexion()
  const [contrasena, setContrasena] = useState('')
  const [errorContrasena, setErrorContrasena] = useState<string | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  function pedirConfirmacion(evento: FormEvent) {
    evento.preventDefault()
    setErrorGeneral(null)
    setErrorContrasena(contrasena ? null : 'Escribe tu contraseña para confirmar')
    if (contrasena) setConfirmando(true)
  }

  async function eliminar() {
    setEliminando(true)
    try {
      // Si sale bien, la sesión se cierra y RutaProtegida lleva al inicio de sesión.
      await eliminarCuenta(contrasena)
    } catch (error) {
      setErrorGeneral(mensajeErrorAuth(error, 'eliminar'))
      setContrasena('')
      setConfirmando(false)
      setEliminando(false)
    }
  }

  return (
    <div className="pagina">
      <EncabezadoPagina titulo="Mi cuenta" />

      <section className="ficha" aria-labelledby="datos-titulo">
        <h2 id="datos-titulo">Tus datos</h2>
        <dl className="datos">
          <div className="datos__fila">
            <dt>Nombre</dt>
            <dd>{usuario?.nombre}</dd>
          </div>
          <div className="datos__fila">
            <dt>Correo</dt>
            <dd className="cuenta__correo">{usuario?.correo}</dd>
          </div>
        </dl>
      </section>

      <section className="ficha" aria-labelledby="avisos-titulo">
        <h2 id="avisos-titulo">Avisos</h2>
        <p>Elige a partir de qué uso de tus tarjetas, con cuántos días de anticipación y por qué canales quieres que te avisemos.</p>
        <Link to="/alertas/configuracion" className="pagina__enlace">
          Elegir cuándo avisarme
        </Link>
      </section>

      <section className="ficha cuenta__peligro" aria-labelledby="eliminar-titulo">
        <h2 id="eliminar-titulo">Eliminar mi cuenta</h2>
        <p>Si eliminas tu cuenta, se borra para siempre todo lo que registraste en IkaMoney:</p>
        <ul className="cuenta__lista">
          {SE_PIERDE.map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
        <FormAlert tipo="precaucion">
          Esta acción no se puede deshacer. No podremos recuperar tu cuenta ni tus datos.
        </FormAlert>

        {errorGeneral && <FormAlert tipo="critico">{errorGeneral}</FormAlert>}

        <form className="formulario" onSubmit={pedirConfirmacion} noValidate>
          <TextField
            etiqueta="Contraseña actual"
            type="password"
            autoComplete="current-password"
            ayuda="Te la pedimos para confirmar que eres tú. Necesitas conexión a internet."
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            error={errorContrasena}
          />
          <div className="formulario__acciones">
            <Button
              type="submit"
              variante="destructivo"
              disabled={!enLinea}
              title={enLinea ? undefined : 'Sin conexión'}
            >
              <Icon nombre="basura" tamano={20} />
              Eliminar mi cuenta
            </Button>
          </div>
          <NotaSinConexion />
        </form>
      </section>

      <ConfirmDialog
        abierto={confirmando}
        titulo="¿Eliminar tu cuenta para siempre?"
        textoConfirmar="Sí, eliminar todo"
        procesando={eliminando}
        onConfirmar={eliminar}
        onCancelar={() => setConfirmando(false)}
      >
        <p>
          Se borrará la cuenta de <strong>{usuario?.correo}</strong> con todas sus tarjetas, compras a MSI, cuentas,
          deudas, ingresos, gastos, estados de cuenta, avisos y su score.
        </p>
        <p>Esta acción no se puede deshacer.</p>
      </ConfirmDialog>
    </div>
  )
}

export default CuentaPage
