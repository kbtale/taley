import {
	defineConfig,
	presetAttributify,
	presetIcons,
	presetTypography,
	presetUno,
	presetWebFonts,
	transformerDirectives,
	transformerVariantGroup
} from 'unocss';

export default defineConfig({
	shortcuts: [],
	transformers: [
		transformerDirectives(),
		transformerVariantGroup()
	],
	theme: {
		colors: {
			linen: '#FAF0E6',
			'sunlit-clay': '#F1A650',
			'burnt-peach': '#F17752',
			'blush-rose': '#D56D88',
			'muted-teal': '#87BAB2'
		}
	},
	preflights: [
		{
			getCSS: () => `
        button {
          background: none;
          color: inherit;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
          outline: inherit;
        }
      `
		}
	],
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
				sans: {
					name: 'Inter',
					weights: ['400', '700']
				},
				heading: {
					name: 'Roboto Serif',
					weights: ['400', '700', '900']
				}
			}
		})
	]
});
