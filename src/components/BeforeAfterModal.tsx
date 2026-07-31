import { useEffect, useRef, useState } from 'react'
import { fmt } from '@/lib/format'

type Props = {
  job: { name: string; originalSize: number; webpSize: number; webpUrl: string }
  onClose: () => void
}

const fmtB = fmtBytesLocal
function fmtBytesLocal(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
