import { getQueryClient } from "@/lib/query-client"
import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import DetailFolderPage from "./_components/detail-folder-page"

type Props = {
  params: Promise<{ folderId: string }>
}

const FolderPage = async ({ params }: Props) => {
  const { folderId } = await params
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: nodeKeys.list(folderId),
    queryFn: () => fetchNodes({ parentId: folderId }),
  })
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DetailFolderPage folderId={folderId} />
    </HydrationBoundary>
  )
}

export default FolderPage
