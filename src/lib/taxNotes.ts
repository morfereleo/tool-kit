export type TaxNote = {
  title: string
  add: string[]
  extract: string[]
  source: string
}

const GENERIC_ADD = (taxName: string, rate: number, country: string) => [
  `En ${country} el ${taxName} es un impuesto al consumo: quien vende un bien o presta un servicio actúa como recaudador y lo cobra al cliente en la factura.`,
  `Al agregarlo al monto neto, estás trasladando el ${rate}% al consumidor final — ese dinero no es tuyo, lo declaras y lo pagas al fisco en tu próxima liquidación.`,
  'No cobrar el impuesto cuando eres responsable te obliga a pagarlo de tu propio bolsillo, más posibles multas e intereses.',
]

const GENERIC_EXTRACT = (taxName: string, rate: number, country: string) => [
  `Extraer sirve cuando tienes un precio con ${taxName} incluido y necesitas saber cuánto es la base y cuánto el impuesto.`,
  `La fórmula correcta no es restar el ${rate}%: la base se obtiene dividiendo el total entre 1,${String(rate).padStart(2, '0')}. Restar el porcentaje directamente siempre te deja una base más alta de la real.`,
  `En ${country} necesitas este desglose para llevar tu libro de ventas y conciliar el impuesto que debes declarar.`,
]

export function getTaxNote(code: string, name: string, taxName: string, rate: number): TaxNote {
  if (code === 'VE') {
    return {
      title: `El IVA en Venezuela — ${rate}%`,
      add: [
        'La Ley de IVA establece que todo vendedor de bienes muebles y prestador de servicios en el país es sujeto pasivo del impuesto y responsable de su recaudación (Arts. 1° y 4°).',
        'Al emitir tu factura debes agregar el 16% sobre el precio neto: ese monto es tu débito fiscal, dinero que le pertenece al Fisco Nacional y que declaras ante el SENIAT en el período fiscal correspondiente (Art. 29).',
        'Si no lo cobras en factura, igual lo debes: saldrá de tu ganancia, junto con multas e intereses moratorios del Código Orgánico Tributario.',
        'Recuerda que puedes deducir los créditos fiscales del IVA que pagaste en tus compras y gastos relacionados con tu actividad (Art. 33).',
      ],
      extract: [
        'Si tu cliente te pagó un monto con IVA incluido, la base imponible no es el total menos el 16%: es el total dividido entre 1,16. Esta es la forma correcta según la Ley de IVA.',
        'La diferencia entre el total y la base es tu débito fiscal: el impuesto que recaudaste y debes declarar al SENIAT (Art. 29).',
        'Este desglose es obligatorio en tu libro de ventas y en los comprobantes que emites — la factura debe discriminar siempre el monto del impuesto (Art. 24, Reglamento de la Ley de IVA).',
        'Algunas operaciones están exoneradas (ciertos alimentos, medicinas, educación): en esos casos no se cobra ni se discrimina IVA.',
      ],
      source: 'Ley del Impuesto al Valor Agregado (G.O. N° 6.507 Ext.) y su Reglamento — Venezuela',
    }
  }
  return {
    title: `${taxName} en ${name} — ${rate}%`,
    add: GENERIC_ADD(taxName, rate, name),
    extract: GENERIC_EXTRACT(taxName, rate, name),
    source: `Legislación fiscal de ${name} — consulta la normativa local vigente`,
  }
}
