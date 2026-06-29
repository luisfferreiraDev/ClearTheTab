import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide' }),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: false,
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
				runtimeCaching: [
					{
						// Cache page HTML on first visit; serve from cache when offline
						urlPattern: ({ request }) => request.mode === 'navigate',
						handler: 'NetworkFirst',
						options: {
							cacheName: 'pages',
							networkTimeoutSeconds: 3
						}
					},
					{
						// Cache Tesseract CDN resources (WASM + language data) after first use
						urlPattern:
							/^https:\/\/(cdn\.jsdelivr\.net|tessdata\.projectnaptha\.com)\//,
						handler: 'CacheFirst',
						options: {
							cacheName: 'tesseract-cdn',
							expiration: {
								maxEntries: 20,
								maxAgeSeconds: 60 * 60 * 24 * 30
							},
							cacheableResponse: {
								statuses: [0, 200]
							}
						}
					}
				]
			}
		})
	]
});
