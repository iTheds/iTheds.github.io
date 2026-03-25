// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
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
    const path = location.pathname || '/';
    if (path === '/') return;

    const sidebar = document.getElementById('starlight__sidebar');
    if (!sidebar) return;

    const groups = [...sidebar.querySelectorAll('ul.top-level > li')].filter((li) =>
      li.querySelector(':scope > details')
    );
    if (!groups.length) return;

    let matched = false;
    for (const li of groups) {
      const rootLink = li.querySelector(':scope > details > ul > li > a');
      const href = rootLink?.getAttribute('href');
      const keep = Boolean(href && path.startsWith(href));
      li.hidden = !keep;
      if (keep) {
        matched = true;
        const details = li.querySelector(':scope > details');
        if (details) details.open = true;
      }
    }

    if (!matched) {
      for (const li of groups) li.hidden = false;
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
