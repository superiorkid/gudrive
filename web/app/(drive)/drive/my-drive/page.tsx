import axiosInstance from "@/lib/axios"
import { columns } from "./_components/columns"
import { DataTable } from "./_components/data-table"

const getNodes = async () => {
  const response = await axiosInstance.get("/v1/nodes")
  return response.data
}

const DriveMyDrivePage = async () => {
  const nodes = await getNodes()

  return (
    <div>
      <DataTable columns={columns} data={nodes.data} />
    </div>
  )
}

export default DriveMyDrivePage
