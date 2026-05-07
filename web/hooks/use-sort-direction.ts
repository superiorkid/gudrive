import { parseAsString, useQueryState } from "nuqs"

export function useSortDirection() {
  return useQueryState(
    "sort-dir",
    parseAsString.withDefault("asc").withOptions({
      shallow: true,
      clearOnDefault: true,
    })
  )
}
