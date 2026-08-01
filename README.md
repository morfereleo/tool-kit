# Tool Kit

Caja de herramientas gratuitas para freelancers y emprendedores. Todo corre 100% en el navegador: sin registro, sin instalación y sin que tus datos salgan de tu dispositivo.

**Diseñado por [Alejandro Danieles](https://alejandrodanieles.com)**

## Herramientas

| # | Herramienta | Qué hace |
|---|-------------|----------|
| 01 | **Calculadora de IVA** | Agrega o extrae el impuesto según el país (20 países), con modo avanzado en divisas, IGTF (3%) para Venezuela, teclado en pantalla y orden de servicio en PNG |
| 02 | **Tasas de cambio** | Pizarra con USD/EUR BCV, paralelo y USDT en vivo (dolarapi.com), variación vs. consulta anterior y conversor entre monedas |
| 03 | **Optimizador de imágenes** | Convierte PNG/JPG a WebP en lote, con comparador antes/después arrastrable y descarga individual o en ZIP |
| 04 | **Generador de QR** | QR personalizados con plantillas de color, medidor de contraste en tiempo real, logo opcional al centro (corrección de errores alta) y exportación PNG/SVG |
| 05 | **Cotizador de servicios** | 4 modelos de cotización (por fases, paquetes, valor percibido y retainer), con persistencia local de cotizaciones y ticket en PNG |
| 06 | **Acuerdo de servicios** | Documento de contratación con ítems, hitos de pago y firmas con cédula/ID, exportable como documento PNG y guardado local |

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS** con paleta sepia dinámica (claro/oscuro) vía variables CSS
- **shadcn/ui** (Radix)
- Sin backend: las tasas se consultan desde APIs públicas; el resto procesa localmente (canvas, localStorage)

## Desarrollo

```bash
npm install
npm run dev      # desarrollo
npm run build    # producción → dist/
```

La app usa hash routing (`#/iva`, `#/tasas`…), así que el build estático funciona en cualquier hosting (GitHub Pages, Netlify, Vercel) sin configuración adicional.

---

© 2026 Alejandro Danieles — Herramientas gratuitas, sin registro, sin letra pequeña.
