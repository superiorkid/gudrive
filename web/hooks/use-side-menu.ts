import {
  ClockIcon,
  HardDriveIcon,
  HouseIcon,
  LucideIcon,
  StarIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { useDisplay } from "./use-display"

export function useSideMenu() {
  const pathname = usePathname()
  const [display] = useDisplay()

  return useMemo<
    { title: string; url: string; icon: LucideIcon; isActive: boolean }[]
  >(() => {
    const searchParams = new URLSearchParams({ display })

    return [
      {
        title: "Home",
        url: `/drive/home`,
        icon: HouseIcon,
        isActive: pathname.includes("/drive/home"),
      },
      {
        title: "My Drive",
        url: `/drive/my-drive?${searchParams.toString()}`,
        icon: HardDriveIcon,
        isActive: pathname.includes("/drive/my-drive"),
      },
      {
        title: "Recent",
        url: `/drive/recent?${searchParams.toString()}`,
        icon: ClockIcon,
        isActive: pathname.includes("/drive/recent"),
      },
      {
        title: "Starred",
        url: `/drive/starred?${searchParams.toString()}`,
        icon: StarIcon,
        isActive: pathname.includes("/drive/starred"),
      },
      {
        title: "Trash",
        url: `/drive/trash?${searchParams.toString()}`,
        icon: Trash2Icon,
        isActive: pathname.includes("/drive/trash"),
      },
    ]
  }, [pathname, display])
}
