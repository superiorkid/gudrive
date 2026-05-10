import { parseAsStringEnum, useQueryState } from "nuqs"

export enum Display {
  list = "list",
  grid = "grid",
}

export function useDisplay() {
  return useQueryState(
    "display",
    parseAsStringEnum<Display>(Object.values(Display)).withDefault(Display.list)
  )
}
