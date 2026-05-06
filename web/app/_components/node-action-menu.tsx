import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FilePlusIcon, FolderPlusIcon } from "lucide-react"
import CreateFolderForm from "../(drive)/_components/create-folder-form"

type Props = {
  children: React.ReactNode
}

const NodeActionMenu = ({ children }: Props) => {
  return (
    <Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-auto min-w-52">
          <DropdownMenuGroup>
            <DialogTrigger asChild>
              <DropdownMenuItem>
                <FolderPlusIcon className="mr-2" />
                New Folder
              </DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuItem>
              <FilePlusIcon className="mr-2" />
              File Upload
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
        </DialogHeader>
        <CreateFolderForm />
      </DialogContent>
    </Dialog>
  )
}

export default NodeActionMenu
