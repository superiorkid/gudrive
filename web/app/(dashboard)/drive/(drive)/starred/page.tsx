import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { Suspense } from "react"

const StarredPage = () => {
  return (
    <Suspense>
      <NodesDisplay data={[]} />
    </Suspense>
  )
}

export default StarredPage
