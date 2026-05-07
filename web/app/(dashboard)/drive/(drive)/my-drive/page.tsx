import axiosInstance from "@/lib/axios"
import NodesDisplay from "../../../_components/nodes-display"

const getNodes = async () => {
  const response = await axiosInstance.get("/v1/nodes")
  return response.data
}

const DriveMyDrivePage = async () => {
  const nodes = await getNodes()
  return <NodesDisplay data={nodes.data} />
}

export default DriveMyDrivePage
