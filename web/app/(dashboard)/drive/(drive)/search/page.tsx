import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { Suspense } from "react"

const SearchPage = () => {
  return (
    <Suspense>
      <NodesDisplay data={[]} />
    </Suspense>
  )
}

export default SearchPage
