import { Skeleton } from "@/components/ui/skeleton"
import { getQueryClient } from "@/lib/query-client"
import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { Suspense } from "react"
import DetailFolderPage from "./_components/detail-folder-page"

type Props = {
  params: Promise<{ folderId: string }>
  searchParams: Promise<{ type?: string; modified?: string }>
}

const FolderPage = async ({ params, searchParams }: Props) => {
  const { folderId } = await params
  const { type, modified } = await searchParams
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: nodeKeys.list({
      parentId: folderId,
      type: type ?? "",
      modified: modified ?? "",
    }),
    queryFn: () => fetchNodes({ parentId: folderId, type, modified }),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Skeleton className="h-8 w-36" />}>
        <DetailFolderPage folderId={folderId} />
      </Suspense>
    </HydrationBoundary>
  )
}

export default FolderPage
