// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // URL base del sitio: se usa para canonical, Open Graph y og:url.
  // Se puede sobreescribir con SITE_URL al desplegar.
  site: import.meta.env.SITE_URL ?? 'https://escandalososstore.site',
  vite: {
    plugins: [tailwindcss()],
  },
});
