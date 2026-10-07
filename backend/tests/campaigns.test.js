import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { setAIClient } from '../src/config/ai.js';
import { Customer, Segment, sequelize } from '../src/models/index.js';
import { bearer, createAdminSession, createMarketerSession, resetDb } from './helpers.js';

const completion = (obj) => ({ model: 'fake-model', usage: { total_tokens: 42 }, choices: [{ message: { content: typeof obj === 'string' ? obj : JSON.stringify(obj) } }] });
const goodEmail = { name: 'Win-back May', subject: 'We miss you, {{first_name}}', preheader: 'Come back', content: 'Hi {{first_name}}, here is what is new.', callToAction: 'Shop now', rationale: 'Lapsed buyers respond to nostalgia.' };

let create;
let token;
let segmentId;

beforeEach(async () => {
  await resetDb();
  ({ token } = await createAdminSession());
  await Customer.bulkCreate([
    { firstName: 'A', lastName: 'B', email: 'a@x.test', status: 'vip', country: 'Cameroon', totalSpent: 500, orderCount: 4 },
    { firstName: 'C', lastName: 'D', email: 'c@x.test', status: 'vip', country: 'Ghana', totalSpent: 300, orderCount: 2 },
  ]);
  segmentId = (await Segment.create({ name: 'VIPs', criteria: { statuses: ['vip'] } })).id;
  create = jest.fn().mockResolvedValue(completion(goodEmail));
  setAIClient({ chat: { completions: { create } } });
});
afterAll(() => sequelize.close());

const brief = (over = {}) => ({ objective: 'Win back lapsed VIP customers', channel: 'email', tone: 'friendly', segmentId, ...over });

describe('POST /api/campaigns/generate', () => {
  it('generates and saves a draft; the prompt carries aggregates only (no PII)', async () => {
    const res = await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief({ productOrOffer: '10% off accessories' })).expect(201);
    expect(res.body.data).toMatchObject({ status: 'draft', channel: 'email', subject: goodEmail.subject, segment: { id: segmentId } });
    expect(res.body.data.aiMetadata).toMatchObject({ model: 'fake-model', attempts: 1, promptVersion: 'v1' });

    const args = create.mock.calls[0][0];
    const userMsg = args.messages.find((m) => m.role === 'user').content;
    expect(userMsg).toContain('"size":2');
    expect(userMsg).not.toMatch(/a@x\.test|c@x\.test/);
    expect(args.response_format).toEqual({ type: 'json_object' });
  });

  it('returns an unsaved draft when save=false', async () => {
    const res = await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief({ save: false })).expect(200);
    expect(res.body.data.draft.content).toBe(goodEmail.content);
    const list = await request(app).get('/api/campaigns').set(bearer(token)).expect(200);
    expect(list.body.meta.total).toBe(0);
  });

  it('retries once when the model breaks channel limits, then succeeds', async () => {
    create.mockReset();
    create
      .mockResolvedValueOnce(completion({ ...goodEmail, content: 'x'.repeat(400) })) // too long for SMS
      .mockResolvedValueOnce(completion({ ...goodEmail, content: 'Short sms for {{first_name}}', subject: null }));
    const res = await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief({ channel: 'sms' })).expect(201);
    expect(res.body.data.content).toBe('Short sms for {{first_name}}');
    expect(res.body.data.aiMetadata.attempts).toBe(2);
    expect(create.mock.calls[1][0].messages[1].content).toMatch(/broke these rules/);
  });

  it('returns 502 when the model keeps producing invalid output', async () => {
    create.mockReset().mockResolvedValue(completion('not json at all'));
    const res = await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief()).expect(502);
    expect(res.body.error.code).toBe('AI_INVALID_OUTPUT');
  });

  it('maps provider failures without leaking details', async () => {
    create.mockReset().mockRejectedValue(Object.assign(new Error('secret upstream detail sk-123'), { status: 429 }));
    const res = await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief()).expect(503);
    expect(res.body.error.code).toBe('AI_RATE_LIMITED');
    expect(JSON.stringify(res.body)).not.toContain('sk-123');
  });

  it('returns 503 when AI is not configured, 404 for unknown segment, 422 for invalid input and empty audience', async () => {
    setAIClient(null);
    await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief()).expect(503);
    setAIClient({ chat: { completions: { create } } });

    await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief({ segmentId: '3f2b1c9e-8a44-4d57-9a53-1f9c2a7d1e10' })).expect(404);
    await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief({ channel: 'pigeon' })).expect(422);
    await request(app).post('/api/campaigns/generate').send(brief()).expect(401);

    const empty = await Segment.create({ name: 'Nobody', criteria: { statuses: ['churned'] } });
    const res = await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief({ segmentId: empty.id })).expect(422);
    expect(res.body.error.code).toBe('EMPTY_AUDIENCE');
  });
});

