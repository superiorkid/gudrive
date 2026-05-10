"use client"

import { getQueryClient } from "@/lib/query-client"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

type Props = {
  children: Readonly<React.ReactNode>
}

export const ReactQueryProvider = ({ children }: Props) => {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
