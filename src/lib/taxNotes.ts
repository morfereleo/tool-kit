import type { Lang } from './i18n'

export type TaxNote = {
  title: string
  add: string[]
  extract: string[]
  source: string
}

const pad = (rate: number) => String(rate).padStart(2, '0')

const GENERIC_ADD = (taxName: string, rate: number, country: string, lang: Lang) =>
  lang === 'es'
    ? [
        `En ${country} el ${taxName} es un impuesto al consumo: quien vende un bien o presta un servicio actúa como recaudador y lo cobra al cliente en la factura.`,
        `Al agregarlo al monto neto, estás trasladando el ${rate}% al consumidor final — ese dinero no es tuyo, lo declaras y lo pagas al fisco en tu próxima liquidación.`,
        'No cobrar el impuesto cuando eres responsable te obliga a pagarlo de tu propio bolsillo, más posibles multas e intereses.',
      ]
    : [
        `In ${country}, ${taxName} is a consumption tax: anyone selling goods or providing services acts as a collector and charges it to the customer on the invoice.`,
        `By adding it to the net amount you're passing the ${rate}% on to the final consumer — that money isn't yours; you declare it and pay it to the tax authority on your next filing.`,
        `Failing to charge the tax when you're responsible means paying it out of your own pocket, plus possible fines and interest.`,
      ]

const GENERIC_EXTRACT = (taxName: string, rate: number, country: string, lang: Lang) =>
  lang === 'es'
    ? [
        `Extraer sirve cuando tienes un precio con ${taxName} incluido y necesitas saber cuánto es la base y cuánto el impuesto.`,
        `La fórmula correcta no es restar el ${rate}%: la base se obtiene dividiendo el total entre 1,${pad(rate)}. Restar el porcentaje directamente siempre te deja una base más alta de la real.`,
        `En ${country} necesitas este desglose para llevar tu libro de ventas y conciliar el impuesto que debes declarar.`,
      ]
    : [
        `Extracting is useful when you have a price with ${taxName} included and need to know how much is the base and how much is the tax.`,
        `The correct formula isn't subtracting ${rate}%: the base is obtained by dividing the total by 1.${pad(rate)}. Subtracting the percentage directly always leaves you with a base higher than the real one.`,
        `In ${country} you need this breakdown to keep your sales ledger and reconcile the tax you must declare.`,
      ]

export function getTaxNote(code: string, name: string, taxName: string, rate: number, lang: Lang): TaxNote {
  if (code === 'VE') {
    if (lang === 'es') {
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
      title: `VAT in Venezuela — ${rate}%`,
      add: [
        'The VAT Law establishes that every seller of movable goods and service provider in the country is a taxpayer and responsible for collecting the tax (Arts. 1 and 4).',
        'When issuing your invoice you must add 16% on top of the net price: that amount is your fiscal debit, money that belongs to the National Treasury and that you declare to SENIAT in the corresponding tax period (Art. 29).',
        'If you don’t charge it on the invoice, you still owe it: it will come out of your profit, along with fines and late-payment interest from the Organic Tax Code.',
        'Remember you can deduct the fiscal credits from the VAT you paid on purchases and expenses related to your activity (Art. 33).',
      ],
      extract: [
        'If your client paid you an amount with VAT included, the taxable base is not the total minus 16%: it is the total divided by 1.16. This is the correct method according to the VAT Law.',
        'The difference between the total and the base is your fiscal debit: the tax you collected and must declare to SENIAT (Art. 29).',
        'This breakdown is mandatory in your sales ledger and in the receipts you issue — the invoice must always itemize the tax amount (Art. 24, Regulations of the VAT Law).',
        'Some operations are exempt (certain foods, medicines, education): in those cases no VAT is charged or itemized.',
      ],
      source: 'Value Added Tax Law (Official Gazette No. 6,507 Ext.) and its Regulations — Venezuela',
    }
  }
  const title =
    lang === 'es' ? `${taxName} en ${name} — ${rate}%` : `${taxName} in ${name} — ${rate}%`
  return {
    title,
    add: GENERIC_ADD(taxName, rate, name, lang),
    extract: GENERIC_EXTRACT(taxName, rate, name, lang),
    source:
      lang === 'es'
        ? `Legislación fiscal de ${name} — consulta la normativa local vigente`
        : `${name} tax legislation — check the current local regulations`,
  }
}
