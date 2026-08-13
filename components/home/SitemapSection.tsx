import Link from "next/link";

interface SitemapItem {
  label: string;
  href: string;
  note: string;
}

export default function SitemapSection({ data }: { data: SitemapItem[] }) {
  return (
    <section className="section sitemap-section" style={{ background: '#fcfcfc', borderTop: '1px solid #f0f0f0', padding: '80px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="section-heading" style={{ marginBottom: '50px' }}>
          <p className="eyebrow">SITEMAP</p>
          <h2>Complete structure for a modern restaurant website.</h2>
        </div>
        <div className="sitemap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '24px' }}>
          {data.map((item) => (
            <Link href={item.href} key={item.label} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <strong style={{ fontWeight: '500' }}>{item.label}</strong>
              <span style={{ color: '#999', fontSize: '0.8rem' }}>{item.note}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}