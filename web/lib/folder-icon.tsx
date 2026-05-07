import {
  FileIcon,
  FileTextIcon,
  FilmIcon,
  FolderIcon,
  ImageIcon,
  MusicIcon,
  TypeIcon,
} from "lucide-react"

export const getFileIcon = (type: "file" | "folder", mimeType: string) => {
  if (type === "folder")
    return <FolderIcon className="fill-blue-500 text-blue-500" />

  if (mimeType.includes("image"))
    return <ImageIcon className="text-purple-500" />
  if (mimeType.includes("video")) return <FilmIcon className="text-red-500" />
  if (mimeType.includes("audio")) return <MusicIcon className="text-pink-500" />
  if (mimeType.includes("pdf"))
    return <FileTextIcon className="text-orange-500" />
  if (mimeType.includes("text")) return <TypeIcon className="text-gray-500" />

  return <FileIcon className="text-gray-400" /> // Default icon
}
