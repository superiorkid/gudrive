import { Suspense } from "react"
import StarredPage from "./_components/starred-page"

const Page = () => {
  return (
    <Suspense>
      <StarredPage />
    </Suspense>
  )
}

export default Page
