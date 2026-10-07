import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Op } = require('sequelize');
import request from 'supertest';
import app from '../src/app.js';
import { Customer, sequelize } from '../src/models/index.js';
import { buildCustomerWhere } from '../src/services/segmentService.js';
import { bearer, createAdminSession, createMarketerSession, resetDb } from './helpers.js';

const day = 24 * 3600 * 1000;
const mk = (over) => ({ firstName: 'A', lastName: 'B', email: `${Math.random()}@x.test`, ...over });

let token;
beforeEach(async () => {
  await resetDb();
  ({ token } = await createAdminSession());
});
afterAll(() => sequelize.close());

describe('buildCustomerWhere (unit)', () => {
  it('always excludes opted-out customers', () => {
    expect(buildCustomerWhere({})[Op.and]).toContainEqual({ marketingOptIn: true });
  });

  it('maps criteria to conditions', () => {
    const and = buildCustomerWhere({ statuses: ['vip'], minTotalSpent: 100, maxOrderCount: 5, countries: ['Cameroon'] })[Op.and];
    expect(and).toContainEqual({ status: { [Op.in]: ['vip'] } });
    expect(and).toContainEqual({ country: { [Op.in]: ['Cameroon'] } });
    expect(and).toContainEqual({ totalSpent: { [Op.gte]: 100 } });
    expect(and).toContainEqual({ orderCount: { [Op.lte]: 5 } });
  });
});

describe('segments API', () => {
  beforeEach(async () => {
    await Customer.bulkCreate([
      mk({ status: 'vip', country: 'Cameroon', totalSpent: 3000, orderCount: 10, lastPurchaseAt: new Date(Date.now() - 5 * day) }),
      mk({ status: 'active', country: 'Cameroon', totalSpent: 200, orderCount: 2, lastPurchaseAt: new Date(Date.now() - 20 * day) }),
      mk({ status: 'churned', country: 'Nigeria', totalSpent: 90, orderCount: 1, lastPurchaseAt: new Date(Date.now() - 300 * day) }),
      mk({ status: 'vip', country: 'Cameroon', totalSpent: 5000, orderCount: 20, marketingOptIn: false }), // opted out
    ]);
  });

  it('previews an audience, excluding opted-out customers', async () => {
    const res = await request(app).post('/api/segments/preview').set(bearer(token)).send({ criteria: { statuses: ['vip'] } }).expect(200);
    expect(res.body.data.count).toBe(1);
  });

  it('creates a segment and returns member counts / members', async () => {
    const created = await request(app)
      .post('/api/segments')
      .set(bearer(token))
      .send({ name: 'Lapsed', criteria: { inactiveForDays: 90, minOrderCount: 1 } })
      .expect(201);
    const id = created.body.data.id;

    const one = await request(app).get(`/api/segments/${id}`).set(bearer(token)).expect(200);
    expect(one.body.data.memberCount).toBe(1);

    const members = await request(app).get(`/api/segments/${id}/customers`).set(bearer(token)).expect(200);
    expect(members.body.meta.total).toBe(1);
    expect(members.body.data[0].country).toBe('Nigeria');

    const list = await request(app).get('/api/segments').set(bearer(token)).expect(200);
    expect(list.body.data[0].memberCount).toBe(1);
  });

  it('validates criteria (bad enum, inverted range, unknown keys stripped)', async () => {
    const bad = await request(app).post('/api/segments').set(bearer(token)).send({ name: 'x', criteria: { statuses: ['nope'] } });
    expect(bad.status).toBe(422);
    const inverted = await request(app).post('/api/segments').set(bearer(token)).send({ name: 'x', criteria: { minTotalSpent: 10, maxTotalSpent: 5 } });
    expect(inverted.status).toBe(422);
    const ok = await request(app).post('/api/segments').set(bearer(token)).send({ name: 'x', criteria: { statuses: ['vip'], $where: 'evil' } }).expect(201);
    expect(ok.body.data.criteria).toEqual({ statuses: ['vip'] });
  });

  it('returns 404 for unknown ids and 422 for malformed ids', async () => {
    await request(app).get('/api/segments/3f2b1c9e-8a44-4d57-9a53-1f9c2a7d1e10').set(bearer(token)).expect(404);
    await request(app).get('/api/segments/not-a-uuid').set(bearer(token)).expect(422);
  });
});

describe('customers API', () => {
  it('supports CRUD, filtering, pagination and role-restricted delete', async () => {
    const created = await request(app)
      .post('/api/customers')
      .set(bearer(token))
      .send({ firstName: 'Ada', lastName: 'Lovelace', email: 'ADA@x.test', country: 'Ghana', totalSpent: 99999 })
      .expect(201);
    expect(created.body.data.email).toBe('ada@x.test');
    expect(created.body.data.totalSpent).toBe(0); // aggregates are not client-writable
    const id = created.body.data.id;

    await request(app).post('/api/customers').set(bearer(token)).send({ firstName: 'Dup', lastName: 'X', email: 'ada@x.test' }).expect(409);

    const tx = await request(app).post(`/api/customers/${id}/transactions`).set(bearer(token)).send({ amount: 49.5, category: 'software' }).expect(201);
    expect(tx.body.data.amount).toBe(49.5);
    const got = await request(app).get(`/api/customers/${id}`).set(bearer(token)).expect(200);
    expect(got.body.data).toMatchObject({ totalSpent: 49.5, orderCount: 1, status: 'active' });

    const list = await request(app).get('/api/customers?search=lovel&limit=1&sortBy=totalSpent&order=desc').set(bearer(token)).expect(200);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 1, total: 1 });
    await request(app).get('/api/customers?sortBy=password').set(bearer(token)).expect(422);

    const { token: mTok } = await createMarketerSession(token);
    await request(app).delete(`/api/customers/${id}`).set(bearer(mTok)).expect(403);
    await request(app).delete(`/api/customers/${id}`).set(bearer(token)).expect(204);
    await request(app).get(`/api/customers/${id}`).set(bearer(token)).expect(404);
  });
});
