"use client"

import {
  ClockIcon,
  CommandIcon,
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
  useSidebar,
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
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/drive/home"
              className={cn(
                buttonVariants({
                  size: "lg",
                  variant: "ghost",
                }),
                "w-full justify-start gap-2 px-2"
              )}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <CommandIcon className="size-4" />
              </div>
              {!isCollapsed && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Acme Inc.</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              )}
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem className={cn(isCollapsed ? "px-2" : "px-5")}>
            <NodeActionMenu>
              <SidebarMenuButton
                className="h-10 w-full"
                variant="outline"
                tooltip="New Item"
              >
                <PlusIcon className={cn(!isCollapsed && "mr-2")} />
                {!isCollapsed && <span>New</span>}
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
