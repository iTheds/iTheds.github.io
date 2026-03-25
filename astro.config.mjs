// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	site: 'https://itheds.github.io',
	integrations: [
		starlight({
			title: 'iTheds Project Docs',
			social: [
				{ icon: 'github', label: 'Old Blog (GitHub)', href: 'https://github.com/iTheds/iTheds.github.io' },
			],
			head: [
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

    for (const li of groups) {
      const rootLink = li.querySelector(':scope > details > ul > li > a');
      const href = (rootLink?.getAttribute('href') || '').toLowerCase();
      const keep = href === activePrefix;
      li.hidden = !keep;
      if (keep) {
        const details = li.querySelector(':scope > details');
        if (details) details.open = true;
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
