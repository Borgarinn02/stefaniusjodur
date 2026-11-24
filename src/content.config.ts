import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Styrkþegar — one Markdown file per recipient: src/content/styrkthegar/<year>-<name>.md
const styrkthegar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/styrkthegar' }),
  schema: z.object({
    name: z.string(),
    year: z.number(),
    photo: z.string().nullable().optional(),
    photoCredit: z.string().nullable().optional(),
  }),
});

// Styrkveitingar — one Markdown file per award ceremony
const styrkveitingar = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/styrkveitingar' }),
  schema: z.object({
    title: z.string(),
    year: z.number(),
    season: z.string(),
  }),
});

// Síður — general pages (about, Stefanía, history, the trophy…)
const sidur = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sidur' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
  }),
});

export const collections = { styrkthegar, styrkveitingar, sidur };
