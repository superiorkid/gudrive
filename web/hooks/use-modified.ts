import { parseAsString, useQueryState } from "nuqs"

export function useModified() {
  return useQueryState(
    "modified",
    parseAsString.withDefault("").withOptions({ shallow: false })
  )
}
