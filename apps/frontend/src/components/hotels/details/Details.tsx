import type { CSSProperties } from 'react';
import { BedDouble, Bath, Users } from 'lucide-react';

type DetailsProps = {
  beds?: number;
  baths?: number;
  capacity?: number;
  description: string;
};

const styles = {
  wrap: { display: 'grid', gap: '1rem' } satisfies CSSProperties,
  pills: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const } satisfies CSSProperties,
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
    padding: '0.3rem 0.75rem', borderRadius: '9999px',
    backgroundColor: '#fff7ed', border: '1px solid #fed7aa',
    color: '#92400e', fontSize: '0.8rem', fontWeight: 600,
  } satisfies CSSProperties,
  desc: { margin: 0, color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 } satisfies CSSProperties,
} as const;

export default function Details({ beds, baths, capacity, description }: DetailsProps) {
  return (
    <div style={styles.wrap}>
      {(beds !== undefined || baths !== undefined || capacity !== undefined) && (
        <div style={styles.pills}>
          {beds !== undefined && (
            <span style={styles.pill}><BedDouble size={13} strokeWidth={2} />{beds} bd</span>
          )}
          {baths !== undefined && (
            <span style={styles.pill}><Bath size={13} strokeWidth={2} />{baths} ba</span>
          )}
          {capacity !== undefined && (
            <span style={styles.pill}><Users size={13} strokeWidth={2} />Sleeps {capacity}</span>
          )}
        </div>
      )}
      <p style={styles.desc}>{description}</p>
    </div>
  );
}
