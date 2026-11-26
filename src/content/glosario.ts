// Explicaciones cortas de los términos financieros de tarjetas, deudas y MSI (RNF-01).

export type Termino =
  | 'msi'
  | 'tasaAnual'
  | 'fechaCorte'
  | 'fechaLimitePago'
  | 'pagoMinimo'
  | 'pagoNoIntereses'
  | 'usoLimite'
  | 'creditoDisponible'
  | 'sobranteMes'
  | 'dineroAlCierre'
  | 'avalancha'
  | 'abonoExtra'
  | 'bolaDeNieve'
  | 'score'
  | 'relacionDeudaIngreso'
  | 'flujoLibre'
  | 'cargaMsi'
  | 'comportamientoPago'
  | 'dineroHoy'
  | 'lecturaGratis'

export const GLOSARIO: Record<Termino, { titulo: string; texto: string }> = {
  lecturaGratis: {
    titulo: 'Lectura gratis',
    texto:
      'Cada vez que la IA lee tu PDF y te muestra los datos usas una lectura. Tienes un número fijo en total; no se renuevan cada mes. Si la lectura falla, no se descuenta.',
  },
  sobranteMes: {
    titulo: 'Lo que te sobra en el mes',
    texto: 'Lo que entra en el mes menos lo que sale. Si es negativo, ese mes gastas más de lo que recibes.',
  },
  dineroAlCierre: {
    titulo: 'Tu dinero al cierre',
    texto:
      'Lo que hoy tienes en tus cuentas de débito, ahorro, efectivo y monedero, más lo que falta por entrar y salir hasta ese mes. Lo que ya pagaste o cobraste no se cuenta otra vez. No incluye tarjetas de crédito.',
  },
  dineroHoy: {
    titulo: 'Tu dinero hoy',
    texto:
      'Lo que hay en tus cuentas de débito, ahorro, efectivo y monedero. Es con lo que arrancan tu Balance y el simulador. No incluye tarjetas.',
  },
  score: {
    titulo: 'Qué es tu score',
    texto:
      'Una calificación de 0 a 100 de tu salud financiera. Mide si tu ingreso alcanza para tus pagos, cuánto usas de tus tarjetas, cuánto te queda libre y cómo pagas. No es el score del Buró de Crédito.',
  },
  relacionDeudaIngreso: {
    titulo: 'Relación deuda-ingreso',
    texto:
      'Qué parte de tu ingreso del mes se va en pagar deudas: mínimos de tarjetas, mensualidades de MSI y otras cuotas. Lo ideal es que no pase del 30 %.',
  },
  flujoLibre: {
    titulo: 'Flujo libre',
    texto: 'Lo que te queda del ingreso del mes después de tus gastos y pagos. Ahorrar 20 % o más da todos los puntos.',
  },
  cargaMsi: {
    titulo: 'Carga de MSI',
    texto:
      'Qué parte de tu ingreso se va en mensualidades a meses sin intereses. Aunque no cobran intereses, conviene que no pasen del 10 %.',
  },
  comportamientoPago: {
    titulo: 'Comportamiento de pago',
    texto: 'Cómo pagas tus tarjetas: el total, más del mínimo, solo el mínimo o con atraso. Pagar el total da todos los puntos.',
  },
  avalancha: {
    titulo: 'Método avalancha',
    texto:
      'Pagas el mínimo de todas tus deudas y todo tu dinero extra va a la de tasa más alta. Cuando la liquidas, ese pago pasa a la siguiente. Así pagas menos intereses en total.',
  },
  abonoExtra: {
    titulo: 'Abono extra',
    texto:
      'Lo que pagas además del mínimo. Va directo a bajar el saldo, así que la deuda se acaba antes y genera menos intereses.',
  },
  bolaDeNieve: {
    titulo: 'Método bola de nieve',
    texto:
      'Empezar por la deuda más chica. Motiva ver pronto una deuda liquidada, pero normalmente se pagan más intereses.',
  },
  msi: {
    titulo: 'Meses sin intereses (MSI)',
    texto:
      'Compra que pagas en mensualidades iguales sin que el banco te cobre intereses. Lo que falta por pagar se descuenta de tu crédito disponible.',
  },
  tasaAnual: {
    titulo: 'Tasa anual',
    texto:
      'Porcentaje que te cobran en un año por deber dinero. Si no pagas el total de tu tarjeta, los intereses se calculan con esta tasa y llevan IVA.',
  },
  fechaCorte: {
    titulo: 'Fecha de corte',
    texto: 'Día del mes en que el banco cierra tu estado de cuenta. Las compras posteriores entran en el siguiente.',
  },
  fechaLimitePago: {
    titulo: 'Fecha límite de pago',
    texto: 'Último día para pagar sin que te cobren intereses ni cargos por pago tardío.',
  },
  pagoMinimo: {
    titulo: 'Pago mínimo',
    texto:
      'Lo menos que puedes pagar para que la tarjeta no se considere atrasada. Si solo pagas esto, el resto genera intereses.',
  },
  pagoNoIntereses: {
    titulo: 'Pago para no generar intereses',
    texto: 'Cantidad que cubre tu saldo del periodo y las mensualidades de MSI del mes. Pagándola completa no te cobran intereses.',
  },
  usoLimite: {
    titulo: 'Uso del límite',
    texto: 'Qué parte de tu límite de crédito estás usando. Mantenerlo por debajo del 30 % cuida tu salud financiera.',
  },
  creditoDisponible: {
    titulo: 'Crédito disponible',
    texto: 'Lo que aún puedes gastar con la tarjeta: tu límite menos el saldo y lo que falta pagar de tus compras a MSI.',
  },
}
