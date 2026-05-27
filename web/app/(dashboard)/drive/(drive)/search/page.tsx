import { Skeleton } from "@/components/ui/skeleton"
import { getQueryClient } from "@/lib/query-client"
import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import SearchPage from "./_components/search-page"

type Props = {
  searchParams: Promise<{ q?: string }>
}

const Page = async ({ searchParams }: Props) => {
  const { q } = await searchParams
  if (!q) redirect("/drive/home")

  const currentLimit = 25

  const queryClient = getQueryClient()

  await queryClient.prefetchInfiniteQuery({
    queryKey: nodeKeys.list({
      keyword: q,
      limit: currentLimit,
    }),
    queryFn: () => fetchNodes({ keyword: q, page: 1, limit: currentLimit }),
    initialPageParam: 1,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Skeleton className="h-8 w-36" />}>
        <SearchPage />
      </Suspense>
    </HydrationBoundary>
  )
}

export default Page
