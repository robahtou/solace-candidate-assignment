import type { ChangeEvent } from 'react';
import styles from '@/app/styles.module.css';
import type { AdvocateFilters } from '@/hooks/useAdvocatesSearch';


// Presentational filter controls; controlled by parent via props.
type Props = {
  filters: AdvocateFilters;
  onChange: (patch: Partial<AdvocateFilters>) => void;
  onReset: () => void;
  disabled?: boolean;
};

export function AdvocatesFilters({ filters, onChange, onReset, disabled }: Props) {
  const handle = (key: keyof AdvocateFilters) => (e: ChangeEvent<HTMLInputElement>) => {
    onChange({ [key]: e.target.value });
  };

  return (
    <section className={styles['filters']}>
      <div className={styles['filters-row']}>
        <div className={styles['field']}>
          <label className={styles['label']} htmlFor="q">Search</label>
          <input
            id="q"
            className={styles['input']}
            value={filters.q}
            onChange={handle('q')}
            placeholder="Type name, city, degree, or specialty"
          />
        </div>
        <div className={styles['field']}>
          <label className={styles['label']} htmlFor="city">City</label>
          <input
            id="city"
            className={styles['input']}
            value={filters.city}
            onChange={handle('city')}
            placeholder="e.g. Austin"
          />
        </div>
        <div className={styles['field']}>
          <label className={styles['label']} htmlFor="degree">Degree</label>
          <input
            id="degree"
            className={styles['input']}
            value={filters.degree}
            onChange={handle('degree')}
            placeholder="e.g. PhD"
          />
        </div>
        <div className={styles['field']}>
          <label className={styles['label']} htmlFor="specialty">Specialty</label>
          <input
            id="specialty"
            className={styles['input']}
            value={filters.specialty}
            onChange={handle('specialty')}
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
            value={filters.minYears}
            onChange={handle('minYears')}
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
            value={filters.maxYears}
            onChange={handle('maxYears')}
            placeholder="e.g. 12"
          />
        </div>
        <div className={styles['actions']}>
          <button className={styles['button']} onClick={onReset} disabled={disabled}>
            Reset Filters
          </button>
        </div>
      </div>
    </section>
  );
}
