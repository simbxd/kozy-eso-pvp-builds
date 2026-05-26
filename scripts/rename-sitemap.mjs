import { renameSync, existsSync } from 'fs';
if (existsSync('dist/sitemap-index.xml')) {
  renameSync('dist/sitemap-index.xml', 'dist/sitemap.xml');
  console.log('sitemap-index.xml → sitemap.xml');
}
