import * as Crypto from 'expo-crypto';

function fallbackId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  return `${time}-${rand}`;
}

export function newId(): string {
  try {
    const id = Crypto.randomUUID();
    if (typeof id === 'string' && id.length > 0) return id;
  } catch {
    // Fall through to the time-and-random id.
  }
  return fallbackId();
}
