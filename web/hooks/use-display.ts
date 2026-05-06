import { parseAsStringEnum, useQueryState } from "nuqs"

export enum Display {
  list = "LIST",
  grid = "GRID",
}

export function useDisplay() {
  return useQueryState(
    "display",
    parseAsStringEnum<Display>(Object.values(Display)).withDefault(Display.list)
  )
}
