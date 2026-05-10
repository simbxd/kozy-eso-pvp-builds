import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const articles = await getCollection('articles');
  const sorted = articles.sort((a, b) =>
    b.data.published.getTime() - a.data.published.getTime()
  );

  return rss({
    title: 'Kozy ESO PvP Builds — Articles',
    description: 'ESO mechanic breakdowns, PvP theory, and deep-dives.',
    site: context.site!.toString(),
    items: sorted.map(article => ({
      title: article.data.title,
      pubDate: article.data.published,
      description: article.data.summary,
      link: `/articles/${article.slug}/`,
    })),
  });
}
