# nevilleomangi.com

## Upgrading

1. Upgrade Astro
2. Upgrade Astro integrations
3. Optionally, upgrade GitHub workflow (https://github.com/withastro/action)

```sh
npx -y @astrojs/upgrade

npm i @astro-community/astro-embed-youtube@latest astro-expressive-code@latest @astrojs/rss@latest

npm i -D @iconify-json/mdi@latest @iconify-json/ri@latest astro-icon@latest sanitize-html@latest

rm -rf node_modules package-lock.json

npm i

npm run build

npm audit
```