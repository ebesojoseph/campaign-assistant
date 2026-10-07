import request from 'supertest';
import app from '../src/app.js';
import { sequelize } from '../src/models/index.js';

export const PASSWORD = 'Sup3rSecret-pass';

export const resetDb = () => sequelize.sync({ force: true });

/** Bootstraps the first (admin) user, then returns an agent + access token for them. */
export async function createAdminSession() {
  await request(app).post('/api/auth/register').send({ name: 'Admin', email: 'admin@dme.test', password: PASSWORD }).expect(201);
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email: 'admin@dme.test', password: PASSWORD }).expect(200);
  return { agent, token: res.body.data.accessToken, user: res.body.data.user };
}

/** Admin creates a marketer and we log in as them. */
export async function createMarketerSession(adminToken, email = 'marketer@dme.test') {
  await request(app)
    .post('/api/auth/register')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Marketer', email, password: PASSWORD })
    .expect(201);
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD }).expect(200);
  return { token: res.body.data.accessToken, user: res.body.data.user };
}

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });
