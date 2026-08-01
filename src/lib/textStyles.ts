/**
 * Estilos de texto Unicode (Mathematical Alphanumeric Symbols y afines).
 * Transforman caracteres ASCII en sus equivalentes Unicode estilizados,
 * que se ven como "formato" al pegarlos en Instagram, X, TikTok, WhatsApp, etc.
 */

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'

function rangeMap(chars: string, start: number): Record<string, string> {
  const m: Record<string, string> = {}
  for (let i = 0; i < chars.length; i++) m[chars[i]] = String.fromCodePoint(start + i)
  return m
}

/** Crea un transformador que mapea letras/dígitos a un rango Unicode dado */
function styled(
  upper?: number,
  lower?: number,
  digits?: number,
  extra: Record<string, string> = {}
) {
  const map: Record<string, string> = { ...extra }
  if (upper !== undefined) Object.assign(map, rangeMap(UPPER, upper))
  if (lower !== undefined) Object.assign(map, rangeMap(LOWER, lower))
  if (digits !== undefined) Object.assign(map, rangeMap(DIGITS, digits))
  return (text: string) => text.replace(/[A-Za-z0-9]/g, (c) => map[c] ?? c)
}

/** Small caps: solo las minúsculas tienen equivalentes; las mayúsculas quedan igual */
const SMALLCAPS_SRC = 'abcdefghijklmnopqrstuvwxyz'
const SMALLCAPS_DST = [
  '\u1D00', '\u0299', '\u1D04', '\u1D05', '\u1D07', '\uA730', '\u0262',
  '\u029C', '\u026A', '\u1D0A', '\u1D0B', '\u029F', '\u1D0D', '\u0274',
  '\u1D0F', '\u1D18', '\u01EB', '\u0280', '\uA731', '\u1D1B', '\u1D1C',
  '\u1D20', '\u1D21', 'x', '\u028F', '\u1D22',
]
const SMALLCAPS_MAP: Record<string, string> = {}
for (let i = 0; i < SMALLCAPS_SRC.length; i++) SMALLCAPS_MAP[SMALLCAPS_SRC[i]] = SMALLCAPS_DST[i]

/** Agrega una marca combinante (tachado, subrayado) después de cada carácter visible */
const combine = (mark: string) => (text: string) =>
  text
    .split('')
    .map((c) => (c.trim() ? c + mark : c))
    .join('')

/** Letras en círculo */
const CIRCLED_EXTRA: Record<string, string> = { '0': '\u24EA' }
for (let i = 1; i <= 9; i++) CIRCLED_EXTRA[String(i)] = String.fromCodePoint(0x2460 + i - 1)

export type TextStyle = {
  id: string
  label: string
  hint: string
  apply: (t: string) => string
}

