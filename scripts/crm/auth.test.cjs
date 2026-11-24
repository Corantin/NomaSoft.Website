const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

function authFixture() {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(__dirname + '/Code.gs', 'utf8'), context);
  const data = new Map();
  const props = {
    getProperty: (key) => data.get(key),
    setProperty: (key, value) => data.set(key, value),
  };
  return (action, time, overrides = {}) =>
    context.crmAuth(
      props,
      {
        action: 'otp.' + action,
        email: 'kevinmansour@hotmail.com',
        digest: 'example-code-digest',
        grant: 'example-session',
        ...overrides,
      },
      time,
    );
}

test('allowlist, expiration and guess limit', () => {
  const auth = authFixture();
  assert.equal(auth('issue', 0, { email: 'unlisted@example.com' }), false);
  assert.equal(auth('issue', 0), true);
  assert.equal(auth('issue', 5000), false);
  assert.equal(auth('verify', 600000), false);
  assert.equal(auth('issue', 600001), true);
  for (let i = 0; i < 5; i++)
    assert.equal(auth('verify', 600002, { digest: 'bad' }), false);
  assert.equal(auth('verify', 600003), false);
});

test('one-time consumption, renewal deadline, and revocation', () => {
  const auth = authFixture();
  assert.equal(auth('issue', 0), true);
  assert.equal(auth('verify', 100), true);
  assert.equal(auth('verify', 100), false);
  assert.equal(auth('active', 1000), true);
  assert.equal(auth('active', 100 + 30 * 86400000), false);
  assert.equal(auth('issue', 60000), true);
  assert.equal(auth('verify', 60010), true);
  assert.equal(auth('revoke', 60020), true);
  assert.equal(auth('active', 60021), false);
});
