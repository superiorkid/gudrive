import { getQueryClient } from "@/lib/query-client"
import { nodeKeys } from "@/lib/query-keys"
import { fetchNodes } from "@/services/node-service"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { Suspense } from "react"
import MyDrivePage from "./_components/my-drive-page"

const Page = async () => {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: nodeKeys.list(),
    queryFn: () => fetchNodes(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MyDrivePage />
    </HydrationBoundary>
  )
}

export default Page
