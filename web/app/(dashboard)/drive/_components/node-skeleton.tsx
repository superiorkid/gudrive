"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useDisplay } from "@/hooks/use-display"
import { cn } from "@/lib/utils"

type Props = {
  rows?: number
  className?: string
}

export const NodesSkeleton = ({ rows = 10, className }: Props) => {
  const [display] = useDisplay()

  const view = display ?? "list"

  if (view === "grid") {
    return (
      <div className={cn("w-full p-4", className)}>
        <Skeleton className="mb-4 h-4 w-32" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"
            >
              <Skeleton className="mb-3 h-24 w-full rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3 flex-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="grid grid-cols-12 gap-4 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <Skeleton className="col-span-6 h-3" />
        <Skeleton className="col-span-2 hidden h-3 md:block" />
        <Skeleton className="col-span-2 hidden h-3 md:block" />
        <Skeleton className="col-span-2 hidden h-3 md:block" />
      </div>

      <div className="divide-y divide-neutral-100 dark:divide-neutral-900">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-12 items-center gap-4 px-4 py-3"
          >
            <div className="col-span-6 flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton
                className="h-3"
                style={{ width: `${40 + ((i * 13) % 50)}%` }}
              />
            </div>
            <Skeleton className="col-span-2 hidden h-3 md:block" />
            <Skeleton className="col-span-2 hidden h-3 md:block" />
            <Skeleton className="col-span-2 hidden h-3 w-16 md:block" />
          </div>
        ))}
      </div>
    </div>
  )
}
