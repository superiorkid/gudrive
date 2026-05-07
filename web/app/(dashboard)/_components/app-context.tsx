"use client"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import React, { useState } from "react"
import CreateFolderForm from "./create-folder-form"
import FileUploads from "./file-uploads"

type Props = {
  children: React.ReactNode
}

// multipe dialogs in context menu
//
// ref: https://github.com/shadcn-ui/ui/issues/1011#issuecomment-1930103090

enum Dialogs {
  createFolderDialog = "createFolderDialog",
  uploadFileDialog = "uploadFileDialog",
}

const AppContext = ({ children }: Props) => {
  const [dialog, setDialog] = useState<Dialogs | null>(null)

  return (
    <Dialog>
      <ContextMenu>
        <ContextMenuTrigger>
          <FileUploads>{children}</FileUploads>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <DialogTrigger
            asChild
            onClick={() => setDialog(Dialogs.createFolderDialog)}
          >
            <ContextMenuItem>New Folder</ContextMenuItem>
          </DialogTrigger>
          <DialogTrigger
            asChild
            onClick={() => setDialog(Dialogs.uploadFileDialog)}
          >
            <ContextMenuItem>Upload Files</ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>
      <DialogContent>
        {dialog === Dialogs.createFolderDialog ? (
          <>
            <DialogHeader>
              <DialogTitle>New Folder</DialogTitle>
            </DialogHeader>
            <div>
              <CreateFolderForm />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
            <div>dialog 2 example</div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AppContext
