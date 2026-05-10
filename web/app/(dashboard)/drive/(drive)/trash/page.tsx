import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import { Suspense } from "react"

const TrashPage = () => {
  return (
    <Suspense>
      <NodesDisplay data={[]} />
    </Suspense>
  )
}

export default TrashPage
