import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
import { ChevronDownIcon, FilePlusIcon, FolderPlusIcon } from "lucide-react"
import Link from "next/link"
import React from "react"
import CreateFolderForm from "../../_components/create-folder-form"

type Props = {
  data: Array<{ href?: string; label: string }>
}

const AppBreadcrumb = ({ data }: Props) => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {data.map((item, index) => {
          const isLast = index === data.length - 1

          return (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {isLast ? (
                  <Dialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex cursor-pointer items-center gap-1 text-foreground transition-colors outline-none hover:text-primary">
                          {item.label}
                          <ChevronDownIcon className="size-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
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
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href ?? "#"}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {/* Render separator only if it's NOT the last item */}
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default AppBreadcrumb
