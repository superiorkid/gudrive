export const nodeKeys = {
  base: ["nodes"] as const,
  lists: () => [...nodeKeys.base, "list"] as const,
  list: (
    params: {
      parentId?: string
      type?: string
      modified?: string
      folderGroup?: string
      sortDirection?: string
      sortBy?: string
    } = {}
  ) =>
    [
      ...nodeKeys.lists(),
      {
        parentId: params.parentId ?? null,
        type: params.type ?? null,
        modified: params.modified ?? null,
        folderGroup: params.folderGroup ?? "top",
        sortDirection: params.sortDirection ?? "asc",
        sortBy: params.sortBy ?? "name",
      },
    ] as const,
  details: () => [...nodeKeys.base, "detail"] as const,
  detail: (id: string) => [...nodeKeys.details(), id] as const,
}
