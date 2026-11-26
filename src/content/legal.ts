// Texto del aviso de privacidad y de los términos de uso (T55, RNF-20 y RNF-21).
//
// Texto redactado por el equipo (IKASOFT). Ya no quedan campos [ENTRE CORCHETES]. Las cláusulas 6 y 7 de los
// términos (responsabilidad y jurisdicción) son una propuesta y siguen pendientes de revisión con asesoría legal
// antes de publicar.

/** Un bloque de texto: párrafo, lista con viñetas o lista numerada. */
export type Bloque = { p: string } | { ul: string[] } | { ol: string[] }

export interface SeccionLegal {
  /** Sin título, la sección es una introducción. */
  titulo?: string
  bloques: Bloque[]
}

export interface DocumentoLegal {
  titulo: string
  /** AAAA-MM-DD. Se cambia cada vez que se cambia el texto. */
  actualizado: string
  secciones: SeccionLegal[]
}

export type ClaveDocumentoLegal = 'privacidad' | 'terminos'

export const RUTAS_LEGALES: Record<ClaveDocumentoLegal, string> = {
  privacidad: '/aviso-de-privacidad',
  terminos: '/terminos-de-uso',
}

export const CONTACTO = 'ikasoft_empresa@gmail.com'
const PROVEEDOR_IA = 'Google (API de Gemini)'

