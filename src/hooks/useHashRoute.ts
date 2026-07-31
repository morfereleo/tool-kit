import { useEffect, useState } from 'react'

export function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash || '#/')

  useEffect(() => {
    const onChange = () => {
      setHash(window.location.hash || '#/')
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return hash
}
