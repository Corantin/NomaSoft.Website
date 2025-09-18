// contentlayer.config.ts
import { defineDocumentType, makeSource } from "contentlayer/source-files";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
var LegalDoc = defineDocumentType(() => ({
  name: "LegalDoc",
  filePathPattern: "legal/**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    locale: { type: "string", required: true },
    slug: { type: "string", required: true },
    description: { type: "string", required: false }
  },
  computedFields: {
    url: {
      type: "string",
      resolve: (doc) => `/${doc.locale}/legal/${doc.slug}`
    }
  }
}));
var contentlayer_config_default = makeSource({
  contentDirPath: "content/mdx",
  documentTypes: [LegalDoc],
  mdx: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]]
  }
});
export {
  LegalDoc,
  contentlayer_config_default as default
};
//# sourceMappingURL=compiled-contentlayer-config-DJ7X4YBR.mjs.map
