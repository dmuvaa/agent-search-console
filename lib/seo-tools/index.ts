import { checkSchema } from "@/lib/seo-tools/schema";
import { checkRobotsTxt } from "@/lib/seo-tools/robots";
import { checkSitemap } from "@/lib/seo-tools/sitemap";
import { checkRedirects } from "@/lib/seo-tools/redirects";
import { checkHttpHeaders } from "@/lib/seo-tools/headers";
import { checkHeadings } from "@/lib/seo-tools/headings";
import { checkMetaTags } from "@/lib/seo-tools/meta";
import { checkIndexability } from "@/lib/seo-tools/indexability";
import { checkBrokenLinks } from "@/lib/seo-tools/broken-links";
import { previewSerpSnippet } from "@/lib/seo-tools/serp-preview";
import { SeoToolError } from "@/lib/seo-tools/http";
import { isSeoToolName, type SeoToolName } from "@/lib/seo-tools/catalog";

export {
  SEO_TOOLS,
  SEO_TOOL_META,
  SEO_TOOL_NAMES,
  isSeoToolName,
  type SeoToolName,
} from "@/lib/seo-tools/catalog";

export async function runSeoTool(name: SeoToolName, url: string, requestHost: string) {
  if (!isSeoToolName(name)) throw new SeoToolError("Unknown SEO tool.", 400);
  switch (name) {
    case "check_schema":
      return checkSchema(url, requestHost);
    case "check_robots_txt":
      return checkRobotsTxt(url, requestHost);
    case "check_sitemap":
      return checkSitemap(url, requestHost);
    case "check_redirects":
      return checkRedirects(url, requestHost);
    case "check_http_headers":
      return checkHttpHeaders(url, requestHost);
    case "check_headings":
      return checkHeadings(url, requestHost);
    case "check_meta_tags":
      return checkMetaTags(url, requestHost);
    case "check_indexability":
      return checkIndexability(url, requestHost);
    case "check_broken_links":
      return checkBrokenLinks(url, requestHost);
    case "preview_serp_snippet":
      return previewSerpSnippet(url, requestHost);
    default:
      throw new SeoToolError("Unknown SEO tool.", 400);
  }
}
