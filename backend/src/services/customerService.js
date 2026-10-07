import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { Op } = require("sequelize");
import { Customer, CustomerTransaction, sequelize } from "../models/index.js";
import { AppError } from "../utils/AppError.js";
import { paginated, parsePagination } from "../utils/pagination.js";

export const SORTABLE = [
  "createdAt",
  "lastName",
  "totalSpent",
  "orderCount",
  "lastPurchaseAt",
];

export async function listCustomers(q) {
  const pg = parsePagination(q);
  const where = {};
  if (q.status) where.status = q.status;
  if (q.country) where.country = q.country;
  if (q.marketingOptIn !== undefined) where.marketingOptIn = q.marketingOptIn;
  if (q.search) {
    const like = { [Op.like]: `%${q.search.replace(/[%_\\]/g, "\\$&")}%` };
    where[Op.or] = [{ firstName: like }, { lastName: like }, { email: like }];
  }
  const { rows, count } = await Customer.findAndCountAll({
    where,
    limit: pg.limit,
    offset: pg.offset,
    order: [
      [q.sortBy || "createdAt", (q.order || "desc").toUpperCase()],
      ["id", "ASC"],
    ],
  });
  return paginated(rows, count, pg);
}

export async function getCustomer(id) {
  const customer = await Customer.findByPk(id, {
    include: [
      {
        model: CustomerTransaction,
        as: "transactions",
        separate: true,
        limit: 20,
        order: [["purchasedAt", "DESC"]],
      },
    ],
  });
  if (!customer) throw new AppError(404, "Customer not found", "NOT_FOUND");
  return customer;
}

export const createCustomer = (data) => Customer.create(data);

export async function updateCustomer(id, data) {
  const customer = await Customer.findByPk(id);
  if (!customer) throw new AppError(404, "Customer not found", "NOT_FOUND");
  // Aggregates are derived from transactions and are not editable directly.
  return customer.update(data);
}

export async function deleteCustomer(id) {
  const n = await Customer.destroy({ where: { id } });
  if (!n) throw new AppError(404, "Customer not found", "NOT_FOUND");
}

/** Records a purchase and keeps the customer's denormalised aggregates in sync (atomic). */
export async function recordTransaction(customerId, data) {
  return sequelize.transaction(async (t) => {
    const customer = await Customer.findByPk(customerId, { transaction: t });
    if (!customer) throw new AppError(404, "Customer not found", "NOT_FOUND");

    const purchasedAt = data.purchasedAt || new Date();
    const tx = await CustomerTransaction.create(
      { ...data, customerId, purchasedAt },
      { transaction: t },
    );

    const last =
      customer.lastPurchaseAt && customer.lastPurchaseAt > purchasedAt
        ? customer.lastPurchaseAt
        : purchasedAt;
    await customer.update(
      {
        totalSpent: Math.round((customer.totalSpent + data.amount) * 100) / 100,
        orderCount: customer.orderCount + 1,
        lastPurchaseAt: last,
        status: customer.status === "lead" ? "active" : customer.status,
      },
      { transaction: t },
    );
    return tx;
  });
}
