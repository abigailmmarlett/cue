/** True when `tags` include every tag in `filter`, so selecting more tags narrows the results. */
export function hasAllTags(tags: { tagValueId: string }[], filter: { tagValueId: string }[]): boolean {
  return filter.every((f) => tags.some((t) => t.tagValueId === f.tagValueId));
}
