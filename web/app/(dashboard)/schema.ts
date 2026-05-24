import * as z from "zod"

export const createFolderSchema = z.object({
  name: z.string().min(1).max(50),
  parentId: z.string().optional(),
})

export type TCreateFolderSchema = z.infer<typeof createFolderSchema>

export const updateNodeSchema = z.object({
  newName: z.string().min(1).optional(),
  parentId: z.string().optional(),
})

export type TUpdateNodeSchema = z.infer<typeof updateNodeSchema>
