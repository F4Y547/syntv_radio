export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function countrySlug(name: string, code: string) {
  const base = slugify(name);
  return base || code.toLowerCase();
}

export function genreSlug(name: string) {
  return slugify(name);
}
