import { Skeleton } from "@/components/ui/skeleton"
import { getQueryClient } from "@/lib/query-client"
import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { Suspense } from "react"
import DetailFolderPage from "./_components/detail-folder-page"
import AppContext from "@/app/(dashboard)/_components/app-context"

type Props = {
  params: Promise<{ folderId: string }>
  searchParams: Promise<{
    type?: string
    modified?: string
    "folder-group"?: string
    "sort-dir"?: string
    "sort-by"?: string
  }>
}

const FolderPage = async ({ params, searchParams }: Props) => {
  const [
    { folderId },
    {
      type,
      modified,
      "folder-group": folderGroup,
      "sort-dir": sortDirection,
      "sort-by": sortBy,
    },
  ] = await Promise.all([params, searchParams])

  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: nodeKeys.list({
      parentId: folderId,
      type: type ?? "",
      modified: modified ?? "",
      folderGroup,
      sortDirection,
      sortBy,
    }),
    queryFn: () =>
      fetchNodes({
        parentId: folderId,
        type,
        modified,
        folderGroup,
        sortDirection,
        sortBy,
      }),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Skeleton className="h-8 w-36" />}>
        <AppContext>
          <DetailFolderPage folderId={folderId} />
        </AppContext>
      </Suspense>
    </HydrationBoundary>
  )
}

export default FolderPage
