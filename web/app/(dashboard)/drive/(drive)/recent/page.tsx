import { Suspense } from "react"
import RecentPage from "./_components/recent-page"

const Page = () => {
  return (
    <Suspense>
      <RecentPage />
    </Suspense>
  )
}

export default Page
