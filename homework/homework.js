const assert = require('node:assert/strict');

const BASE_URL = (process.env.API_BASE_URL || 'https://belajar-bareng.onrender.com').replace(/\/$/, '');
const API_USERNAME = process.env.API_USERNAME || 'admin';
const API_PASSWORD = process.env.API_PASSWORD || 'admin';

let token;

async function sendRequest(path, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...headers,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const rawBody = await response.text();
  let responseBody;
  try {
    responseBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    responseBody = rawBody;
  }

  return { status: response.status, body: responseBody };
}

describe('Belajar Bareng API', function () {
  this.timeout(30000);

  it('POST /api/login — login berhasil dan menyimpan token', async function () {
    const response = await sendRequest('/api/login', {
      method: 'POST',
      body: { username: API_USERNAME, password: API_PASSWORD },
    });

    assert.equal(response.status, 200, 'status HTTP login harus 200');

    token = response.body && response.body.token;
    assert.ok(
      response.body &&
        response.body.status === 200 &&
        typeof token === 'string' &&
        token.length > 0,
      'response body login harus memuat status 200 dan token'
    );
  });

  it('GET /api/users — mengambil daftar user dengan token login', async function () {
    const response = await sendRequest('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200, 'status HTTP get users harus 200');
    assert.ok(
      response.body &&
        response.body.status === 200 &&
        Array.isArray(response.body.users),
      'response body harus memuat status 200 dan array users'
    );
  });

  it('POST /api/add-user — positive case, menambahkan user', async function () {
    const payload = {
      username: `tia${Date.now()}`,
      age: 28,
    };
    const response = await sendRequest('/api/add-user', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: payload,
    });

    assert.equal(response.status, 201, 'status HTTP add user positif harus 201');
    assert.ok(
      response.body &&
        response.body.status === 201 &&
        typeof response.body.userId === 'string' &&
        response.body.username === payload.username,
      'response body harus memuat status 201, userId, dan username yang dikirim'
    );
  });

  it('POST /api/add-user — negative case, token tidak valid ditolak', async function () {
    const response = await sendRequest('/api/add-user', {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid-token-for-test' },
      body: { username: `tia${Date.now()}`, age: 28 },
    });

    assert.equal(response.status, 403, 'status HTTP add user dengan token invalid harus 403');
    assert.ok(
      response.body &&
        ((typeof response.body === 'object' &&
          (typeof response.body.message === 'string' || typeof response.body.error === 'string')) ||
          (typeof response.body === 'string' && response.body.trim().length > 0)),
      'response body penolakan harus berisi pesan error'
    );
  });
});
