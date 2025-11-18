// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import expressiveCode from 'astro-expressive-code';

// https://astro.build/config
export default defineConfig({
  // TODO: Make dynamic
  site: 'https://aphilas.github.io/',
  integrations: [icon(), expressiveCode({
    frames: {
      showCopyToClipboardButton: false,
    }
  })]
});
