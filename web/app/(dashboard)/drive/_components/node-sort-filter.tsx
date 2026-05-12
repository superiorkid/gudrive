"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FILTER_CONFIG } from "@/constants/filter-config"
import { useFoldersGroup } from "@/hooks/use-folders-group"
import { useSortBy } from "@/hooks/use-sort-by"
import { useSortDirection } from "@/hooks/use-sort-direction"
import { cn } from "@/lib/utils"
import {
  ChevronDownIcon,
  FilesIcon,
  FolderTreeIcon,
  SortAscIcon,
} from "lucide-react"

type Props = {
  variant?: "default" | "trash"
}

const folderOptions = [
  { label: "On Top", value: "top", icon: FolderTreeIcon },
  { label: "Mixed with files", value: "mixed", icon: FilesIcon },
]

const NodeSortFilter = ({ variant = "default" }: Props) => {
  const [folderGroup, setFolderGroup] = useFoldersGroup()
  const [sortDirection, setSortDirection] = useSortDirection()
  const [sortBy, setSortBy] = useSortBy()

  const options = FILTER_CONFIG[variant]

  const activeSort = options.sort.find((s) => s.value === sortBy)
  const ActiveIcon = activeSort?.icon || SortAscIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="lg" variant="outline" className="capitalize">
          <ActiveIcon className="mr-2 size-4" />
          Sort
          <ChevronDownIcon className="ml-2 size-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-auto min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort By</DropdownMenuLabel>
          {options.sort.map((opt) => (
            <SortItem
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              isActive={sortBy === opt.value}
              onClick={() => setSortBy(opt.value)}
            />
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort Direction</DropdownMenuLabel>
          {options.direction.map((opt) => (
            <SortItem
              key={opt.value}
              label={opt.label}
              icon={opt.icon}
              isActive={sortDirection === opt.value}
              onClick={() => setSortDirection(opt.value)}
            />
          ))}
        </DropdownMenuGroup>

        {variant !== "trash" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Folders</DropdownMenuLabel>
              {folderOptions.map((opt) => (
                <SortItem
                  key={opt.value}
                  label={opt.label}
                  icon={opt.icon}
                  isActive={folderGroup === opt.value}
                  onClick={() => setFolderGroup(opt.value)}
                />
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SortItem = ({ label, icon: Icon, isActive, onClick }: any) => (
  <DropdownMenuItem
    onClick={onClick}
    className={cn(
      "flex cursor-pointer items-center gap-2",
      isActive && "bg-accent font-medium"
    )}
  >
    <Icon
      className={cn(
        "size-4",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    />
    <span>{label}</span>
  </DropdownMenuItem>
)

export default NodeSortFilter
