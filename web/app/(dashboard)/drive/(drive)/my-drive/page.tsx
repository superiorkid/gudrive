import { Skeleton } from "@/components/ui/skeleton"
import { getQueryClient } from "@/lib/query-client"
import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { Suspense } from "react"
import MyDrivePage from "./_components/my-drive-page"

type Props = {
  searchParams: Promise<{
    type?: string
    modified?: string
    "folder-group"?: string
    "sort-dir"?: string
    "sort-by"?: string
  }>
}

const Page = async ({ searchParams }: Props) => {
  const {
    type,
    modified,
    "folder-group": folderGroup,
    "sort-dir": sortDirection,
    "sort-by": sortBy,
  } = await searchParams
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: nodeKeys.list({
      type: type ?? "",
      modified: modified ?? "",
      folderGroup,
      sortDirection,
      sortBy,
    }),
    queryFn: () =>
      fetchNodes({
        type,
        modified,
        folderGroup,
        sortDirection,
        sortBy,
        status: "active",
      }),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Skeleton className="h-8 w-36" />}>
        <MyDrivePage />
      </Suspense>
    </HydrationBoundary>
  )
}

export default Page
