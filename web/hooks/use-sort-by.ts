import { parseAsString, useQueryState } from "nuqs"

export function useSortBy() {
  return useQueryState(
    "sort-by",
    parseAsString.withDefault("name").withOptions({
      shallow: true,
      clearOnDefault: true,
    })
  )
}
