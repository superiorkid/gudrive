import { parseAsString, useQueryState } from "nuqs"

export function useKeyword() {
  return useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      shallow: true,
      clearOnDefault: true,
    })
  )
}
