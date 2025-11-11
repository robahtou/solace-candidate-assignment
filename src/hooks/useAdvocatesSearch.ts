import { useEffect, useRef, useState } from 'react';
import type { Advocate } from '@DB/schema';
import { useDebouncedValue } from '@Utils/debounce';


// Centralizes server-driven search with debounce + keyset pagination.
export type AdvocateFilters = {
  q: string;
  city: string;
  degree: string;
  specialty: string;
  minYears: string;
  maxYears: string;
};

type PageInfo = {
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
};

type ApiResponse = {
  data: Advocate[];
  pageInfo: PageInfo;
};

export function useAdvocatesSearch(filters: AdvocateFilters, limit = 50) {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const dq = useDebouncedValue(filters.q.trim(), 250);
  const dCity = useDebouncedValue(filters.city.trim(), 250);
  const dDegree = useDebouncedValue(filters.degree.trim(), 250);
  const dSpecialty = useDebouncedValue(filters.specialty.trim(), 250);
  const dMinYears = useDebouncedValue(filters.minYears.trim(), 250);
  const dMaxYears = useDebouncedValue(filters.maxYears.trim(), 250);

  useEffect(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchFirstPage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('limit', String(limit));
        if (dq) params.set('q', dq);
        if (dCity) params.set('city', dCity);
        if (dDegree) params.set('degree', dDegree);
        if (dSpecialty) params.set('specialty', dSpecialty);
        if (dMinYears) params.set('minYears', dMinYears);
        if (dMaxYears) params.set('maxYears', dMaxYears);

        const res = await fetch(`/api/advocates?${params.toString()}`, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = (await res.json()) as ApiResponse;

        setAdvocates(json.data);
        setNextCursor(json.pageInfo.nextCursor);
        setHasNextPage(json.pageInfo.hasNextPage);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(e?.message || 'Unknown error');
          setAdvocates([]);
          setNextCursor(null);
          setHasNextPage(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirstPage();

    return () => {
      controller.abort();
    };
  }, [dq, dCity, dDegree, dSpecialty, dMinYears, dMaxYears, limit]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const params = new URLSearchParams();
      params.set('limit', String(limit));
      params.set('cursor', nextCursor);
      if (dq) params.set('q', dq);
      if (dCity) params.set('city', dCity);
      if (dDegree) params.set('degree', dDegree);
      if (dSpecialty) params.set('specialty', dSpecialty);
      if (dMinYears) params.set('minYears', dMinYears);
      if (dMaxYears) params.set('maxYears', dMaxYears);

      const res = await fetch(`/api/advocates?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = (await res.json()) as ApiResponse;

      setAdvocates((prev) => prev.concat(json.data));
      setNextCursor(json.pageInfo.nextCursor);
      setHasNextPage(json.pageInfo.hasNextPage);
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return {
    advocates,
    nextCursor,
    hasNextPage,
    isLoading,
    isLoadingMore,
    error,
    handleLoadMore
  };
}
