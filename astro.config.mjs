// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { execSync } from 'child_process';
import { existsSync } from 'node:fs';

const buildDate = new Date();

function gitLastmod(filePath) {
  try {
    const date = execSync(`git log -1 --format=%aI -- "${filePath}"`, { encoding: 'utf8' }).trim();
    return date ? new Date(date) : null;
  } catch {
    return null;
  }
}

function resolveLastmod(urlPath) {
  // Build content pages: /builds/soloknight/ → src/content/builds/soloknight.md
  const buildMatch = urlPath.match(/^\/builds\/([^/]+)\/$/);
  if (buildMatch && !['class', 'subclass'].includes(buildMatch[1])) {
    const file = `src/content/builds/${buildMatch[1]}.md`;
    if (existsSync(file)) return gitLastmod(file) ?? buildDate;
  }

  // Guide content pages: /guides/penetration-caps-explained/ → src/content/guides/...
  const guideMatch = urlPath.match(/^\/guides\/([^/]+)\/$/);
  if (guideMatch) {
    const file = `src/content/guides/${guideMatch[1]}.md`;
    if (existsSync(file)) return gitLastmod(file) ?? buildDate;
  }

  // Static pages
  const staticMap = {
    '/': 'src/pages/index.astro',
    '/builds/': 'src/pages/builds/index.astro',
    '/guides/': 'src/pages/guides/index.astro',
    '/about/': 'src/pages/about.astro',
  };
  const file = staticMap[urlPath];
  if (file) return gitLastmod(file) ?? buildDate;

  return buildDate;
}

export default defineConfig({
  site: 'https://kozy-eso-pvp-builds.simbad14100.workers.dev',
  integrations: [
    sitemap({
      serialize(item) {
        const urlPath = new URL(item.url).pathname;
        const isContentPage =
          (urlPath.startsWith('/builds/') && urlPath !== '/builds/') ||
          (urlPath.startsWith('/guides/') && urlPath !== '/guides/');
        return {
          ...item,
          lastmod: resolveLastmod(urlPath),
          changefreq: isContentPage ? 'weekly' : 'monthly',
        };
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
