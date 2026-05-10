export const nodeKeys = {
  base: ["nodes"] as const,
  lists: () => [...nodeKeys.base, "list"] as const,
  list: (parentId?: string) =>
    parentId
      ? ([...nodeKeys.lists(), "by-parent", parentId] as const)
      : ([...nodeKeys.lists(), "root"] as const),
  details: () => [...nodeKeys.base, "detail"] as const,
  detail: (id: string) => [...nodeKeys.details(), id] as const,
}
