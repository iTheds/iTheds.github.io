# Astro Migration Draft

This repository contains the Astro version of the original Hexo site.

## Commands

```bash
npm install
npm run dev
```

## Notes

- The primary content source is `src/content/blog/`.
- Images are served from `public/image/`.
- GitHub Pages deploys directly from the Astro project without any Hexo migration step.
- `scripts/prepare-content.mjs` is no longer part of the deployment flow.
