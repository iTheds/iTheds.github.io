// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://itheds.github.io',
	integrations: [
		starlight({
			title: 'iTheds Blog',
			social: [
				{ icon: 'github', label: 'Old Blog (GitHub)', href: 'https://github.com/iTheds/iTheds.github.io' },
			],
			head: [
				{
					tag: 'style',
					content: `
.mermaid {
  position: relative;
  margin: 1rem 0;
}

.mermaid svg {
  display: block;
  max-width: 100%;
  height: auto;
}

.mermaid.mermaid-zoomable {
  cursor: zoom-in;
}

.mermaid.mermaid-zoomable::after {
  content: '点击放大';
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 0.75rem;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.mermaid.mermaid-zoomable:hover::after {
  opacity: 1;
}

.mermaid-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(2px);
}

.mermaid-lightbox[hidden] {
  display: none;
}

.mermaid-lightbox__panel {
  position: relative;
  box-sizing: border-box;
  width: min(96vw, 1800px);
  height: min(94vh, 1200px);
  overflow: hidden;
  padding: 3.25rem 1.25rem 1.25rem;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.28);
}

.mermaid-lightbox__close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  border: 0;
  border-radius: 999px;
  padding: 0.35rem 0.65rem;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  cursor: pointer;
}

.mermaid-lightbox__toolbar {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mermaid-lightbox__tool {
  border: 0;
  border-radius: 999px;
  min-width: 2.25rem;
  padding: 0.35rem 0.7rem;
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  cursor: pointer;
  font: inherit;
}

.mermaid-lightbox__zoom {
  min-width: 4.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: rgba(15, 23, 42, 0.82);
}

.mermaid-lightbox__content svg {
  display: block;
  shape-rendering: geometricPrecision;
  text-rendering: geometricPrecision;
}

.mermaid-lightbox__content {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.mermaid-lightbox__stage {
  display: grid;
  place-items: center;
  min-width: 100%;
  min-height: 100%;
}
					`,
				},
				{
					tag: 'script',
					attrs: {
						type: 'module',
					},
					content: `
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

let mermaidReady = false;
let mermaidLightbox = null;
const MERMAID_ZOOM_MIN = 0.5;
const MERMAID_ZOOM_MAX = 4;
const MERMAID_ZOOM_STEP = 0.25;

const getSvgIntrinsicSize = (svg) => {
  const viewBox = svg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return { width: viewBox.width, height: viewBox.height };
  }

  const widthAttr = Number.parseFloat(svg.getAttribute('width') || '');
  const heightAttr = Number.parseFloat(svg.getAttribute('height') || '');
  if (widthAttr > 0 && heightAttr > 0) {
    return { width: widthAttr, height: heightAttr };
  }

  const rect = svg.getBoundingClientRect();
  return {
    width: rect.width || 800,
    height: rect.height || 600,
  };
};

const applyLightboxSvgSize = () => {
  if (!mermaidLightbox || mermaidLightbox.overlay.hidden) return;

  const { overlay, baseScale = 1, zoom = 1 } = mermaidLightbox;
  const content = overlay.querySelector('.mermaid-lightbox__content');
  const stage = overlay.querySelector('.mermaid-lightbox__stage');
  const svg = stage.querySelector('svg');
  if (!svg) return;

  const { width, height } = mermaidLightbox.intrinsicSize || getSvgIntrinsicSize(svg);
  const effectiveScale = baseScale * zoom;
  const scaledWidth = Math.max(width * effectiveScale, 320);
  const scaledHeight = Math.max(height * effectiveScale, 240);

  stage.style.width = scaledWidth + 'px';
  stage.style.height = scaledHeight + 'px';
  stage.style.minWidth = scaledWidth > content.clientWidth ? scaledWidth + 'px' : '100%';
  stage.style.minHeight = scaledHeight > content.clientHeight ? scaledHeight + 'px' : '100%';

  svg.setAttribute('width', String(scaledWidth));
  svg.setAttribute('height', String(scaledHeight));
  svg.style.width = scaledWidth + 'px';
  svg.style.height = scaledHeight + 'px';
  svg.style.maxWidth = 'none';
  svg.style.maxHeight = 'none';
};

const fitLightboxSvg = () => {
  if (!mermaidLightbox || mermaidLightbox.overlay.hidden) return;

  const { overlay } = mermaidLightbox;
  const content = overlay.querySelector('.mermaid-lightbox__content');
  const stage = overlay.querySelector('.mermaid-lightbox__stage');
  const svg = stage.querySelector('svg');
  if (!svg) return;

  const availableWidth = Math.max(content.clientWidth - 16, 320);
  const availableHeight = Math.max(content.clientHeight - 16, 240);
  const { width, height } = mermaidLightbox.intrinsicSize || getSvgIntrinsicSize(svg);
  const scale = Math.min(availableWidth / width, availableHeight / height);

  mermaidLightbox.baseScale = scale;
  applyLightboxSvgSize();
};

const updateLightboxZoomLabel = () => {
  if (!mermaidLightbox) return;
  const label = mermaidLightbox.overlay.querySelector('[data-mermaid-zoom-label]');
  if (!label) return;
  const percent = Math.round((mermaidLightbox.zoom || 1) * 100);
  label.textContent = percent + '%';
};

const setLightboxZoom = (nextZoom) => {
  if (!mermaidLightbox || mermaidLightbox.overlay.hidden) return;
  const clamped = Math.min(MERMAID_ZOOM_MAX, Math.max(MERMAID_ZOOM_MIN, nextZoom));
  mermaidLightbox.zoom = Math.round(clamped * 100) / 100;
  updateLightboxZoomLabel();
  applyLightboxSvgSize();
};

const getMermaidSource = (pre) => {
  const lineNodes = [...pre.querySelectorAll('.ec-line .code')];
  if (lineNodes.length) {
    return lineNodes.map((line) => line.textContent || '').join('\\n').trim();
  }

  const code = pre.querySelector('code');
  return (code?.textContent || pre.textContent || '').trim();
};

const ensureMermaidLightbox = () => {
  if (mermaidLightbox) return mermaidLightbox;

  const overlay = document.createElement('div');
  overlay.className = 'mermaid-lightbox';
  overlay.hidden = true;
  overlay.innerHTML = \`
    <div class="mermaid-lightbox__panel">
      <div class="mermaid-lightbox__toolbar" aria-label="Mermaid 图缩放控制">
        <button class="mermaid-lightbox__tool" type="button" data-mermaid-zoom-out aria-label="缩小">-</button>
        <button class="mermaid-lightbox__tool" type="button" data-mermaid-zoom-reset aria-label="重置缩放">重置</button>
        <button class="mermaid-lightbox__tool" type="button" data-mermaid-zoom-in aria-label="放大">+</button>
        <span class="mermaid-lightbox__zoom" data-mermaid-zoom-label>100%</span>
      </div>
      <button class="mermaid-lightbox__close" type="button" aria-label="关闭">关闭</button>
      <div class="mermaid-lightbox__content"><div class="mermaid-lightbox__stage"></div></div>
    </div>
  \`;

  const close = () => {
    overlay.hidden = true;
    overlay.querySelector('.mermaid-lightbox__stage').innerHTML = '';
    document.body.style.removeProperty('overflow');
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  overlay.querySelector('.mermaid-lightbox__close').addEventListener('click', close);
  overlay.querySelector('[data-mermaid-zoom-in]').addEventListener('click', () => setLightboxZoom((mermaidLightbox?.zoom || 1) + MERMAID_ZOOM_STEP));
  overlay.querySelector('[data-mermaid-zoom-out]').addEventListener('click', () => setLightboxZoom((mermaidLightbox?.zoom || 1) - MERMAID_ZOOM_STEP));
  overlay.querySelector('[data-mermaid-zoom-reset]').addEventListener('click', () => setLightboxZoom(1));

  document.addEventListener('keydown', (event) => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === '+' || event.key === '=') setLightboxZoom((mermaidLightbox?.zoom || 1) + MERMAID_ZOOM_STEP);
    if (event.key === '-') setLightboxZoom((mermaidLightbox?.zoom || 1) - MERMAID_ZOOM_STEP);
    if (event.key === '0') setLightboxZoom(1);
  });

  document.body.appendChild(overlay);
  mermaidLightbox = { overlay, close, zoom: 1, baseScale: 1, intrinsicSize: null };
  return mermaidLightbox;
};

const bindMermaidZoom = () => {
  const { overlay } = ensureMermaidLightbox();
  const stage = overlay.querySelector('.mermaid-lightbox__stage');
  const blocks = [...document.querySelectorAll('.mermaid svg')];

  for (const svg of blocks) {
    const container = svg.closest('.mermaid');
    if (!container || container.dataset.zoomBound === 'true') continue;

    container.dataset.zoomBound = 'true';
    container.classList.add('mermaid-zoomable');
    container.setAttribute('role', 'button');
    container.setAttribute('tabindex', '0');
    container.setAttribute('aria-label', '点击放大 Mermaid 图');

    const open = () => {
      stage.innerHTML = '';
      const clone = svg.cloneNode(true);
      const intrinsicSize = getSvgIntrinsicSize(svg);
      stage.appendChild(clone);
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      mermaidLightbox.intrinsicSize = intrinsicSize;
      mermaidLightbox.zoom = 1;
      updateLightboxZoomLabel();
      requestAnimationFrame(() => {
        fitLightboxSvg();
      });
    };

    container.addEventListener('click', open);
    container.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  }
};

const renderMermaidBlocks = async () => {
  if (!mermaidReady) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      theme: 'default',
    });
    mermaidReady = true;
  }

  const blocks = [...document.querySelectorAll('pre[data-language="mermaid"]')];
  for (const pre of blocks) {
    if (pre.dataset.mermaidProcessed === 'true') continue;

    const source = getMermaidSource(pre);
    if (!source) continue;

    const host = pre.closest('.expressive-code') || pre;
    const container = document.createElement('div');
    container.className = 'mermaid';
    container.textContent = source;

    pre.dataset.mermaidProcessed = 'true';
    host.replaceWith(container);
  }

  await mermaid.run({
    querySelector: '.mermaid',
  });

  bindMermaidZoom();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderMermaidBlocks();
  }, { once: true });
} else {
  renderMermaidBlocks();
}

document.addEventListener('astro:after-swap', () => {
  renderMermaidBlocks();
});

window.addEventListener('resize', () => {
  fitLightboxSvg();
});
					`,
				},
				{
					tag: 'script',
					content: `
(() => {
  const applyProjectScopedSidebar = () => {
    const path = (location.pathname || '/').toLowerCase();
    if (path === '/') return;

    const sidebar = document.getElementById('starlight__sidebar');
    if (!sidebar) return;

    const projectPrefixes = [
      '/project-tzdb/',
      '/project-tzdb-rebuild/',
      '/project-tsdb/',
      '/project-ippcaas/',
      '/project-distributednet/',
      '/project-tzmultimodel/',
      '/dailylog/',
      '/record-manual/',
      '/personal-resume/',
    ];

    const activePrefix = projectPrefixes
      .filter((p) => path.startsWith(p))
      .sort((a, b) => b.length - a.length)[0];

    if (!activePrefix) return;

    const groups = [...sidebar.querySelectorAll('ul.top-level > li')].filter((li) =>
      li.querySelector(':scope > details')
    );
    if (!groups.length) return;

    const desiredOrder = [
      'overview',
      'architecture',
      'implementation',
      'engineering',
      'appendix',
      '*',
    ];

    const getProjectSectionKey = (li, activePrefix) => {
      const rootLink = li.querySelector(':scope > a');
      const rootHref = (rootLink?.getAttribute('href') || '').toLowerCase();
      if (rootHref === activePrefix) return '__root__';

      const sectionLink = li.querySelector(':scope > details > ul > li > a');
      const sectionHref = (sectionLink?.getAttribute('href') || '').toLowerCase();

      const prefix = activePrefix.endsWith('/') ? activePrefix : activePrefix + '/';
      if (sectionHref.startsWith(prefix)) {
        const rest = sectionHref.slice(prefix.length);
        const segment = rest.split('/').filter(Boolean)[0];
        if (segment) return segment;
      }

      const summaryText = li.querySelector(':scope > details > summary .group-label')?.textContent?.trim().toLowerCase();
      return summaryText || '*';
    };

    const getOrderRank = (key) => {
      const exact = desiredOrder.indexOf(key);
      if (exact !== -1) return exact;
      return desiredOrder.indexOf('*');
    };

    for (const li of groups) {
      const rootLink = li.querySelector(':scope > details > ul > li > a');
      const href = (rootLink?.getAttribute('href') || '').toLowerCase();
      const keep = href === activePrefix;
      li.hidden = !keep;
      if (keep) {
        const details = li.querySelector(':scope > details');
        if (details) details.open = true;

        const list = details?.querySelector(':scope > ul');
        if (list) {
          const items = [...list.children];
          const rootItem = items.find((item) => {
            const link = item.querySelector(':scope > a');
            return ((link?.getAttribute('href') || '').toLowerCase() === activePrefix);
          });

          const otherItems = items.filter((item) => item !== rootItem);
          otherItems.sort((a, b) => {
            const keyA = getProjectSectionKey(a, activePrefix);
            const keyB = getProjectSectionKey(b, activePrefix);
            const rankA = getOrderRank(keyA);
            const rankB = getOrderRank(keyB);
            if (rankA !== rankB) return rankA - rankB;
            return keyA.localeCompare(keyB, 'zh-CN');
          });

          for (const item of otherItems) {
            const key = getProjectSectionKey(item, activePrefix);
            item.hidden = key === 'raw_snapshot';
          }

          const ordered = rootItem ? [rootItem, ...otherItems] : otherItems;
          for (const item of ordered) list.appendChild(item);
        }
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyProjectScopedSidebar, { once: true });
  } else {
    applyProjectScopedSidebar();
  }
  document.addEventListener('astro:after-swap', applyProjectScopedSidebar);
})();
					`,
				},
			],
			sidebar: [
				{ label: '首页', slug: 'index' },
				{ label: 'TZDB', autogenerate: { directory: 'project-tzdb' } },
				{ label: 'TZDB Rebuild', autogenerate: { directory: 'project-tzdb-rebuild' } },
				{ label: 'TSDB', autogenerate: { directory: 'project-tsdb' } },
				{ label: 'IPPCAAS', autogenerate: { directory: 'project-ippcaas' } },
				{ label: 'DistributedNet', autogenerate: { directory: 'project-distributedNet' } },
				{ label: 'TZ MultiModel', autogenerate: { directory: 'project-tzmultimodel' } },
				{ label: 'DailyLog', autogenerate: { directory: 'dailylog' } },
				{ label: 'Record Manual', autogenerate: { directory: 'record-manual' } },
				{ label: 'Resume', autogenerate: { directory: 'personal-resume' } },
			],
		}),
	],
});
