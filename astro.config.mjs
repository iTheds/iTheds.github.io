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
			sidebar: [
				{ label: '首页', slug: 'index' },
				{
					label: '项目文档',
					autogenerate: { directory: 'projects' },
				},
			],
		}),
	],
});
