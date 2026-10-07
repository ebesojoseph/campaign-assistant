import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Op, col, fn, literal } = require("sequelize");
import { Customer, CustomerTransaction } from "../models/index.js";

export async function getDashboardStats() {
  const [stats] = await Customer.findAll({
    attributes: [
      // 1. Total Customers
      [fn('COUNT', fn('DISTINCT', col('Customer.id'))), 'totalCustomers'],

      // 2. Active Customers
      [
        literal(`COUNT(DISTINCT CASE WHEN Customer.status = 'active' THEN Customer.id END)`),
        'activeCustomers',
      ],

      // 3. Total Transaction Value
      [
        literal(`COALESCE(SUM(transactions.amount), 0)`),
        'totalTransactionValue',
      ],

      // 4. Average Customer Value
      [
        literal(`COALESCE(SUM(transactions.amount) / NULLIF(COUNT(DISTINCT Customer.id), 0), 0)`),
        'avgCustomerValue',
      ],
    ],
    include: [
      {
        model: CustomerTransaction,
        as: 'transactions', // 👈 Matches Customer.hasMany(..., { as: 'transactions' })
        attributes: [],
        required: false,
      },
    ],
    raw: true,
  });

  return {
    totalCustomers: Number(stats?.totalCustomers || 0),
    activeCustomers: Number(stats?.activeCustomers || 0),
    totalTransactionValue: Math.round(Number(stats?.totalTransactionValue || 0) * 100) / 100,
    avgCustomerValue: Math.round(Number(stats?.avgCustomerValue || 0) * 100) / 100,
  };
}