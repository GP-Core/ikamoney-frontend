import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

/*
 * Íconos de la PWA a partir del símbolo del logo (public/favicon.svg). Se regeneran con `npm run generar-iconos`
 * y quedan en public/: pwa-64x64, pwa-192x192 y pwa-512x512 (transparentes), maskable-icon-512x512 y
 * apple-touch-icon-180x180 (fondo blanco) y favicon.ico.
 * Con el margen del preset (30 %) la punta de la flecha queda dentro de la zona segura del ícono maskable
 * (círculo del 80 %), así que Android no la recorta.
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: minimal2023Preset,
  images: ['public/favicon.svg'],
})
