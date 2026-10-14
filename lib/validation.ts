import { z } from "zod";
export const agentInput = z.object({
  name: z.string().trim().min(3).max(60),
  description: z.string().trim().min(10).max(300),
  strategy: z.string().trim().min(30).max(8000),
  category: z.enum([
    "Research",
    "Momentum",
    "DeFi",
    "Risk management",
    "Trenches",
    "Prediction markets",
    "Stock Tokens",
  ]),
  hourlySol: z.number().min(0.000001).max(100).default(0.01),
  hourlyAgent: z.number().min(0.000001).max(1000000).default(10),
  avatar: z.number().int().min(0).max(5).default(0),
  avatarColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#bba7f5"),
  wallet: z.string().min(32).max(44),
  listed: z.boolean(),
});
export const rentalInput = z.object({
  agentId: z.uuid(),
  payer: z.string().min(32).max(44),
  hours: z.number().int().min(1).max(168),
});
export function rentalAmount(rate: number, hours: number) {
  if (
    !Number.isSafeInteger(rate) ||
    rate < 1 ||
    !Number.isInteger(hours) ||
    hours < 1 ||
    hours > 168
  )
    throw new Error("Invalid rental amount");
  const total = rate * hours;
  if (!Number.isSafeInteger(total))
    throw new Error("Amount exceeds safe range");
  return total;
}
