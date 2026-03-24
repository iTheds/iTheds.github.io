import {
	type NavBarConfig,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/config";

export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

export const navBarConfig: NavBarConfig = {
	links: [
		{
			name: "首页",
			url: "/",
			icon: "material-symbols:home-outline-rounded",
		},
		{
			name: "归档",
			url: "/archive/",
			icon: "material-symbols:archive-outline-rounded",
		},
		{
			name: "关于",
			url: "/about/",
			icon: "material-symbols:info-outline-rounded",
		},
		{
			name: "GitHub",
			url: "https://github.com/iTheds",
			icon: "fa7-brands:github",
			external: true,
		},
	],
};
