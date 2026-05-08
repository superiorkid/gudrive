"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useModified } from "@/hooks/use-modified"
import { format } from "date-fns"
import {
  CalendarDaysIcon,
  CalendarIcon,
  CalendarRangeIcon,
  ChevronDownIcon,
  ClockIcon,
  HistoryIcon,
  Settings2Icon,
} from "lucide-react"
import { useState } from "react"
import { DateRange } from "react-day-picker"

export const NodeModifiedFilter = () => {
  const [modified, setModified] = useModified()

  const [range, setRange] = useState<DateRange | undefined>()

  const handleSelectPreset = (value: string) => {
    setModified(value)
    setRange(undefined)
  }

  const applyCustomRange = () => {
    if (range?.from) {
      const fromStr = format(range.from, "yyyy-MM-dd")
      const toStr = range.to ? format(range.to, "yyyy-MM-dd") : ""

      const finalValue = toStr ? `${fromStr}~${toStr}` : fromStr
      setModified(finalValue)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={modified ? "default" : "outline"} className="h-9">
          <CalendarRangeIcon className="mr-2 size-4" />
          <span className="max-w-25 truncate">
            {modified ? modified.replace(/~/g, " to ") : "Modified"}
          </span>
          <ChevronDownIcon className="ml-2 size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuItem onClick={() => handleSelectPreset("today")}>
          <ClockIcon className="mr-2 size-4 text-muted-foreground" />
          Today
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelectPreset("last-7-days")}>
          <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
          Last 7 days
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelectPreset("last-30-days")}>
          <HistoryIcon className="mr-2 size-4 text-muted-foreground" />
          Last 30 days
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleSelectPreset("2026")}>
          <CalendarDaysIcon className="mr-2 size-4 text-muted-foreground" />
          This Year (2026)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Settings2Icon className="mr-2 size-4 text-muted-foreground" />
            <span>Custom date</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="p-0">
            <div className="flex flex-col">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={1}
                defaultMonth={new Date(2026, 4)}
              />
              <div className="border-t p-2">
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!range?.from}
                  onClick={applyCustomRange}
                >
                  Apply {range?.to ? "Range" : "Date"}
                </Button>
              </div>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {modified && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500"
              onClick={() => setModified(null)}
            >
              Clear Filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default NodeModifiedFilter
