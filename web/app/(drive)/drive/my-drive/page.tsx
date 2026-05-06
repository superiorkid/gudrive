import axiosInstance from "@/lib/axios"
import Link from "next/link"

const getNodes = async () => {
  const response = await axiosInstance.get("/v1/nodes")
  return response.data
}

const DriveMyDrivePage = async () => {
  const nodes = await getNodes()

  return (
    <div className="grid grid-cols-5 gap-4 space-y-12 px-5 py-8">
      {(nodes.data || []).map((node: any) => {
        const isFolder = node.type === "folder"
        return (
          <Link href={`/drive/folders/${node.id}`} key={`Node-${node.id}`}>
            <div className="border p-3">
              <h1>{isFolder ? "Folder" : "File"}</h1>
              <p>{node.name}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default DriveMyDrivePage
