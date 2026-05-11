import { usePathname } from "next/navigation"
import { parseAsString, useQueryState } from "nuqs"
import { useEffect } from "react"

export function useType() {
  const [type, setType] = useQueryState(
    "type",
    parseAsString.withDefault("").withOptions({
      shallow: true,
      clearOnDefault: true,
    })
  )

  const pathname = usePathname()

  useEffect(() => {
    setType(null)
  }, [pathname])

  return [type, setType] as const
}
