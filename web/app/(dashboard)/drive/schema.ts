import z from "zod"

export const searchSchema = z.object({
  keyword: z.string(),
})

export type TSearchSchema = z.infer<typeof searchSchema>
