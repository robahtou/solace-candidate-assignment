// Debounce utilities for general callbacks and React usage.
// - `debounce`: Generic, framework-agnostic function with leading/trailing options.
// - `useDebouncedValue`: React hook to debounce any value updates.
// - `useDebouncedCallback`: React hook to debounce callbacks with stable identity.
import { useEffect, useMemo, useRef, useState } from 'react';

export type DebounceOptions = {
  leading?    : boolean;
  trailing?   : boolean;
  maxWaitMs?  : number;
};

export type Debounced<T extends (...args: any[]) => unknown> = ((...args: Parameters<T>) => void) & {
  cancel: () => void;
  flush: () => void;
  pending: () => boolean;
};

/**
 * Debounce a function with support for leading/trailing edges and optional maxWait.
 * @param fn      Function to debounce.
 * @param waitMs  Debounce wait in milliseconds.
 * @param options Configure leading/trailing edges and optional maxWait.
 */
export function debounce<T extends (...args: any[]) => unknown>(
  fn: T,
  waitMs: number,
  options?: DebounceOptions
): Debounced<T> {
  const leading = options?.leading === true;
  const trailing = options?.trailing !== false; // default true
  const maxWaitMs = options?.maxWaitMs;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastInvokeTime = 0;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: unknown;
  let result: unknown;

  function invoke(time: number) {
    lastInvokeTime = time;
    const args = lastArgs as Parameters<T>;
    const thisArg = lastThis as unknown;
    lastArgs = null;
    lastThis = undefined;
    result = fn.apply(thisArg as ThisParameterType<T>, args);
  }

  function shouldInvoke(time: number): boolean {
    if (lastCallTime === 0) return true;
    const sinceLastCall = time - lastCallTime;
    const sinceLastInvoke = time - lastInvokeTime;
    if (sinceLastCall >= waitMs) return true;
    if (sinceLastCall < 0) return true;
    if (maxWaitMs !== undefined && sinceLastInvoke >= maxWaitMs) return true;
    return false;
  }

  function startTimer(callback: () => void, ms: number) {
    timer = setTimeout(callback, ms);
  }

  function remainingWait(time: number): number {
    const sinceLastCall = time - lastCallTime;
    const sinceLastInvoke = time - lastInvokeTime;
    const wait = waitMs - sinceLastCall;
    return maxWaitMs !== undefined
      ? Math.min(wait, maxWaitMs - sinceLastInvoke)
      : wait;
  }

  function trailingEdge(time: number) {
    timer = null;
    if (trailing && lastArgs) {
      invoke(time);
    } else {
      lastArgs = null;
      lastThis = undefined;
    }
  }

  const debounced = function(this: unknown, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timer === null) {
        // No timer: handle leading edge
        if (leading) {
          invoke(time);
        }
        startTimer(() => trailingEdge(Date.now()), waitMs);
      } else if (maxWaitMs !== undefined) {
        // Handle maxWait enforced invoke
        clearTimeout(timer as ReturnType<typeof setTimeout>);
        startTimer(() => trailingEdge(Date.now()), remainingWait(time));
      }
    } else if (timer === null) {
      startTimer(() => trailingEdge(Date.now()), waitMs);
    }
  } as Debounced<T>;

  debounced.cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    lastArgs = null;
    lastThis = undefined;
    lastCallTime = 0;
    lastInvokeTime = 0;
  };

  debounced.flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      trailingEdge(Date.now());
    }
  };

  debounced.pending = () => timer !== null;

  return debounced;
}

/**
 * React hook to return a debounced version of any changing value.
 * Updates after `delayMs` ms of inactivity.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}

/**
 * React hook returning a debounced callback with stable identity.
 */
export function useDebouncedCallback<T extends (...args: any[]) => unknown>(
  callback: T,
  delayMs: number,
  options?: DebounceOptions
): Debounced<T> {
  const callbackRef = useRef<T>(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedRef = useRef<Debounced<T> | null>(null);

  useEffect(() => {
    const wrapped = debounce(((...args: Parameters<T>) => {
      return callbackRef.current(...args);
    }) as T, delayMs, options);
    debouncedRef.current = wrapped;
    return () => {
      wrapped.cancel();
      debouncedRef.current = null;
    };
  }, [delayMs, options]);

  const stable = useMemo(() => {
    const fn = ((...args: Parameters<T>) => {
      debouncedRef.current?.(...args);
    }) as Debounced<T>;
    fn.cancel = () => debouncedRef.current?.cancel();
    fn.flush  = () => debouncedRef.current?.flush();
    fn.pending = () => Boolean(debouncedRef.current?.pending());
    return fn;
  }, []);

  return stable;
}
