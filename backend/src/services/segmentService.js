import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Op, col, fn, literal } = require('sequelize');
import { CUSTOMER_STATUS, enumValues } from '../constants/index.js';
import { Customer, Segment } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { paginated, parsePagination } from '../utils/pagination.js';

const int = (extra = {}) => ({ type: 'number', integer: true, min: 0, ...extra });

/** Allowed segment criteria (also used as the validation schema; unknown keys are stripped). */
export const criteriaSchema = {
  statuses: { type: 'array', maxItems: 10, items: { type: 'string', enum: enumValues(CUSTOMER_STATUS) } },
  countries: { type: 'array', maxItems: 50, items: { type: 'string', minLength: 2, maxLength: 56 } },
  minTotalSpent: { type: 'number', min: 0 },
  maxTotalSpent: { type: 'number', min: 0 },
  minOrderCount: int(),
  maxOrderCount: int(),
  purchasedWithinDays: int({ min: 1, max: 3650 }),
  inactiveForDays: int({ min: 1, max: 3650 }),
};

export function validateCriteriaRanges(c) {
  if (c.minTotalSpent !== undefined && c.maxTotalSpent !== undefined && c.minTotalSpent > c.maxTotalSpent) {
    return 'minTotalSpent cannot exceed maxTotalSpent';
  }
  if (c.minOrderCount !== undefined && c.maxOrderCount !== undefined && c.minOrderCount > c.maxOrderCount) {
    return 'minOrderCount cannot exceed maxOrderCount';
  }
  return null;
}

const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000);

const range = (min, max) => {
  const r = {};
  if (min !== undefined) r[Op.gte] = min;
  if (max !== undefined) r[Op.lte] = max;
  return Object.getOwnPropertySymbols(r).length ? r : null;
};

/** Translates segment criteria into a Sequelize `where`. Opted-out customers are always excluded. */
export function buildCustomerWhere(criteria = {}) {
  const and = [{ marketingOptIn: true }];

  if (criteria.statuses?.length) and.push({ status: { [Op.in]: criteria.statuses } });
  if (criteria.countries?.length) and.push({ country: { [Op.in]: criteria.countries } });

  const spent = range(criteria.minTotalSpent, criteria.maxTotalSpent);
  if (spent) and.push({ totalSpent: spent });
  const orders = range(criteria.minOrderCount, criteria.maxOrderCount);
  if (orders) and.push({ orderCount: orders });

  if (criteria.purchasedWithinDays) {
    and.push({ lastPurchaseAt: { [Op.gte]: daysAgo(criteria.purchasedWithinDays) } });
  }
  if (criteria.inactiveForDays) {
    and.push({ [Op.or]: [{ lastPurchaseAt: null }, { lastPurchaseAt: { [Op.lte]: daysAgo(criteria.inactiveForDays) } }] });
  }
  return { [Op.and]: and };
}

export const countMembers = (criteria) => Customer.count({ where: buildCustomerWhere(criteria) });

/** Aggregate (non-PII) picture of an audience; this is what gets sent to the AI provider. */
export async function summarizeAudience(criteria = {}) {
  const where = buildCustomerWhere(criteria);
  const [size, [agg], countries, statuses] = await Promise.all([
    Customer.count({ where }),
    Customer.findAll({
      where,
      attributes: [
        [fn('AVG', col('total_spent')), 'avgSpent'],
        [fn('AVG', col('order_count')), 'avgOrders'],
      ],
      raw: true,
    }),
    Customer.findAll({
      where,
      attributes: ['country', [fn('COUNT', col('id')), 'n']],
      group: ['country'],
      order: [[literal('n'), 'DESC']],
      limit: 5,
      raw: true,
    }),
    Customer.findAll({ where, attributes: ['status', [fn('COUNT', col('id')), 'n']], group: ['status'], raw: true }),
  ]);

  return {
    size,
    avgSpent: Math.round(Number(agg?.avgSpent || 0) * 100) / 100,
    avgOrders: Math.round(Number(agg?.avgOrders || 0) * 10) / 10,
    topCountries: countries.filter((c) => c.country).map((c) => ({ country: c.country, count: Number(c.n) })),
    statusBreakdown: Object.fromEntries(statuses.map((s) => [s.status, Number(s.n)])),
    criteria,
  };
}

export async function listSegments(q) {
  const pg = parsePagination(q);
  const { rows, count } = await Segment.findAndCountAll({
    limit: pg.limit,
    offset: pg.offset,
    order: [['createdAt', 'DESC']],
  });
  const withCounts = await Promise.all(
    rows.map(async (s) => ({ ...s.toJSON(), memberCount: await countMembers(s.criteria) }))
  );
  return paginated(withCounts, count, pg);
}

export async function getSegment(id) {
  const segment = await Segment.findByPk(id);
  if (!segment) throw new AppError(404, 'Segment not found', 'NOT_FOUND');
  return segment;
}

export async function getSegmentWithCount(id) {
  const segment = await getSegment(id);
  return { ...segment.toJSON(), memberCount: await countMembers(segment.criteria) };
}

export const createSegment = (data, userId) => Segment.create({ ...data, createdBy: userId });

export async function updateSegment(id, data) {
  return (await getSegment(id)).update(data);
}

export async function deleteSegment(id) {
  const n = await Segment.destroy({ where: { id } });
  if (!n) throw new AppError(404, 'Segment not found', 'NOT_FOUND');
}

export async function listSegmentMembers(id, q) {
  const segment = await getSegment(id);
  const pg = parsePagination(q);
  const { rows, count } = await Customer.findAndCountAll({
    where: buildCustomerWhere(segment.criteria),
    limit: pg.limit,
    offset: pg.offset,
    order: [['lastName', 'ASC'], ['id', 'ASC']],
  });
  return paginated(rows, count, pg);
}

export async function previewCriteria(criteria) {
  const where = buildCustomerWhere(criteria);
  const [count, sample] = await Promise.all([
    Customer.count({ where }),
    Customer.findAll({ where, limit: 5, order: [['totalSpent', 'DESC']] }),
  ]);
  return { count, sample };
}
