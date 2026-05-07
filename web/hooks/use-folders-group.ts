import { parseAsString, useQueryState } from "nuqs"

export function useFoldersGroup() {
  return useQueryState(
    "folder-group",
    parseAsString.withDefault("top").withOptions({
      shallow: true,
      clearOnDefault: true,
    })
  )
}
