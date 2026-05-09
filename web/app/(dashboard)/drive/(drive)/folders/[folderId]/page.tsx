import NodesDisplay from "@/app/(dashboard)/_components/nodes-display"
import axiosInstance from "@/lib/axios"

type Props = {
  params: Promise<{ folderId: string }>
}

const getNodes = async (parentId?: string) => {
  const response = await axiosInstance.get("/v1/nodes", {
    params: { parent_id: parentId },
  })
  return response.data
}

const FolderPage = async ({ params }: Props) => {
  const { folderId } = await params
  const nodes = await getNodes(folderId)

  return <NodesDisplay data={nodes.data} />
}

export default FolderPage
