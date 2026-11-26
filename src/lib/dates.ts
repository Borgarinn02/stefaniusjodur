const fmt = new Intl.DateTimeFormat('is-IS', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

/** "6. desember 2026" */
export const formatDate = (d: Date) => fmt.format(d);

/** Machine-readable date for <time datetime> */
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
