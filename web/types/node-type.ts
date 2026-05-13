export type TNode = {
  id: string
  name: string
  type: "file" | "folder"
  parent_id?: string
  parent?: TNode
  children?: Array<TNode>
  owner_id: string
  size?: number
  mime_type?: string
  storage_path?: string
  created_at: Date
  updated_at: Date
  deleted_at?: Date
  preview_url?: string
  preview_status: string
}
