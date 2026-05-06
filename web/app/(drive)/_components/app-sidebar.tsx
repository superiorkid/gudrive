"use client"

import {
  ClockIcon,
  HardDriveIcon,
  HouseIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
} from "lucide-react"
import * as React from "react"

import NodeActionMenu from "@/app/_components/node-action-menu"
import { buttonVariants } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { NavMain } from "./nav-main"
import { NavUser } from "./nav-user"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "https://avatars.githubusercontent.com/u/124599?v=4",
  },
  navMain: [
    {
      title: "Home",
      url: "/drive/home",
      icon: HouseIcon,
      isActive: true,
    },
    {
      title: "My Drive",
      url: "/drive/my-drive",
      icon: HardDriveIcon,
    },
    {
      title: "Recent",
      url: "/drive/recent",
      icon: ClockIcon,
    },
    {
      title: "Starred",
      url: "/drive/starred",
      icon: StarIcon,
    },
    {
      title: "Trash",
      url: "/drive/trash",
      icon: TrashIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <Link
            href="/drive/home"
            className={cn(
              buttonVariants({
                size: "lg",
                className: "w-full justify-start",
                variant: "ghost",
              })
            )}
          >
            Acme Inc.
          </Link>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem className="px-5">
            <NodeActionMenu>
              <SidebarMenuButton
                className="h-10 justify-center"
                variant="outline"
              >
                <PlusIcon /> New
              </SidebarMenuButton>
            </NodeActionMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
