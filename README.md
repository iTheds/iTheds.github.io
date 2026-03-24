# Astro Migration Draft

This repository contains the Astro version of the original Hexo site.

## Commands

```bash
npm install
npm run prepare-content
npm run dev
```

## Notes

- Source content is pulled from the repository-local `markdown/` directory.
- Only Markdown content and images from `markdown/image/` are copied.
- No Hexo theme assets are required. The site stays on a minimal Astro default-style layout.
