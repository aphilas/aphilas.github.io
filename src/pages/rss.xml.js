import rss from '@astrojs/rss';
import sanitizeHtml from 'sanitize-html';

export async function GET(context) {
  const posts = Object.values(import.meta.glob("./posts/**/*.md", { eager: true }))

  return rss({
    title: 'Neville Omangi | Blog',
    description: 'Musings on software development and technology.',
    site: context.site,
    items: await Promise.all(posts.map(async (post) => ({
      link: post.url,
      content: sanitizeHtml((await post.compiledContent())),
      ...post.frontmatter,
    }))),
    customData: `<language>en-us</language>`,
  });
}
