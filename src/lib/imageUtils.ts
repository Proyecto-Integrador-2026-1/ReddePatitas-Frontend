export const assets = {
  max: "/assets/mascotas/perro1.png",
};

export function normalizeImage(url?: string) {
  if (!url) return assets.max;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("public/")) return `/${url.replace(/^public\//, "")}`;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}
