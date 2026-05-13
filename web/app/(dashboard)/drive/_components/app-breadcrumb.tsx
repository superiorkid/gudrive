"use client"

import NodeActionMenu from "@/app/_components/node-action-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { useNode } from "@/hooks/apis/nodes/use-node"
import { useDisplay } from "@/hooks/use-display"
import { formatLabel } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React from "react"
import { validate as uuidValidate } from "uuid"

const AppBreadcrumb = () => {
  const [display] = useDisplay()
  const searchParams = new URLSearchParams({ display })

  const pathname = usePathname()
  const pathSegments = pathname.split("/").filter((segment) => segment !== "")

  const data = [
    { label: "Home", href: "/", isUUID: false, segment: "" },
    ...pathSegments.map((segment, index) => ({
      segment: segment,
      label: formatLabel(segment),
      href: `/${pathSegments.slice(0, index + 1).join("/")}?${searchParams.toString()}`,
      isUUID: uuidValidate(segment),
    })),
  ]

  const isTrashPage = pathname.includes("trash")

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {data.map((item, index) => {
          const isLast = index === data.length - 1

          const labelContent = item.isUUID ? (
            <DynamicBreadcrumbLabel
              segment={item.segment}
              fallback={item.label}
            />
          ) : (
            item.label
          )

          return (
            <React.Fragment key={item.href}>
              <BreadcrumbItem>
                {isLast ? (
                  isTrashPage ? (
                    <BreadcrumbPage>{labelContent}</BreadcrumbPage>
                  ) : (
                    <NodeActionMenu>
                      <button className="flex cursor-pointer items-center gap-1 text-foreground transition-colors outline-none hover:text-primary">
                        {labelContent}
                        <ChevronDownIcon className="size-3.5" />
                      </button>
                    </NodeActionMenu>
                  )
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{labelContent}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

const DynamicBreadcrumbLabel = ({
  segment,
  fallback,
}: {
  segment: string
  fallback: string
}) => {
  const { data, isPending } = useNode(segment)

  if (isPending) {
    return <Skeleton className="h-8 w-32" />
  }

  return <>{data?.data.name || fallback}</>
}

export default AppBreadcrumb
