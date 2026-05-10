import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const guides = await getCollection('guides');
  const sorted = guides.sort((a, b) =>
    b.data.published.getTime() - a.data.published.getTime()
  );

  return rss({
    title: 'Kozy ESO PvP Builds — Guides',
    description: 'ESO mechanic breakdowns, PvP theory, and deep-dives.',
    site: context.site!.toString(),
    items: sorted.map(guide => ({
      title: guide.data.title,
      pubDate: guide.data.published,
      description: guide.data.summary,
      link: `/guides/${guide.id}/`,
    })),
  });
}
