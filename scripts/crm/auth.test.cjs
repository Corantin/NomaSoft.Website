// Run against a local Redis server with redis-cli on PATH.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const test = require('node:test');

const source = fs.readFileSync(__dirname + '/../../lib/crm/redis-auth.ts', 'utf8');
const script = (name) => source.split('const ' + name + ' = `')[1].split('`')[0];
const cmd = (...args) =>
  execFileSync(
    'redis-cli',
    [
      '-h',
      '127.0.0.1',
      '-p',
      process.env.REDIS_TEST_PORT || '6379',
      '--raw',
      ...args.map(String),
    ],
    { encoding: 'utf8' },
  ).trim();
test('Redis limits issuance and guesses, consumes codes atomically and bounds session grants', (t) => {
  const prefix = 'test:crm:' + randomUUID(),
    key = (n) => prefix + ':' + n;
  t.after(() => cmd('DEL', key('sends'), key('code'), key('sessions')));
  const issue = (n) =>
    cmd('EVAL', script('issue'), 2, key('sends'), key('code'), n, 'digest' + n);
  const verify = (digest, i) =>
    cmd(
      'EVAL',
      script('verify'),
      2,
      key('code'),
      key('sessions'),
      digest,
      'grant' + i,
      3000000000000 + i,
    );
  assert.equal(issue(0), '1');
  assert.equal(issue(5), '0');
  assert.ok(Number(cmd('TTL', key('code'))) <= 600);
  for (let i = 0; i < 5; i++) assert.equal(verify('wrong', i), '0');
  assert.equal(verify('digest0', 0), '0');
  for (let i = 1; i <= 4; i++) assert.equal(issue(i * 60000), '1');
  assert.equal(issue(300000), '0');
  for (let i = 1; i <= 21; i++) {
    const n = i * 3600000;
    assert.equal(issue(n), '1');
    assert.equal(verify('digest' + n, i), '1');
    assert.equal(verify('digest' + n, i), '0');
  }
  assert.equal(cmd('ZCARD', key('sessions')), '20');
  assert.equal(cmd('ZSCORE', key('sessions'), 'grant1'), '');
  assert.ok(Number(cmd('TTL', key('sessions'))) > 2591900);
  assert.equal(cmd('ZREM', key('sessions'), 'grant21'), '1');
});
