export interface Post {
  url: string;
  frontmatter: {
    title: string;
    description?: string;
    pubDate: Date;
    tags: string[];
  };
}
