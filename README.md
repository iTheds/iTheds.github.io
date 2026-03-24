# Astro Migration Draft

This directory contains a migration target for the original Hexo site.

## Commands

```bash
npm install
npm run prepare-content
npm run dev
```

## Notes

- Source content is pulled from `/home/hexo-backup/markdown`.
- Only Markdown content and images from `/home/hexo-backup/markdown/image` are copied.
- No Hexo theme assets are required. The site stays on a minimal Astro default-style layout.
