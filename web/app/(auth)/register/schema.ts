import z from "zod"

export const registerSchema = z
  .object({
    username: z.string().min(1, { error: "Username is required" }),
    email: z.email({ error: "Invalid email" }),
    password: z
      .string()
      .min(8, { error: "Password must be at least 8 characters" }),
    confirmPassword: z
      .string()
      .min(1, { error: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type RegisterSchema = z.infer<typeof registerSchema>
