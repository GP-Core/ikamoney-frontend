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

export const GLOSARIO: Record<Termino, { titulo: string; texto: string }> = {
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
