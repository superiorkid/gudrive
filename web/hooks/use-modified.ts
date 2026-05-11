import { usePathname } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect } from "react"

export function useModified() {
  const [modified, setModified] = useQueryState(
    "modified",
    parseAsString.withDefault("")
  )
  const pathname = usePathname()
  useEffect(() => {
    setModified(null)
  }, [pathname])

  return [modified, setModified] as const
}