export const TEXT_STYLES: TextStyle[] = [
  {
    id: 'bold',
    label: 'Negrita',
    hint: 'El clásico para titulares',
    apply: styled(0x1d5d4, 0x1d5ee, 0x1d7ec),
  },
  {
    id: 'italic',
    label: 'Cursiva',
    hint: 'Elegante y fluida',
    apply: styled(0x1d608, 0x1d622),
  },
  {
    id: 'bold-italic',
    label: 'Negrita cursiva',
    hint: 'Doble énfasis',
    apply: styled(0x1d63c, 0x1d656),
  },
  {
    id: 'serif-bold',
    label: 'Serif negrita',
    hint: 'Aire editorial',
    apply: styled(0x1d400, 0x1d41a, 0x1d7ce),
  },
  {
    id: 'serif-italic',
    label: 'Serif cursiva',
    hint: 'Sutil y clásica',
    apply: styled(0x1d434, 0x1d44e, undefined, { h: '\u210E' }),
  },
  {
    id: 'serif-bold-italic',
    label: 'Serif negrita cursiva',
    hint: 'Máximo carácter',
    apply: styled(0x1d468, 0x1d482),
  },
  {
    id: 'script',
    label: 'Manuscrita',
    hint: 'Caligrafía delicada',
    apply: styled(0x1d4d0, 0x1d4ea),
  },
  {
    id: 'script-bold',
    label: 'Manuscrita negrita',
    hint: 'Firma con presencia',
    apply: styled(0x1d504, 0x1d51e),
  },
  {
    id: 'fraktur',
    label: 'Gótica',
    hint: 'Estilo antiguo',
    apply: styled(0x1d51c, 0x1d536),
  },
  {
    id: 'mono',
    label: 'Monoespaciada',
    hint: 'Tipo máquina de escribir',
    apply: styled(0x1d670, 0x1d68a, 0x1d7f6),
  },
  {
    id: 'double',
    label: 'Doble trazo',
    hint: 'Geométrica y moderna',
    apply: styled(0x1d538, 0x1d552, 0x1d7d8, {
      C: '\u2102',
      H: '\u210D',
      N: '\u2115',
      P: '\u2119',
      Q: '\u211A',
      R: '\u211D',
      Z: '\u2124',
    }),
  },
  {
    id: 'wide',
    label: 'Ancha',
    hint: 'Ocupa todo el espacio',
    apply: styled(0xff21, 0xff41, 0xff10),
  },
  {
    id: 'smallcaps',
    label: 'Versalitas',
    hint: 'Mayúsculas en miniatura',
    apply: (t) => t.replace(/[a-z]/g, (c) => SMALLCAPS_MAP[c] ?? c),
  },
  {
    id: 'circled',
    label: 'Burbujas',
    hint: 'Letras en círculo',
    apply: styled(0x24b6, 0x24d0, undefined, CIRCLED_EXTRA),
  },
  {
    id: 'strike',
    label: 'Tachado',
    hint: 'Para correcciones con humor',
    apply: combine('\u0336'),
  },
  {
    id: 'underline',
    label: 'Subrayado',
    hint: 'Resalta sin gritar',
    apply: combine('\u0332'),
  },
]

export type EmojiGroup = {
  id: string
  label: string
  items: string[]
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: 'caritas',
    label: 'Caritas',
    items: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘',
      '😋', '😜', '🤪', '🤑', '🤗', '🤔', '🤨', '😐',
      '😴', '🥳', '😎', '🤓', '🧐', '😢', '😭', '😤',
      '😱', '🥺', '🙄', '😬', '🤯', '😈', '👻', '🤖',
    ],
  },
  {
    id: 'gestos',
    label: 'Gestos',
    items: [
      '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '👏',
      '🙌', '🙏', '💪', '🤝', '✍️', '👋', '🖐️', '✋',
      '🤙', '💅', '🫶', '🫰', '🤌', '👆', '👇', '👉',
      '👈', '☝️', '✊', '🫵',
    ],
  },
  {
    id: 'corazones',
    label: 'Corazones',
    items: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '♥️', '✨', '💫', '⭐', '🌟',
    ],
  },
  {
    id: 'negocios',
    label: 'Negocios',
    items: [
      '💼', '📊', '📈', '📉', '💰', '💵', '💳', '🏦',
      '📅', '🗓️', '⏰', '⏳', '📌', '📍', '📎', '✂️',
      '🖊️', '✒️', '📝', '✅', '🎯', '🚀', '💡', '🔑',
      '🏆', '🥇', '📣', '🔍', '🤓', '💸', '🧾', '📦',
    ],
  },
  {
    id: 'objetos',
    label: 'Objetos',
    items: [
      '📱', '💻', '🖥️', '⌨️', '🖱️', '📷', '🎥', '🎬',
      '🎧', '🎤', '🎨', '✏️', '📚', '📖', '🔗', '🛒',
      '🎁', '🏷️', '☕', '🍕', '🎉', '🎊', '🥂', '🍾',
      '🔥', '⚡', '🌈', '☀️', '🌙', '❄️', '💧', '🌊',
    ],
  },
  {
    id: 'naturaleza',
    label: 'Naturaleza',
    items: [
      '🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🌿', '🌵',
      '🌴', '🍁', '🍂', '🦋', '🐝', '🐞', '🌎', '🌍',
      '🌏', '✈️', '🚗', '🏖️', '⛰️', '🌋', '🐶', '🐱',
      '🦁', '🐢', '🦄', '🐥',
    ],
  },
]

/** Cuenta caracteres de forma segura con emojis (por code point, no por unidad UTF-16) */
export function charCount(text: string): number {
  return Array.from(text).length
}
