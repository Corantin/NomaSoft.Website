'use client';
import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { requestCode } from './actions';
export function LoginForm({connect=false}: {connect?:boolean}) {
  const [email, setEmail] = useState(''),
    [code, setCode] = useState(''),
    [sent, setSent] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      if (!sent) {
        await send();
        return;
      }
      const result = await signIn('credentials', {
        email,
        code,
        redirect: false,
        callbackUrl: '/api/crm/renew',
      });
      if (result?.ok && !result.error) {
        if (connect) window.location.reload(); else window.location.replace('/api/crm/renew');
        return;
      }
      setMessage('The code is incorrect or has expired.');
    } catch {
      setMessage('Sign-in is temporarily unavailable. Try again.');
    } finally {
      setBusy(false);
    }
  }
  async function send() {
    const result = await requestCode(email);
    if (!result.ok) {
      setMessage('Could not send a code. Try again shortly.');
      return;
    }
    setSent(true);
    setMessage(
      'If this address has access, check your inbox for an eight-digit code. Codes expire in 10 minutes.',
    );
  }
  async function resend() {
    setBusy(true);
    try {
      await send();
    } catch {
      setMessage('Could not send a code. Try again shortly.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <label className="crm-field">
        <span>Email address</span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          readOnly={sent}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      {sent && (
        <label className="crm-field">
          <span>Sign-in code</span>
          <input
            autoFocus
            required
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{8}"
            maxLength={8}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
      )}
      {message && <p role="status">{message}</p>}
      <button disabled={busy} className="crm-primary">
        {busy ? 'Please wait…' : sent ? 'Sign in' : 'Email me a code'}
      </button>
      {sent && (
        <div className="crm-login-links">
          <button type="button" disabled={busy} onClick={resend}>
            Resend code
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setSent(false);
              setCode('');
              setMessage('');
            }}
          >
            Change email
          </button>
        </div>
      )}
    </form>
  );
}
