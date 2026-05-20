import { Skeleton } from "@/components/ui/skeleton"
import { getQueryClient } from "@/lib/query-client"
import { statKeys } from "@/lib/query-keys"
import { fetchStatistics } from "@/services/stat-service"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { Suspense } from "react"
import AppSearch from "../../_components/app-search"
import StatsOverview from "./_components/stats-overview"

const Page = async () => {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: statKeys.overview(),
    queryFn: fetchStatistics,
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="space-y-10">
        <div className="mx-auto max-w-xl space-y-4 pt-28 pb-10">
          <h1 className="text-center text-3xl font-semibold">
            Welcome to Drive
          </h1>

          <Suspense
            fallback={<Skeleton className="h-10 max-w-md 2xl:max-w-xl" />}
          >
            <AppSearch />
          </Suspense>
        </div>
        <StatsOverview />
      </main>
    </HydrationBoundary>
  )
}

export default Page
