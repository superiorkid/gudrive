import { Skeleton } from "@/components/ui/skeleton"
import { getQueryClient } from "@/lib/query-client"
import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { Suspense } from "react"
import TrashPage from "./_components/trash-page"

type Props = {
  searchParams: Promise<{
    type?: string
    modified?: string
    "sort-dir"?: string
    "sort-by"?: string
  }>
}

// TODO: make a folder clickable. it should display child/deleted items

const Page = async ({ searchParams }: Props) => {
  const params = await searchParams

  const {
    type,
    modified,
    "sort-dir": sortDirection,
    "sort-by": rawSortBy,
  } = params

  const sortBy = rawSortBy ?? "date-trashed"
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: nodeKeys.list({
      type,
      modified,
      sortDirection,
      sortBy: sortBy ?? "date-trashed",
      status: "trashed",
    }),
    queryFn: () =>
      fetchNodes({
        type,
        modified,
        sortDirection,
        sortBy,
        status: "trashed",
      }),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Skeleton className="h-8 w-36" />}>
        <TrashPage />
      </Suspense>
    </HydrationBoundary>
  )
}

export default Page