export const DOCUMENTOS_LEGALES: Record<ClaveDocumentoLegal, DocumentoLegal> = {
  privacidad: {
    titulo: 'Aviso de privacidad',
    actualizado: '2026-11-26',
    secciones: [
      {
        titulo: 'Nuestra promesa',
        bloques: [
          {
            p: 'IKAMONEY nunca te pide el usuario, la contraseña ni las claves de tu banco. No nos conectamos a tus cuentas bancarias. Tú decides qué datos nos das: los capturas a mano o subes tu estado de cuenta en PDF.',
          },
          {
            p: 'Este aviso te explica, sin letra chica, qué datos guardamos, quién más interviene, cómo los protegemos y cómo puedes borrarlos.',
          },
        ],
      },
      {
        titulo: '1. Quién es responsable de tus datos',
        bloques: [{ p: `IKASOFT es responsable de tus datos. Puedes escribirnos a ${CONTACTO}.` }],
      },
      {
        titulo: '2. Qué datos recabamos',
        bloques: [
          { p: 'Para tu cuenta: tu nombre, tu correo y tu contraseña.' },
          { p: 'Lo que tú registras:' },
          {
            ul: [
              'Ingresos: monto, fecha, descripción y si se repiten.',
              'Gastos fijos y variables: monto, fecha o día de pago, descripción y categoría.',
              'Cuentas de dinero (débito, ahorro, efectivo, monedero u otra): nombre, tipo, saldo y movimientos; y, si quieres, el banco y los últimos 4 dígitos.',
              'Tarjetas de crédito: nombre, banco, saldo, límite, tasa de interés, fecha de corte y fecha límite de pago; y, si quieres, los últimos 4 dígitos.',
              'Pagos a tarjetas y deudas: monto, fecha y de qué cuenta salieron.',
              'Deudas que no son de tarjeta: saldo, tasa y pago mensual.',
              'Planes a meses sin intereses (MSI): monto total, número de meses y mes de inicio.',
            ],
          },
          {
            p: 'Lo que sacamos de tu estado de cuenta, si decides subirlo: los datos de la tarjeta (saldo, límite, tasa, fecha de corte y fecha límite de pago), los movimientos del periodo (fecha, descripción y monto) y los planes MSI vigentes.',
          },
          { p: 'Además, guardamos cuántas lecturas con inteligencia artificial has usado.' },
          {
            p: 'Lo que calculamos con lo anterior: tu balance, tu proyección de los próximos meses, tu Índice de Salud Financiera, el orden de tus deudas, tus alertas y los límites de alerta que tú configures.',
          },
        ],
      },
      {
        titulo: '3. Lo que no recabamos',
        bloques: [
          {
            ul: [
              'Nunca pedimos usuario, contraseña ni claves de tu banco.',
              'No te pedimos el número completo de tu tarjeta ni su código de seguridad.',
              'Tu nombre, número de tarjeta, CLABE, RFC y CURP, que vienen en el estado de cuenta, se quitan antes de enviar el texto a la inteligencia artificial (ver sección 5) y no forman parte de lo que guardamos.',
            ],
          },
        ],
      },
      {
        titulo: '4. Qué pasa con tu estado de cuenta en PDF',
        bloques: [
          {
            ol: [
              'Subes el PDF.',
              'Lo leemos en nuestro servidor solo el tiempo que hace falta.',
              'Le quitamos tus datos de identificación.',
              'Enviamos el texto resultante al proveedor de inteligencia artificial.',
              'Borramos el archivo en cuanto termina la lectura, o en cuanto falla. Si cierras la aplicación a la mitad, se borra al pasar el tiempo máximo de procesamiento.',
              'Ves lo que se leyó en una pantalla de revisión. Puedes corregirlo todo, y solo se guarda lo que confirmes. Si sales sin confirmar, no se guarda nada.',
            ],
          },
          { p: 'No guardamos tu PDF.' },
        ],
      },
      {
        titulo: '5. Un tercero participa: el proveedor de inteligencia artificial',
        bloques: [
          {
            p: `Para leer tu estado de cuenta usamos un servicio de inteligencia artificial de ${PROVEEDOR_IA}. Es una empresa distinta a IKAMONEY, y tienes derecho a saberlo.`,
          },
          {
            p: 'Qué le enviamos: solo el texto del estado de cuenta, no el archivo PDF. Antes de enviarlo le quitamos tu nombre, número de tarjeta, CLABE, RFC y CURP.',
          },
          {
            p: 'Qué sí va en ese texto: saldos, fechas, tasas, movimientos (con sus descripciones y montos) y planes MSI, porque es justo lo que hay que leer.',
          },
          {
            p: 'Qué hace el proveedor con él: leerlo y devolvernos los datos. Usamos la versión de pago de su servicio, en la que Google no usa lo que le enviamos para entrenar ni mejorar sus productos. Google guarda un registro por un tiempo limitado, solo para detectar abusos de su servicio, y puede procesarlo en servidores fuera de México.',
          },
          {
            p: 'Qué no hace la inteligencia artificial: tu score, tu proyección y el orden de tus deudas se calculan con reglas fijas y visibles, no con IA.',
          },
          {
            p: 'Si prefieres que ningún tercero procese tu estado de cuenta, no lo subas. Puedes capturar todos tus datos a mano y la aplicación funciona igual.',
          },
        ],
      },
      {
        titulo: '6. Cómo protegemos tu información',
        bloques: [
          {
            ul: [
              'Toda la aplicación usa conexión segura (HTTPS).',
              'Tu contraseña no se guarda tal cual: se guarda transformada con un método de un solo sentido (hash), de modo que nadie del equipo puede leerla.',
              'Tus saldos, límites y movimientos se guardan cifrados.',
              'Cada persona ve únicamente su propia información.',
              'Si ocurre un incidente de seguridad que te afecte, te lo avisaremos por correo.',
            ],
          },
        ],
      },
      {
        titulo: '7. Datos que se guardan en tu dispositivo',
        bloques: [
          {
            p: 'Para que puedas consultar tus últimos datos sin internet (balance, ingresos y gastos, categorías, cuentas, tarjetas, deudas, score y avisos), la aplicación guarda una copia en tu celular o computadora. Sin conexión solo puedes verlos, no modificarlos.',
          },
          {
            ul: [
              'Al cerrar sesión, esa copia se borra de tu dispositivo.',
              'Al eliminar tu cuenta, también se borra.',
              'Si limpias los datos del navegador, se borra.',
            ],
          },
        ],
      },
      {
        titulo: '8. Notificaciones y correos',
        bloques: [
          {
            ul: [
              'Las alertas siempre aparecen dentro de la aplicación.',
              'Por correo las recibes solo si lo activas.',
              'Como notificación en tu celular solo si lo activas y das permiso en tu dispositivo. Puedes retirarlo cuando quieras.',
              'Las alertas dicen qué pasó, por ejemplo el mes en que te faltaría dinero o el nombre de la tarjeta que está muy usada. No incluyen saldos ni montos.',
              'Además, te escribimos al correo para recuperar tu contraseña cuando lo pidas.',
            ],
          },
        ],
      },
      {
        titulo: '9. Tus derechos y cómo eliminar tu cuenta',
        bloques: [
          {
            p: `Puedes ver, corregir, eliminar tus datos y oponerte a que los usemos. Casi todo lo haces tú mismo desde la aplicación: editas o borras cualquier ingreso, gasto, cuenta, tarjeta, deuda o plan MSI. Para cualquier otra solicitud, escríbenos a ${CONTACTO} y responderemos lo más pronto posible.`,
          },
          {
            p: 'Eliminar tu cuenta: entra a tu perfil y elige “Eliminar cuenta”. Te pediremos confirmar, porque no se puede deshacer. Al confirmar:',
          },
          {
            ul: [
              'Se borran tus datos del servidor, no solo se ocultan.',
              'Se borran los datos guardados en tu dispositivo.',
              'Se cierra tu sesión, y ese correo ya no tendrá cuenta.',
              'En tus otros dispositivos la sesión deja de funcionar, y la copia guardada ahí se borra la próxima vez que abras la aplicación con internet.',
            ],
          },
          {
            p: 'Copias de seguridad: hacemos copias de seguridad diarias para proteger la información de todos. Lo que borres puede permanecer en esas copias y después desaparece. Esas copias no se usan para restaurar tu cuenta eliminada.',
          },
        ],
      },
      {
        titulo: '10. Cambios a este aviso',
        bloques: [
          {
            p: 'Si cambiamos este aviso te lo mostraremos en la aplicación (y, si el cambio es importante, te pediremos aceptarlo de nuevo). Puedes consultarlo en cualquier momento desde la aplicación.',
          },
        ],
      },
    ],
  },
  terminos: {
    titulo: 'Términos de uso',
    actualizado: '2026-11-26',
    secciones: [
      {
        titulo: '1. Qué es IKAMONEY',
        bloques: [
          {
            p: 'IKAMONEY es una aplicación web que te ayuda a ver cómo quedaría tu dinero en los próximos meses antes de hacer una compra, sobre todo si pagas con tarjeta o a meses sin intereses. Para eso calcula tu balance, simula compras, ordena tus deudas y te da una calificación de 0 a 100.',
          },
        ],
      },
      {
        titulo: '2. IKAMONEY no es asesoría financiera',
        bloques: [
          {
            p: 'IKAMONEY no es un asesor financiero, ni un asesor de inversiones, ni una institución financiera. Te damos cálculos, proyecciones y orientación general con base en los datos que tú registras. No te damos recomendaciones personalizadas de un asesor certificado.',
          },
          {
            p: 'El veredicto de una simulación, el orden de tus deudas, tu score y las sugerencias son herramientas para que decidas mejor, no una garantía ni una instrucción. La decisión de comprar, pagar o ahorrar es tuya. Si tu situación es compleja o tienes dudas importantes, consulta a un profesional.',
          },
        ],
      },
      {
        titulo: '3. Tus resultados dependen de tus datos',
        bloques: [
          {
            p: 'Los cálculos son tan buenos como los datos que registras o confirmas. Si un dato está mal, vacío o desactualizado, el resultado también lo estará. Revisa siempre lo que se leyó de tu estado de cuenta antes de confirmar. Las proyecciones son estimaciones: tu situación real puede cambiar.',
          },
        ],
      },
      {
        titulo: '4. Tu cuenta',
        bloques: [
          {
            ul: [
              'Eres responsable de mantener tu contraseña en secreto.',
              'Debes darnos información que sea tuya o que tengas derecho a usar.',
              'Para crear tu cuenta debes aceptar el aviso de privacidad. Si no lo aceptas, no podemos crearla.',
            ],
          },
        ],
      },
      {
        titulo: '5. Uso adecuado',
        bloques: [
          {
            p: 'Usa IKAMONEY solo para tus propias finanzas. No intentes entrar a la información de otras personas, afectar el funcionamiento del servicio ni usarlo para actividades ilegales.',
          },
        ],
      },
      {
        titulo: '6. Disponibilidad y responsabilidad',
        bloques: [
          {
            // Propuesta pendiente de revisión con asesoría legal antes de publicar. La versión anterior excluía toda
            // responsabilidad, y en un contrato de adhesión eso choca con la Ley Federal de Protección al Consumidor.
            p: 'Hacemos lo posible para que IKAMONEY funcione bien y sus cálculos sean correctos, pero puede tener fallas o interrupciones. Los resultados son estimaciones con base en los datos que registras, y las decisiones que tomes con ellos son tuyas. Esto no limita los derechos que te da la ley como consumidor.',
          },
        ],
      },
      {
        titulo: '7. Cambios y contacto',
        bloques: [
          {
            // Propuesta pendiente de revisión con asesoría legal.
            p: `Podemos actualizar estos términos; te avisaremos en la aplicación. Si tienes dudas, escríbenos a ${CONTACTO}. Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia son competentes los tribunales de Torreón, Coahuila, sin perjuicio de que acudas a la Profeco.`,
          },
        ],
      },
    ],
  },
}

/** Ancla de una sección: "2. Qué datos recabamos" → "2-que-datos-recabamos". */
export function ancla(titulo: string): string {
  return titulo
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
