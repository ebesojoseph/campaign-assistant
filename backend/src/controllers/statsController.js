import { asyncHandler } from "../utils/asyncHandler.js";
import * as statsService from "../services/statsService.js";

export const getStats = asyncHandler(async (req, res) =>
  res.json({ data: await statsService.getDashboardStats() }),
);