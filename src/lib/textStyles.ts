/**
 * Estilos de texto Unicode (Mathematical Alphanumeric Symbols y afines).
 * Transforman caracteres ASCII en sus equivalentes Unicode estilizados,
 * que se ven como "formato" al pegarlos en Instagram, X, TikTok, WhatsApp, etc.
 */

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'

/** Mapa inverso: carácter estilizado → ASCII base (para cambiar de un estilo a otro) */
const REVERSE: Record<string, string> = {}

function register(map: Record<string, string>) {
  for (const [k, v] of Object.entries(map)) {
    if (k !== v) REVERSE[v] = k
  }
}

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
  const map: Record<string, string> = {}
  if (upper !== undefined) Object.assign(map, rangeMap(UPPER, upper))
  if (lower !== undefined) Object.assign(map, rangeMap(LOWER, lower))
  if (digits !== undefined) Object.assign(map, rangeMap(DIGITS, digits))
  Object.assign(map, extra) // las excepciones pisan los huecos del rango
  register(map)
  return (text: string) => text.replace(/[A-Za-z0-9]/g, (c) => map[c] ?? c)
}

/** Small caps: solo las minúsculas tienen equivalentes; las mayúsculas quedan igual */
const SMALLCAPS_SRC = 'abcdefghijklmnopqrstuvwxyz'
const SMALLCAPS_DST = [
  'ᴀ', 'ʙ', 'ᴄ', 'ᴅ', 'ᴇ', 'ꜰ', 'ɢ',
  'ʜ', 'ɪ', 'ᴊ', 'ᴋ', 'ʟ', 'ᴍ', 'ɴ',
  'ᴏ', 'ᴘ', 'ǫ', 'ʀ', 'ꜱ', 'ᴛ', 'ᴜ',
  'ᴠ', 'ᴡ', 'x', 'ʏ', 'ᴢ',
]
const SMALLCAPS_MAP: Record<string, string> = {}
for (let i = 0; i < SMALLCAPS_SRC.length; i++) SMALLCAPS_MAP[SMALLCAPS_SRC[i]] = SMALLCAPS_DST[i]
register(SMALLCAPS_MAP)

/** Agrega una marca combinante (tachado, subrayado) después de cada carácter visible */
const combine = (mark: string) => (text: string) =>
  text
    .split('')
    .map((c) => (c.trim() ? c + mark : c))
    .join('')

/** Letras en círculo */
const CIRCLED_EXTRA: Record<string, string> = { '0': '⓪' }
for (let i = 1; i <= 9; i++) CIRCLED_EXTRA[String(i)] = String.fromCodePoint(0x2460 + i - 1)

/**
 * Excepciones del bloque Unicode: algunas letras manuscritas y góticas
 * no viven en el rango consecutivo sino como símbolos sueltos.
 */
const SCRIPT_EXTRA: Record<string, string> = {
  B: 'ℬ', E: 'ℰ', F: 'ℱ', H: 'ℋ', I: 'ℐ', L: 'ℒ', M: 'ℳ', R: 'ℛ',
  e: 'ℯ', g: 'ℊ', o: 'ℴ',
}
const FRAKTUR_EXTRA: Record<string, string> = { C: 'ℭ', H: 'ℌ', I: 'ℑ', R: 'ℜ', Z: 'ℨ' }

export type TextStyle = {
  id: string
  label: string
  labelEn: string
  hint: string
  hintEn: string
  apply: (t: string) => string
}