describe('campaign lifecycle', () => {
  let id;
  beforeEach(async () => {
    const res = await request(app).post('/api/campaigns/generate').set(bearer(token)).send(brief()).expect(201);
    id = res.body.data.id;
  });

  it('follows the status workflow and locks scheduled campaigns', async () => {
    await request(app).patch(`/api/campaigns/${id}/status`).set(bearer(token)).send({ status: 'sent' }).expect(409);
    await request(app).patch(`/api/campaigns/${id}/status`).set(bearer(token)).send({ status: 'approved' }).expect(200);

    await request(app).patch(`/api/campaigns/${id}/status`).set(bearer(token)).send({ status: 'scheduled', scheduledAt: new Date(Date.now() - 1000).toISOString() }).expect(422);
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const sched = await request(app).patch(`/api/campaigns/${id}/status`).set(bearer(token)).send({ status: 'scheduled', scheduledAt: future }).expect(200);
    expect(sched.body.data.status).toBe('scheduled');

    await request(app).put(`/api/campaigns/${id}`).set(bearer(token)).send({ content: 'edit' }).expect(409);
  });

  it('editing an approved campaign sends it back to draft; channel limits are enforced on edits', async () => {
    await request(app).patch(`/api/campaigns/${id}/status`).set(bearer(token)).send({ status: 'approved' }).expect(200);
    const res = await request(app).put(`/api/campaigns/${id}`).set(bearer(token)).send({ content: 'Updated body' }).expect(200);
    expect(res.body.data).toMatchObject({ status: 'draft', content: 'Updated body' });
    await request(app).put(`/api/campaigns/${id}`).set(bearer(token)).send({ channel: 'sms', content: 'y'.repeat(500) }).expect(422);
  });

  it('regenerates a draft with reviewer feedback', async () => {
    create.mockResolvedValueOnce(completion({ ...goodEmail, content: 'Punchier copy for {{first_name}}' }));
    const res = await request(app).post(`/api/campaigns/${id}/regenerate`).set(bearer(token)).send({ feedback: 'Make it punchier' }).expect(200);
    expect(res.body.data.content).toBe('Punchier copy for {{first_name}}');
    expect(create.mock.calls.at(-1)[0].messages[1].content).toContain('Make it punchier');
  });

  it('only the owner or an admin can modify a campaign', async () => {
    const { token: other } = await createMarketerSession(token);
    await request(app).delete(`/api/campaigns/${id}`).set(bearer(other)).expect(403);
    await request(app).get(`/api/campaigns/${id}`).set(bearer(other)).expect(200); // read is allowed
    await request(app).delete(`/api/campaigns/${id}`).set(bearer(token)).expect(204);
  });

  it('filters and paginates the list', async () => {
    const res = await request(app).get(`/api/campaigns?status=draft&channel=email&segmentId=${segmentId}&limit=5`).set(bearer(token)).expect(200);
    expect(res.body.meta.total).toBe(1);
    const none = await request(app).get('/api/campaigns?status=sent').set(bearer(token)).expect(200);
    expect(none.body.data).toHaveLength(0);
  });
});

describe('platform', () => {
  it('serves /health, 404s unknown routes and rejects malformed JSON', async () => {
    await request(app).get('/health').expect(200);
    const nf = await request(app).get('/api/nope').expect(404);
    expect(nf.body.error.code).toBe('NOT_FOUND');
    await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad').expect(400);
  });
});
