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
					tag: 'script',
					attrs: {
						type: 'module',
					},
					content: `
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

let mermaidReady = false;

const getMermaidSource = (pre) => {
  const lineNodes = [...pre.querySelectorAll('.ec-line .code')];
  if (lineNodes.length) {
    return lineNodes.map((line) => line.textContent || '').join('\\n').trim();
  }

  const code = pre.querySelector('code');
  return (code?.textContent || pre.textContent || '').trim();
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
