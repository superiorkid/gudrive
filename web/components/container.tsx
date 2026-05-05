import { cn } from "@/lib/utils"
import React, { ComponentPropsWithoutRef } from "react"

const AppContainer = (props: ComponentPropsWithoutRef<"div">) => {
  const { className, children, ...restProps } = props
  return (
    <div className={cn("mx-auto max-w-4xl px-3", className)} {...restProps}>
      {children}
    </div>
  )
}

export default AppContainer
