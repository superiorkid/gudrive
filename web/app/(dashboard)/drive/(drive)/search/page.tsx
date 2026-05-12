import { Suspense } from "react"
import SearchPage from "./_components/search-page"

const Page = () => {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  )
}

export default Page
