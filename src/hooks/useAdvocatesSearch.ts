import { useEffect, useRef, useState } from 'react';
import type { Advocate } from '@DB/schema';
import { useDebouncedValue } from '@Utils/debounce';


// Centralizes server-driven search with debounce + page-based pagination.
export type AdvocateFilters = {
  q: string;
  city: string;
  degree: string;
  specialty: string;
  minYears: string;
  maxYears: string;
};

type PageInfo = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
};

type ApiResponse = {
  data: Advocate[];
  pageInfo: PageInfo;
};

export function useAdvocatesSearch(filters: AdvocateFilters, limit = 50) {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const dq = useDebouncedValue(filters.q.trim(), 250);
  const dCity = useDebouncedValue(filters.city.trim(), 250);
  const dDegree = useDebouncedValue(filters.degree.trim(), 250);
  const dSpecialty = useDebouncedValue(filters.specialty.trim(), 250);
  const dMinYears = useDebouncedValue(filters.minYears.trim(), 250);
  const dMaxYears = useDebouncedValue(filters.maxYears.trim(), 250);

  // Reset to first page when any debounced filter changes
  useEffect(() => {
    setPage(1);
  }, [dq, dCity, dDegree, dSpecialty, dMinYears, dMaxYears]);

  useEffect(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchPage = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('page', String(page));
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
        setPageInfo(json.pageInfo);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(e?.message || 'Unknown error');
          setAdvocates([]);
          setPageInfo(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();

    return () => {
      controller.abort();
    };
  }, [dq, dCity, dDegree, dSpecialty, dMinYears, dMaxYears, limit, page]);

  const goToPage = (p: number) => {
    setPage((prev) => {
      const next = Math.max(1, Math.floor(p));
      if (next === prev) return prev;
      return next;
    });
  };

  const nextPage = () => {
    setPage((prev) => {
      const max = pageInfo?.totalPages ?? prev + 1;
      return Math.min(prev + 1, max);
    });
  };

  const prevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  return {
    advocates,
    page,
    pageInfo,
    isLoading,
    error,
    goToPage,
    nextPage,
    prevPage
  };
}
