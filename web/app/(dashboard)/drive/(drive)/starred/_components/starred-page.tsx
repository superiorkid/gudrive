"use client"

import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { useInfiniteNodes } from "@/hooks/apis/nodes/use-infinite-nodes"
import { useFoldersGroup } from "@/hooks/use-folders-group"
import { useModified } from "@/hooks/use-modified"
import { useNodeColumns } from "@/hooks/use-node-columns"
import { useSortBy } from "@/hooks/use-sort-by"
import { useSortDirection } from "@/hooks/use-sort-direction"
import { useType } from "@/hooks/use-type"
import { Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { NodesSkeleton } from "../../../_components/node-skeleton"

const StarredPage = () => {
  const [type] = useType()
  const [modified] = useModified()
  const [folderGroup] = useFoldersGroup()
  const [sortDirection] = useSortDirection()
  const [sortBy] = useSortBy()

  const columns = useNodeColumns("starred")

  const { ref, inView } = useInView()

  const { data, isPending, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteNodes({
      type,
      modified,
      folderGroup,
      sortBy,
      sortDirection,
      scope: "starred",
    })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isPending) {
    return <NodesSkeleton rows={12} />
  }

  const allNodes = data?.pages.flatMap((page) => page.data.items || []) || []

  return (
    <div>
      <NodesDisplay data={allNodes} columns={columns} />

      {hasNextPage && (
        <div
          ref={ref}
          className="flex min-h-10 items-center justify-center py-6"
        >
          {isFetchingNextPage ? (
            <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <div className="h-2" />
          )}
        </div>
      )}
    </div>
  )
}

export default StarredPage
