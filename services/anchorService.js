const axios = require('axios');

const BASE_URL = process.env.ANCHOR_BASE_URL;
const API_KEY = process.env.ANCHOR_API_KEY;
const USE_MOCK = !BASE_URL;

if (!BASE_URL) {
  console.warn('ANCHOR_BASE_URL is not set — Anchor service will use local mock responses');
}
if (!API_KEY) {
  console.warn('ANCHOR_API_KEY is not set');
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`;
    headers['x-anchor-key'] = API_KEY;
  }
  return headers;
}

function mockResponse(data) {
  return { data };
}

module.exports = {
  async createBusinessCustomer(payload) {
  try {
    if (USE_MOCK) {
      const id = `local_cust_${Date.now()}`;
      console.log('anchorService: mock createBusinessCustomer ->', id);
      return mockResponse({ id });
    }

    const url = `${BASE_URL.replace(/\/$/, '')}/customers`;

    console.log('==== CREATE BUSINESS CUSTOMER REQUEST ====');
    console.log('URL:', url);
    console.log('HEADERS:', getAuthHeaders());
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));

    const res = await axios.post(url, payload, {
      headers: getAuthHeaders()
    });

    console.log('==== CREATE BUSINESS CUSTOMER RESPONSE ====');
    console.log('STATUS:', res.status);
    console.log('DATA:', JSON.stringify(res.data, null, 2));

    return res.data;

  } catch (err) {
    console.error('==== CREATE BUSINESS CUSTOMER ERROR ====');
    console.error('STATUS:', err.response?.status);
    console.error('DATA:', JSON.stringify(err.response?.data, null, 2));
    console.error('MESSAGE:', err.message);
    throw err;
  }
},

async createDepositAccount(customerId, payload) {
  try {
    if (USE_MOCK) {
      const id = `local_acc_${Date.now()}`;
      const accountNumber = `000${String(Date.now()).slice(-7)}`;
      console.log('anchorService: mock createDepositAccount ->', id);
      return mockResponse({ id, accountNumber });
    }

    const url = `${BASE_URL.replace(/\/$/, '')}/customers/${customerId}/accounts`;

    console.log('==== CREATE ACCOUNT REQUEST ====');
    console.log('URL:', url);
    console.log('PAYLOAD:', JSON.stringify(payload, null, 2));

    const res = await axios.post(url, payload, {
      headers: getAuthHeaders()
    });

    console.log('==== CREATE ACCOUNT RESPONSE ====');
    console.log('STATUS:', res.status);
    console.log('DATA:', JSON.stringify(res.data, null, 2));

    return res.data;

  } catch (err) {
    console.error('==== CREATE ACCOUNT ERROR ====');
    console.error('STATUS:', err.response?.status);
    console.error('DATA:', JSON.stringify(err.response?.data, null, 2));
    throw err;
  }
},

  async getAccountBalance(accountId) {
    try {
      if (USE_MOCK) {
        return mockResponse({ balance: 0 });
      }

      const url = `${BASE_URL.replace(/\/$/, '')}/accounts/${accountId}/balance`;
      const res = await axios.get(url, { headers: getAuthHeaders() });
      return res.data;
    } catch (err) {
      console.error('anchorService.getAccountBalance error', err.response?.data || err.message);
      throw err;
    }
  },

  async getAccountTransactions(accountId, params = {}) {
    try {
      if (USE_MOCK) {
        return mockResponse({ transactions: [] });
      }

      const url = `${BASE_URL.replace(/\/$/, '')}/accounts/${accountId}/transactions`;
      const res = await axios.get(url, { headers: getAuthHeaders(), params });
      return res.data;
    } catch (err) {
      console.error('anchorService.getAccountTransactions error', err.response?.data || err.message);
      throw err;
    }
  },

  async initiateTransfer(accountId, payload) {
    try {
      if (USE_MOCK) {
        const id = `local_tx_${Date.now()}`;
        const reference = `ref_${Date.now()}`;
        console.log('anchorService: mock initiateTransfer ->', id);
        return mockResponse({ id, status: 'pending', reference });
      }

      const url = `${BASE_URL.replace(/\/$/, '')}/accounts/${accountId}/transfers`;
      const res = await axios.post(url, payload, { headers: getAuthHeaders() });
      return res.data;
    } catch (err) {
      console.error('anchorService.initiateTransfer error', err.response?.data || err.message);
      throw err;
    }
  },

  verifyWebhookSignature(headers, body) {
    try {
      const secret = process.env.ANCHOR_WEBHOOK_SECRET;
      if (!secret) return true; // no secret configured => skip verification
      const signature = headers['x-anchor-signature'] || headers['signature'];
      if (!signature) return false;
      const crypto = require('crypto');
      const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
      return signature === expected;
    } catch (e) {
      console.error('anchorService.verifyWebhookSignature error', e);
      return false;
    }
  }
};
