import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetTypography,
	presetUno,
	presetWebFonts
} from 'unocss';

export default defineConfig({
	shortcuts: [],
	theme: {
		colors: {
			linen: '#FAF0E6',
			'sunlit-clay': '#F1A650',
			'burnt-peach': '#F17752',
			'blush-rose': '#D56D88',
			'muted-teal': '#87BAB2'
		}
	},
	presets: [
		presetUno(),
		presetAttributify(),
		presetIcons({
			scale: 1.2,
			prefix: 'i-',
			extraProperties: {
				display: 'inline-block',
				'vertical-align': 'middle'
			}
		}),
		presetTypography(),
		presetWebFonts({
			provider: 'google',
			fonts: {
				sans: 'Inter',
				serif: ['Cardo', 'Roboto Serif'],
				heading: ['Roboto Serif', 'serif']
			}
		})
	]
});
