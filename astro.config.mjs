// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import expressiveCode from 'astro-expressive-code';

// https://astro.build/config
export default defineConfig({
  site: 'https://aphilas.top/',
  integrations: [icon(), expressiveCode({
    frames: {
      showCopyToClipboardButton: false,
    }
  })]
});
