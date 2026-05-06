import NodeActionMenu from "@/app/_components/node-action-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronDownIcon } from "lucide-react"
import Link from "next/link"
import React from "react"

type Props = {
  data: Array<{ href?: string; label: string }>
}

const AppBreadcrumb = ({ data }: Props) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {data.map((item, index) => {
          const isLast = index === data.length - 1

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <NodeActionMenu>
                    <button className="flex cursor-pointer items-center gap-1 text-foreground transition-colors outline-none hover:text-primary">
                      {item.label}
                      <ChevronDownIcon className="size-3.5" />
                    </button>
                  </NodeActionMenu>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href ?? "#"}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {/* Render separator only if it's NOT the last item */}
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default AppBreadcrumb
