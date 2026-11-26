import { getCollection } from 'astro:content';

/** Published news items, newest first. Drafts are visible in `npm run dev` only. */
export async function getNews() {
  const items = await getCollection('brennidepill', (e) => import.meta.env.DEV || !e.data.draft);
  return items.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
