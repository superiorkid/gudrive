export const nodeKeys = {
  base: ["nodes"] as const,
  lists: () => [...nodeKeys.base, "list"] as const,
  list: (params: { parentId?: string; type?: string } = {}) =>
    [
      ...nodeKeys.lists(),
      {
        parentId: params.parentId ?? null,
        type: params.type ?? null,
      },
    ] as const,
  details: () => [...nodeKeys.base, "detail"] as const,
  detail: (id: string) => [...nodeKeys.details(), id] as const,
}
