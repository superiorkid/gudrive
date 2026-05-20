import AppContainer from "@/components/container"
import { Skeleton } from "@/components/ui/skeleton"

const StatsOverviewSkeleton = () => {
  return (
    <AppContainer className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:max-w-6xl">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={`skeleton-${index}`} className="aspect-video" />
      ))}
    </AppContainer>
  )
}

export default StatsOverviewSkeleton
