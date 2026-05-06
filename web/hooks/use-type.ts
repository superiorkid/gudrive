import { parseAsString, useQueryState } from "nuqs"

export function useType() {
  return useQueryState(
    "type",
    parseAsString.withDefault("").withOptions({
      shallow: true,
      clearOnDefault: true,
    })
  )
}
