import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#211e1a',
				'primary-light': '#3a332a',
				'surface-light': '#fffdf8',
				'surface-lighter': '#fffdf7',
				'surface-bg': '#fbf1e2',
				muted: '#8a7e6a',
				'muted-light': '#9a917f',
				'muted-lighter': '#b3a892',
				'border-light': '#cfc4ae',
				'border-lighter': '#e0d4bd',
				'empty-bg': '#fbf4e7',
				success: '#1e9e6a',
				'accent-orange': '#ff6a3d'
			},
			fontFamily: {
				bricolage: ["'Bricolage Grotesque'", 'system-ui'],
				mono: ["'Space Mono'", 'monospace']
			},
			fontSize: {
				xs: '10px',
				'xs-0.5': '10.5px',
				sm: '11px',
				'sm-0.5': '11.5px',
				base: '12px',
				md: '12.5px',
				lg: '13px',
				'lg-0.5': '13.5px',
				xl: '14px',
				'xl-0.5': '14.5px',
				'2xl': '15px',
				'2xl-0.5': '15.5px',
				'3xl': '16px',
				'4xl': '19px',
				'5xl': '22px',
				'6xl': '24px'
			},
			borderRadius: {
				xs: '7px',
				sm: '12px',
				md: '13px',
				lg: '14px',
				xl: '16px',
				'2xl': '20px',
				'3xl': '22px',
				full: '999px'
			},
			boxShadow: {
				sm: '2px 2px 0 #211e1a',
				md: '3px 3px 0 #211e1a',
				lg: '4px 4px 0 #211e1a',
				xl: '5px 5px 0 #211e1a',
				none: 'none'
			},
			borderWidth: {
				thick: '2.5px'
			},
			spacing: {
				'0.5': '2px',
				xs: '4px',
				sm: '8px',
				md: '9px',
				lg: '12px',
				xl: '14px',
				'2xl': '15px',
				'3xl': '16px',
				'4xl': '17px',
				'5xl': '18px',
				'6xl': '20px',
				'7xl': '26px'
			},
			letterSpacing: {
				xs: '0.02em',
				sm: '0.04em',
				md: '0.06em',
				lg: '0.09em',
				xl: '0.14em'
			}
		}
	},
	plugins: []
} satisfies Config;
