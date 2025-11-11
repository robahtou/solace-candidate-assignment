'use client';

import type { AdvocateFilters } from '@Hooks/useAdvocatesSearch';

import { useMemo, useState }    from 'react';
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
    page,
    pageInfo,
    isLoading,
    error,
    goToPage,
    nextPage,
    prevPage
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

  // Derive human-readable "X–Y of Z" range for the summary.
  const rangeText = useMemo(() => {
    if (!pageInfo) return '';
    const start = pageInfo.totalCount === 0 ? 0 : (pageInfo.page - 1) * pageInfo.pageSize + 1;
    const end = start + advocates.length - 1;
    return `${start}-${end} of ${pageInfo.totalCount}`;
  }, [pageInfo, advocates.length]);

  // Compact pagination (1 … N-1 N N+1 … T) with ellipses where needed.
  const visiblePages = useMemo(() => {
    if (!pageInfo) return [];
    const total = pageInfo.totalPages;
    const current = pageInfo.page;
    const siblingCount = 1;

    const pages: (number | 'ellipsis')[] = [];
    const add = (p: number | 'ellipsis') => pages.push(p);

    const left = Math.max(2, current - siblingCount);
    const right = Math.min(total - 1, current + siblingCount);

    add(1);
    if (left > 2) add('ellipsis');
    for (let p = left; p <= right; p++) add(p);
    if (right < total - 1) add('ellipsis');
    if (total > 1) add(total);

    // De-duplicate
    const dedup: (number | 'ellipsis')[] = [];
    for (const p of pages) {
      if (p === 'ellipsis') {
        if (dedup[dedup.length - 1] !== 'ellipsis') dedup.push('ellipsis');
      } else {
        if (!dedup.includes(p)) dedup.push(p);
      }
    }
    return dedup;
  }, [pageInfo]);

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
          {pageInfo ? `Showing ${rangeText}` : `Showing ${advocates.length} result${advocates.length !== 1 ? 's' : ''}`}
        </span>
        {pageInfo && pageInfo.totalPages > 1 && (
          <span className={styles['muted']}>
            Page {pageInfo.page} of {pageInfo.totalPages}
          </span>
        )}
      </section>

      <br />

      <AdvocatesTable advocates={advocates} />

      <br />
      {pageInfo && pageInfo.totalPages > 1 && (
        <nav className={styles['pagination']} aria-label="Pagination">
          <button
            className={styles['page-button']}
            onClick={prevPage}
            disabled={!pageInfo.hasPrevPage || isLoading}
            aria-label="Previous page"
          >
            Prev
          </button>

          {visiblePages.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span key={`ellipsis-${idx}`} className={styles['page-ellipsis']} aria-hidden="true">
                  …
                </span>
              );
            }
            const isActive = p === page;
            return (
              <button
                key={p}
                className={[styles['page-button'], isActive ? styles['page-button-active'] : ''].filter(Boolean).join(' ')}
                onClick={() => goToPage(p)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${p}`}
                disabled={isLoading}
              >
                {p}
              </button>
            );
          })}

          <button
            className={styles['page-button']}
            onClick={nextPage}
            disabled={!pageInfo.hasNextPage || isLoading}
            aria-label="Next page"
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}

export default Home;
