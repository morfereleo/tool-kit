import { lazy, Suspense } from 'react'
import { Header, Footer } from '@/components/Layout'
import { useRoute } from '@/hooks/useRoute'
import Home from '@/pages/Home'

// Cada herramienta se carga bajo demanda: la home no paga el peso de las 7.
const IvaPage = lazy(() => import('@/pages/IvaPage'))
const TasasPage = lazy(() => import('@/pages/TasasPage'))
const ImagenesPage = lazy(() => import('@/pages/ImagenesPage'))
const QrPage = lazy(() => import('@/pages/QrPage'))
const ServiciosPage = lazy(() => import('@/pages/ServiciosPage'))
const AcuerdoPage = lazy(() => import('@/pages/AcuerdoPage'))
const TextoPage = lazy(() => import('@/pages/TextoPage'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-inkmuted" />
    </div>
  )
}

function App() {
  const route = useRoute()

  let page: React.ReactNode
  switch (route) {
    case '/iva':
      page = <IvaPage />
      break
    case '/tasas':
      page = <TasasPage />
      break
    case '/imagenes':
      page = <ImagenesPage />
      break
    case '/qr':
      page = <QrPage />
      break
    case '/servicios':
      page = <ServiciosPage />
      break
    case '/acuerdo':
      page = <AcuerdoPage />
      break
    case '/texto':
      page = <TextoPage />
      break
    default:
      page = <Home />
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Header current={route} />
      <div className="flex-1">
        <Suspense fallback={<PageLoader />}>{page}</Suspense>
      </div>
      <Footer />
    </div>
  )
}

export default App
