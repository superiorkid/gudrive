import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"
import TrashPage from "./_components/trash-page"

const Page = () => {
  return (
    <Suspense fallback={<Skeleton className="h-8 w-36" />}>
      <TrashPage />
    </Suspense>
  )
}

export default Page
