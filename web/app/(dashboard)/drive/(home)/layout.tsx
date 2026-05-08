import React from "react"

type Props = {
  children: React.ReactNode
}

const HomeLayout = ({ children }: Props) => {
  return <div className="min-h-screen w-full">{children}</div>
}

export default HomeLayout
