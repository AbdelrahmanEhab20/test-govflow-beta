import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

export function isMailboxAuthError(error) {
  if (!error) return false;

  const status = Number(error?.status || error?.statusCode || 0);
  if (status === 401 || status === 403) return true;

  const code = String(
    error?.code || error?.error?.code || error?.data?.error?.code || error?.data?.code || ''
  ).toUpperCase();
  if (
    code.includes('RECONNECT') ||
    code.includes('UNAUTHORIZED') ||
    code === 'OUTLOOK_RECONNECT_REQUIRED' ||
    code === 'GOOGLE_RECONNECT_REQUIRED' ||
    code === 'MISSING_REFRESH_TOKEN'
  ) {
    return true;
  }

  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('expired') ||
    message.includes('revoked') ||
    message.includes('reconnect') ||
    message.includes('invalid_grant') ||
    message.includes('token has been') ||
    message.includes('authentication')
  );
}

/**
 * Page-scoped inbox auto-sync while Email Inbox is open.
 * Skips when tab is hidden, auth is paused, or a sync is already in flight.
 */
export function useInboxAutoSync({
  enabled = false,
  provider = null,
  syncFn,
  isSyncing = false,
  intervalMs = DEFAULT_INTERVAL_MS,
  onAuthError,
} = {}) {
  const [authPaused, setAuthPaused] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const syncFnRef = useRef(syncFn);
  const onAuthErrorRef = useRef(onAuthError);
  const authPausedRef = useRef(authPaused);
  const isSyncingRef = useRef(isSyncing);
  const inFlightRef = useRef(false);
  const lastAttemptRef = useRef(0);
  const intervalMsRef = useRef(intervalMs);

  useEffect(() => {
    syncFnRef.current = syncFn;
  }, [syncFn]);

  useEffect(() => {
    onAuthErrorRef.current = onAuthError;
  }, [onAuthError]);

  useEffect(() => {
    authPausedRef.current = authPaused;
  }, [authPaused]);

  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  useEffect(() => {
    intervalMsRef.current = intervalMs;
  }, [intervalMs]);

  const clearAuthPause = useCallback(() => {
    authPausedRef.current = false;
    setAuthPaused(false);
  }, []);

  // New mailbox / provider → allow auto-sync again
  useEffect(() => {
    authPausedRef.current = false;
    setAuthPaused(false);
  }, [provider]);

  const markSynced = useCallback(() => {
    setLastSyncedAt(new Date());
  }, []);

  const runSync = useCallback(async ({ manual = false } = {}) => {
    if (!provider || (provider !== 'outlook' && provider !== 'gmail')) return false;
    if (typeof syncFnRef.current !== 'function') return false;
    if (!manual && authPausedRef.current) return false;
    if (!manual && typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return false;
    }
    // Avoid thrashing when tab focus flips before the next interval
    const now = Date.now();
    if (!manual && lastAttemptRef.current && now - lastAttemptRef.current < intervalMsRef.current * 0.9) {
      return false;
    }
    if (inFlightRef.current || isSyncingRef.current) return false;

    inFlightRef.current = true;
    lastAttemptRef.current = now;
    try {
      await syncFnRef.current();
      clearAuthPause();
      markSynced();
      return true;
    } catch (error) {
      if (isMailboxAuthError(error)) {
        const alreadyPaused = authPausedRef.current;
        authPausedRef.current = true;
        setAuthPaused(true);
        if (!alreadyPaused) {
          onAuthErrorRef.current?.(error);
        }
      }
      // Transient errors: silent — next interval retries
      if (manual) throw error;
      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, [provider, clearAuthPause, markSynced]);

  useEffect(() => {
    if (!enabled || !provider) return undefined;

    const tick = () => {
      void runSync({ manual: false });
    };

    const intervalId = window.setInterval(tick, intervalMs);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, provider, intervalMs, runSync]);

  return {
    authPaused,
    lastSyncedAt,
    clearAuthPause,
    markSynced,
    runSync,
  };
}
