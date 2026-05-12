import { FolderOpenIcon } from "lucide-react"

const NoItemsView = () => {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center rounded-xl bg-muted/5 p-8 text-center">
      <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
        <FolderOpenIcon className="size-10 text-muted-foreground/60" />
      </div>
      <h3 className="text-xl font-medium tracking-tight">No items found</h3>
    </div>
  )
}

export default NoItemsView
