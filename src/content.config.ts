import { defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
  schema: z.object({
    title: z.string().optional().default(""),
    date: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).optional().default([]),
    categories: z.array(z.string()).optional().default([]),
    subtitle: z.string().optional(),
    author: z.string().optional(),
    draft: z.boolean().optional().default(false),
    section: z.string().optional().default("post"),
    sourcePath: z.string().optional(),
    slug: z.string().optional()
  })
});

const pageCollection = defineCollection({
  schema: z.object({
    title: z.string().optional().default(""),
    date: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).optional().default([]),
    categories: z.array(z.string()).optional().default([]),
    subtitle: z.string().optional(),
    author: z.string().optional(),
    draft: z.boolean().optional().default(false),
    section: z.string().optional().default("page"),
    sourcePath: z.string().optional(),
    slug: z.string().optional()
  })
});

export const collections = {
  blog: blogCollection,
  pages: pageCollection
};
