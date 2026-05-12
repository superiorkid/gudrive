import {
  ArrowDownAZIcon,
  ArrowUpZAIcon,
  CalendarClockIcon,
  TypeIcon,
} from "lucide-react"

export const FILTER_CONFIG = {
  default: {
    sort: [
      { label: "Name", value: "name", icon: TypeIcon },
      {
        label: "Date Modified",
        value: "date-modified",
        icon: CalendarClockIcon,
      },
    ],
    direction: [
      { label: "A to Z", value: "asc", icon: ArrowDownAZIcon },
      { label: "Z to A", value: "desc", icon: ArrowUpZAIcon },
    ],
  },
  trash: {
    sort: [
      { label: "Name", value: "name", icon: TypeIcon },
      {
        label: "Date Modified",
        value: "date-modified",
        icon: CalendarClockIcon,
      },
      { label: "Date Trashed", value: "date-trashed", icon: CalendarClockIcon },
    ],
    direction: [
      { label: "New to Old", value: "desc", icon: ArrowDownAZIcon },
      { label: "Old to New", value: "asc", icon: ArrowUpZAIcon },
    ],
  },
}
