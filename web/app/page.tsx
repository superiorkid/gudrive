import AppContainer from "@/components/container"
import { Button } from "@/components/ui/button"
import { FolderPlusIcon } from "lucide-react"
import UploadFiles from "./_components/upload-files"

export default function Page() {
  return (
    <AppContainer className="space-y-12 px-5 py-8">
      <section>
        <UploadFiles />
      </section>
      <section>
        <Button variant="outline" size="lg" className="cursor-pointer">
          <FolderPlusIcon />
          <span className="sr-only">Create Folder</span>
        </Button>
      </section>
    </AppContainer>
  )
}
