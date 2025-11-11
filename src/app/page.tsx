'use client';

import type { AdvocateFilters } from '@Hooks/useAdvocatesSearch';

import { useState }             from 'react';
import { useAdvocatesSearch }   from '@Hooks/useAdvocatesSearch';
import { AdvocatesFilters }     from '@Components/advocates/Filters';
import { AdvocatesTable }       from '@Components/advocates/AdvocatesTable';

import styles                   from './styles.module.css';


const DEFAULT_LIMIT = 50;
// Simple page-level Header to align UI with Solace brand theme.
function Header() {
  return (
    <header className={styles['header']}>
      <div className={styles['header-inner']}>
        <div className={styles['brand']}>
          <span className={styles['brand-mark']}>S</span>
          <span className={styles['brand-text']}>Solace Advocates</span>
        </div>
      </div>
    </header>
  );
}

function Home() {
  const [filters, setFilters] = useState<AdvocateFilters>({
    q: '',
    city: '',
    degree: '',
    specialty: '',
    minYears: '',
    maxYears: ''
  });

  const {
    advocates,
    hasNextPage,
    isLoading,
    isLoadingMore,
    error,
    handleLoadMore
  } = useAdvocatesSearch(filters, DEFAULT_LIMIT);

  const handleFiltersChange = (patch: Partial<AdvocateFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleReset = () => {
    setFilters({
      q: '',
      city: '',
      degree: '',
      specialty: '',
      minYears: '',
      maxYears: ''
    });
  };

  return (
    <main className={styles['page']}>
      <Header />

      <AdvocatesFilters
        filters={filters}
        onChange={handleFiltersChange}
        onReset={handleReset}
        disabled={isLoading}
      />

      <br />

      {isLoading && <div>Loading…</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <br />

      <section className={styles['summary']}>
        <span className={styles['count']}>
          Showing {advocates.length} result{advocates.length !== 1 ? 's' : ''}
        </span>
        {hasNextPage && <span className={styles['muted']}>More results available</span>}
      </section>

      <br />

      <AdvocatesTable advocates={advocates} />

      <br />
      <div>
        <button className={styles['button']} onClick={handleLoadMore} disabled={!hasNextPage || isLoading || isLoadingMore}>
          {isLoadingMore ? 'Loading…' : hasNextPage ? 'Load more' : 'No more results'}
        </button>
      </div>
    </main>
  );
}

export default Home;
