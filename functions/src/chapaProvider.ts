/**
 * Chapa payment provider abstraction.
 *
 * This module is the ONLY place that talks to the Chapa API. It never runs
 * in the browser — it is only imported by Cloud Functions, which is what
 * keeps CHAPA_SECRET_KEY out of client bundles.
 *
 * If CHAPA_SECRET_KEY is not configured, every call here throws a clear
 * "not configured" error rather than inventing a fake successful response.
 * No credentials are hardcoded or guessed.
 */

const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

export interface ChapaInitializeParams {
  amount: number;
  currency: 'ETB';
  email: string;
  firstName: string;
  lastName: string;
  txRef: string;
  callbackUrl: string;
  returnUrl: string;
}

export interface ChapaInitializeResult {
  checkoutUrl: string;
}

export interface ChapaVerifyResult {
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  txRef: string;
  raw: unknown;
}

function requireSecretKey(secretKey: string | undefined): string {
  if (!secretKey || secretKey.trim().length === 0) {
    throw new Error(
      'CHAPA_SECRET_KEY is not configured. Set it as a Cloud Functions secret ' +
        '(firebase functions:secrets:set CHAPA_SECRET_KEY) before enabling online payments.'
    );
  }
  return secretKey;
}

export async function initializeChapaPayment(
  secretKey: string | undefined,
  params: ChapaInitializeParams
): Promise<ChapaInitializeResult> {
  const key = requireSecretKey(secretKey);

  const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: String(params.amount),
      currency: params.currency,
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      tx_ref: params.txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
    }),
  });

  const data: any = await response.json().catch(() => ({}));

  if (!response.ok || data.status !== 'success' || !data.data?.checkout_url) {
    throw new Error(`Chapa initialization failed: ${data.message || response.statusText}`);
  }

  return { checkoutUrl: data.data.checkout_url };
}

export async function verifyChapaPayment(
  secretKey: string | undefined,
  txRef: string
): Promise<ChapaVerifyResult> {
  const key = requireSecretKey(secretKey);

  const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
    },
  });

  const data: any = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Chapa verification request failed: ${data.message || response.statusText}`);
  }

  const rawStatus = data.status === 'success' ? data.data?.status : data.status;
  const status: ChapaVerifyResult['status'] =
    rawStatus === 'success' ? 'success' : rawStatus === 'pending' ? 'pending' : 'failed';

  return {
    status,
    amount: Number(data.data?.amount ?? 0),
    currency: String(data.data?.currency ?? ''),
    txRef,
    raw: data,
  };
}