export const TEXT_STYLES: TextStyle[] = [
  {
    id: 'bold',
    label: 'Negrita',
    labelEn: 'Bold',
    hint: 'El clásico para titulares',
    hintEn: 'The classic for headlines',
    apply: styled(0x1d5d4, 0x1d5ee, 0x1d7ec),
  },
  {
    id: 'italic',
    label: 'Cursiva',
    labelEn: 'Italic',
    hint: 'Elegante y fluida',
    hintEn: 'Elegant and fluid',
    apply: styled(0x1d608, 0x1d622),
  },
  {
    id: 'bold-italic',
    label: 'Negrita cursiva',
    labelEn: 'Bold italic',
    hint: 'Doble énfasis',
    hintEn: 'Double emphasis',
    apply: styled(0x1d63c, 0x1d656),
  },
  {
    id: 'serif-bold',
    label: 'Serif negrita',
    labelEn: 'Serif bold',
    hint: 'Aire editorial',
    hintEn: 'Editorial feel',
    apply: styled(0x1d400, 0x1d41a, 0x1d7ce),
  },
  {
    id: 'serif-italic',
    label: 'Serif cursiva',
    labelEn: 'Serif italic',
    hint: 'Sutil y clásica',
    hintEn: 'Subtle and classic',
    apply: styled(0x1d434, 0x1d44e, undefined, { h: 'ℎ' }),
  },
  {
    id: 'serif-bold-italic',
    label: 'Serif negrita cursiva',
    labelEn: 'Serif bold italic',
    hint: 'Máximo carácter',
    hintEn: 'Maximum character',
    apply: styled(0x1d468, 0x1d482),
  },
  {
    id: 'script',
    label: 'Manuscrita',
    labelEn: 'Script',
    hint: 'Caligrafía delicada',
    hintEn: 'Delicate handwriting',
    apply: styled(0x1d49c, 0x1d4b6, undefined, SCRIPT_EXTRA),
  },
  {
    id: 'script-bold',
    label: 'Manuscrita negrita',
    labelEn: 'Bold script',
    hint: 'Firma con presencia',
    hintEn: 'A signature with presence',
    apply: styled(0x1d4d0, 0x1d4ea),
  },
  {
    id: 'fraktur',
    label: 'Gótica',
    labelEn: 'Fraktur',
    hint: 'Estilo antiguo',
    hintEn: 'Old-school style',
    apply: styled(0x1d504, 0x1d51c, undefined, FRAKTUR_EXTRA),
  },
  {
    id: 'mono',
    label: 'Monoespaciada',
    labelEn: 'Monospace',
    hint: 'Tipo máquina de escribir',
    hintEn: 'Typewriter look',
    apply: styled(0x1d670, 0x1d68a, 0x1d7f6),
  },
  {
    id: 'double',
    label: 'Doble trazo',
    labelEn: 'Double-struck',
    hint: 'Geométrica y moderna',
    hintEn: 'Geometric and modern',
    apply: styled(0x1d538, 0x1d552, 0x1d7d8, {
      C: 'ℂ',
      H: 'ℍ',
      N: 'ℕ',
      P: 'ℙ',
      Q: 'ℚ',
      R: 'ℝ',
      Z: 'ℤ',
    }),
  },
  {
    id: 'wide',
    label: 'Ancha',
    labelEn: 'Wide',
    hint: 'Ocupa todo el espacio',
    hintEn: 'Takes up the whole space',
    apply: styled(0xff21, 0xff41, 0xff10),
  },
  {
    id: 'smallcaps',
    label: 'Versalitas',
    labelEn: 'Small caps',
    hint: 'Mayúsculas en miniatura',
    hintEn: 'Miniature capitals',
    apply: (t) => t.replace(/[a-z]/g, (c) => SMALLCAPS_MAP[c] ?? c),
  },
  {
    id: 'circled',
    label: 'Burbujas',
    labelEn: 'Bubbles',
    hint: 'Letras en círculo',
    hintEn: 'Letters in circles',
    apply: styled(0x24b6, 0x24d0, undefined, CIRCLED_EXTRA),
  },
  {
    id: 'strike',
    label: 'Tachado',
    labelEn: 'Strikethrough',
    hint: 'Para correcciones con humor',
    hintEn: 'For tongue-in-cheek edits',
    apply: combine('̶'),
  },
  {
    id: 'underline',
    label: 'Subrayado',
    labelEn: 'Underline',
    hint: 'Resalta sin gritar',
    hintEn: 'Highlights without shouting',
    apply: combine('̲'),
  },
]

export type EmojiGroup = {
  id: string
  label: string
  labelEn: string
  items: string[]
}

export const EMOJI_GROUPS: EmojiGroup[] = [
  {
    id: 'caritas',
    label: 'Caritas',
    labelEn: 'Faces',
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
    labelEn: 'Gestures',
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
    labelEn: 'Hearts',
    items: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '♥️', '✨', '💫', '⭐', '🌟',
    ],
  },
  {
    id: 'negocios',
    label: 'Negocios',
    labelEn: 'Business',
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
    labelEn: 'Objects',
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
    labelEn: 'Nature',
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

const COMBINING_MARKS = /[̶̲]/g

/**
 * Revierte los caracteres estilizados a su ASCII base y quita las marcas
 * combinantes (tachado/subrayado). Permite cambiar un fragmento de un
 * estilo a otro sin que se acumulen caracteres raros.
 */
export function unstyle(text: string): string {
  return Array.from(text.replace(COMBINING_MARKS, ''))
    .map((c) => REVERSE[c] ?? c)
    .join('')
}
