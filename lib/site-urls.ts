export const websiteUrl = "https://agentrouter.trade";
export const appUrl = "https://app.agentrouter.trade";
export const docsUrl = "https://docs.agentrouter.trade";
export function docsLink(slug = "") {
  return docsUrl + (slug && slug !== "overview" ? "/" + slug : "");
}
