// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const buildDate = new Date();

export default defineConfig({
  site: 'https://kozy-eso-pvp-builds.simbad14100.workers.dev',
  integrations: [
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname;
        const isContentPage =
          (path.startsWith('/builds/') && path !== '/builds/') ||
          (path.startsWith('/guides/') && path !== '/guides/');
        return {
          ...item,
          lastmod: buildDate,
          changefreq: isContentPage ? 'weekly' : 'monthly',
        };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
