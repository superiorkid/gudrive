import { usePathname } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"

export function useSortBy() {
  const pathname = usePathname()
  const isTrashPage = pathname.includes("trash")

  return useQueryState(
    "sort-by",
    parseAsString
      .withDefault(isTrashPage ? "date-trashed" : "name")
      .withOptions({
        shallow: true,
        clearOnDefault: true,
      })
  )
}
