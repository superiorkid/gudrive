import React from "react"
import AppContext from "./_components/app-context"

type Props = {
  children: React.ReactNode
}

const DriveLayout = ({ children }: Props) => {
  return <AppContext>{children}</AppContext>
}

export default DriveLayout
