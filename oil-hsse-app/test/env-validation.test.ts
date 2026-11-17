import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePublicEnv, assertValidProductionEnv } from '../src/config/env';

describe('Public Environment Configuration Validation', () => {
  it('flags all missing required public variables by NAME only', () => {
    const status = validatePublicEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: '',
        NEXT_PUBLIC_API_URL: '',
      },
      true
    );

    assert.equal(status.isValid, false);
    assert.deepEqual(status.missingVars, [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'NEXT_PUBLIC_API_URL',
    ]);
  });

  it('rejects localhost and non-https API URLs in production', () => {
    const localhostStatus = validatePublicEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_demo_key',
        NEXT_PUBLIC_API_URL: 'http://localhost:8000/api',
      },
      true
    );
    assert.equal(localhostStatus.isValid, false);
    assert.equal(localhostStatus.apiBaseUrlConfigured, false);
    assert.equal(localhostStatus.invalidVars[0]?.name, 'NEXT_PUBLIC_API_URL');
    assert.equal(localhostStatus.invalidVars[0]?.reason, 'localhost_forbidden');

    const httpStatus = validatePublicEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_demo_key',
        NEXT_PUBLIC_API_URL: 'http://api.example.com/api',
      },
      true
    );
    assert.equal(httpStatus.isValid, false);
    assert.equal(httpStatus.invalidVars[0]?.reason, 'must_use_https');
  });

  it('assertValidProductionEnv throws listing variable NAMES and never leaks secret values', () => {
    const fakeSecret = 'sb_publishable_NEVER_LEAK_THIS_VALUE';
    assert.throws(
      () =>
        assertValidProductionEnv({
          NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: fakeSecret,
          NEXT_PUBLIC_API_URL: '',
        }),
      (err: any) => {
        assert.match(err.message, /NEXT_PUBLIC_API_URL/);
        assert.doesNotMatch(err.message, new RegExp(fakeSecret));
        return true;
      }
    );
  });

  it('passes in production when all three public variables are valid https values', () => {
    const status = validatePublicEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_valid_key',
        NEXT_PUBLIC_API_URL: 'https://oil-hsse-backend.vercel.app/api',
      },
      true
    );
    assert.equal(status.isValid, true);
    assert.equal(status.allIssues.length, 0);
  });

  it('allows http://localhost:8000/api in local development', () => {
    const status = validatePublicEnv(
      {
        NEXT_PUBLIC_SUPABASE_URL: 'https://demo.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_valid_key',
        NEXT_PUBLIC_API_URL: 'http://localhost:8000/api',
      },
      false
    );
    assert.equal(status.isValid, true);
  });
});
