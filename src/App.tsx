import { Header, Footer } from '@/components/Layout'
import { useHashRoute } from '@/hooks/useHashRoute'
import Home from '@/pages/Home'
import IvaPage from '@/pages/IvaPage'
import TasasPage from '@/pages/TasasPage'
import ImagenesPage from '@/pages/ImagenesPage'
import QrPage from '@/pages/QrPage'
import ServiciosPage from '@/pages/ServiciosPage'
import AcuerdoPage from '@/pages/AcuerdoPage'

function App() {
  const route = useHashRoute()

  let page: React.ReactNode
  switch (route) {
    case '#/iva':
      page = <IvaPage />
      break
    case '#/tasas':
      page = <TasasPage />
      break
    case '#/imagenes':
      page = <ImagenesPage />
      break
    case '#/qr':
      page = <QrPage />
      break
    case '#/servicios':
      page = <ServiciosPage />
      break
    case '#/acuerdo':
      page = <AcuerdoPage />
      break
    default:
      page = <Home />
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Header current={route} />
      <div className="flex-1">{page}</div>
      <Footer />
    </div>
  )
}

export default App
