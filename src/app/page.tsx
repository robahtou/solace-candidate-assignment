'use client';

import type { ChangeEvent }     from 'react';
import type { Advocate }        from '@DB/schema';

import { useEffect, useRef, useState }  from 'react';
import { useDebouncedValue }            from '@Utils/debounce';
import styles                           from './styles.module.css';

type PageInfo = {
  nextCursor : string | null;
  hasNextPage: boolean;
  limit      : number;
};

type ApiResponse = {
  data    : Advocate[];
  pageInfo: PageInfo;
};

const DEFAULT_LIMIT = 50;
const DEBOUNCE_MS   = 250;

function Home() {
  // Server-driven search with debounce and keyset pagination
  const [advocates, setAdvocates]       = useState<Advocate[]>([]);
  const [searchInput, setSearchInput]   = useState<string>('');
  const [nextCursor, setNextCursor]     = useState<string | null>(null);
  const [hasNextPage, setHasNextPage]   = useState<boolean>(false);
  const [isLoading, setIsLoading]       = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError]               = useState<string | null>(null);
  const [city, setCity]                 = useState<string>('');
  const [degree, setDegree]             = useState<string>('');
  const [specialty, setSpecialty]       = useState<string>('');
  const [minYears, setMinYears]         = useState<string>('');
  const [maxYears, setMaxYears]         = useState<string>('');

  const debouncedQuery = useDebouncedValue(searchInput.trim(), DEBOUNCE_MS);
  const debouncedCity = useDebouncedValue(city.trim(), DEBOUNCE_MS);
  const debouncedDegree = useDebouncedValue(degree.trim(), DEBOUNCE_MS);
  const debouncedSpecialty = useDebouncedValue(specialty.trim(), DEBOUNCE_MS);
  const debouncedMinYears = useDebouncedValue(minYears.trim(), DEBOUNCE_MS);
  const debouncedMaxYears = useDebouncedValue(maxYears.trim(), DEBOUNCE_MS);
  const abortRef = useRef<AbortController | null>(null);

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
        params.set('limit', String(DEFAULT_LIMIT));
        if (debouncedQuery) params.set('q', debouncedQuery);
        if (debouncedCity) params.set('city', debouncedCity);
        if (debouncedDegree) params.set('degree', debouncedDegree);
        if (debouncedSpecialty) params.set('specialty', debouncedSpecialty);
        if (debouncedMinYears) params.set('minYears', debouncedMinYears);
        if (debouncedMaxYears) params.set('maxYears', debouncedMaxYears);

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
  }, [debouncedQuery, debouncedCity, debouncedDegree, debouncedSpecialty, debouncedMinYears, debouncedMaxYears]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleResetClick = () => {
    setSearchInput('');
    setCity('');
    setDegree('');
    setSpecialty('');
    setMinYears('');
    setMaxYears('');
  };

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const params = new URLSearchParams();
      params.set('limit', String(DEFAULT_LIMIT));
      params.set('cursor', nextCursor);
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (debouncedCity) params.set('city', debouncedCity);
      if (debouncedDegree) params.set('degree', debouncedDegree);
      if (debouncedSpecialty) params.set('specialty', debouncedSpecialty);
      if (debouncedMinYears) params.set('minYears', debouncedMinYears);
      if (debouncedMaxYears) params.set('maxYears', debouncedMaxYears);

      const res = await fetch(`/api/advocates?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const json = (await res.json()) as ApiResponse;

      console.log('json', json);

      setAdvocates((prev) => prev.concat(json.data));
      setNextCursor(json.pageInfo.nextCursor);
      setHasNextPage(json.pageInfo.hasNextPage);
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <main className={styles['page']}>
      <h1 className={styles['heading']}>Solace Advocates</h1>
      <br />
      <br />
      <section className={styles['filters']}>
        <div className={styles['filters-row']}>
          <div className={styles['field']}>
            <label className={styles['label']} htmlFor="q">Search</label>
            <input
              id="q"
              className={styles['input']}
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Type name, city, degree, or specialty"
            />
          </div>
          <div className={styles['field']}>
            <label className={styles['label']} htmlFor="city">City</label>
            <input
              id="city"
              className={styles['input']}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Austin"
            />
          </div>
          <div className={styles['field']}>
            <label className={styles['label']} htmlFor="degree">Degree</label>
            <input
              id="degree"
              className={styles['input']}
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="e.g. PhD"
            />
          </div>
          <div className={styles['field']}>
            <label className={styles['label']} htmlFor="specialty">Specialty</label>
            <input
              id="specialty"
              className={styles['input']}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Eating disorders"
            />
          </div>
          <div className={styles['field']}>
            <label className={styles['label']} htmlFor="minYears">Min Years</label>
            <input
              id="minYears"
              className={styles['input']}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={minYears}
              onChange={(e) => setMinYears(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div className={styles['field']}>
            <label className={styles['label']} htmlFor="maxYears">Max Years</label>
            <input
              id="maxYears"
              className={styles['input']}
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={maxYears}
              onChange={(e) => setMaxYears(e.target.value)}
              placeholder="e.g. 12"
            />
          </div>
          <div className={styles['actions']}>
            <button className={styles['button']} onClick={handleResetClick} disabled={isLoading}>
              Reset Filters
            </button>
          </div>
        </div>
      </section>
      <br />
      {isLoading && <div>Loading…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <br />

      {/* Counts */}
      <section className={styles['summary']}>
        <span className={styles['count']}>
          Showing {advocates.length} result{advocates.length !== 1 ? 's' : ''}
        </span>
        {hasNextPage && <span className={styles['muted']}>More results available</span>}
      </section>

      <br />
      <table className={styles['table']}>
        <thead>
          <tr>
            <th>First Name</th>
            <th>Last Name</th>
            <th>City</th>
            <th>Degree</th>
            <th>Specialties</th>
            <th>Years of Experience</th>
            <th>Phone Number</th>
          </tr>
        </thead>
        <tbody>
          {advocates.map((advocate) => {
            return (
              <tr key={advocate.id}>
                <td>{advocate.firstName}</td>
                <td>{advocate.lastName}</td>
                <td>{advocate.city}</td>
                <td>{advocate.degree}</td>
                <td>
                  {advocate.specialties.map((s) => (
                    <div key={s}>{s}</div>
                  ))}
                </td>
                <td>{advocate.yearsOfExperience}</td>
                <td>{advocate.phoneNumber}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <br />
      <div>
        <button onClick={handleLoadMore} disabled={!hasNextPage || isLoading || isLoadingMore}>
          {isLoadingMore ? 'Loading…' : hasNextPage ? 'Load more' : 'No more results'}
        </button>
      </div>
    </main>
  );
}

export default Home;
