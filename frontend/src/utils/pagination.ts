export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const currentPage = Math.max(1, Math.min(Math.floor(page), pageCount));
  const offset = (currentPage - 1) * size;
  return {
    items: items.slice(offset, offset + size),
    currentPage,
    pageCount,
    firstItem: items.length ? offset + 1 : 0,
    lastItem: Math.min(offset + size, items.length),
  };
}
