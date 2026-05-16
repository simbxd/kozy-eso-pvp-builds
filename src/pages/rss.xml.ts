import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { getFileDates } from '../lib/git-dates';

export async function GET(context: APIContext) {
  const guides = await getCollection('guides');
  const sorted = guides
    .map(g => {
      const { publishedDate } = getFileDates(g.filePath ?? `src/content/guides/${g.id}.md`);
      return { guide: g, publishedDate };
    })
    .sort((a, b) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? ''));

  return rss({
    title: 'Kozy ESO PvP Builds — Guides',
    description: 'ESO mechanic breakdowns, PvP theory, and deep-dives.',
    site: context.site!.toString(),
    items: sorted.map(({ guide, publishedDate }) => ({
      title: guide.data.title,
      pubDate: publishedDate ? new Date(publishedDate) : new Date(),
      description: guide.data.summary,
      link: `/guides/${guide.id}/`,
    })),
  });
}
