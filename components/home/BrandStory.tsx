import Link from "next/link";
import styles from "./BrandStory.module.css";
import { localizePath, type Locale } from "@/app/i18n";
import { brandDictionary } from "@/app/data/brand";

interface BrandStoryProps {
  locale: Locale;
}

export default function BrandStory({ locale }: BrandStoryProps) {
  const t = brandDictionary[locale] || brandDictionary.ja;

  return (
    <section className={styles.brandStorySection}>
      <div className={styles.container}>
        
        <div className={styles.introGrid}>
          <div className={styles.headingBlock}>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            {/* Thêm pre-line để nhận diện dấu \n từ file .ts */}
            <h2 className={styles.mainTitle} style={{ whiteSpace: "pre-line" }}>
              {t.mainTitle}
            </h2>
          </div>
          <div className={styles.introContent}>
            {/* Thêm pre-line để các đoạn văn tự động ngắt dòng đẹp đẽ */}
            <p className={styles.jpPhilosophy} style={{ whiteSpace: "pre-line" }}>
              {t.philosophy}
            </p>
            <div className={styles.linkWrapper}>
              <Link className={styles.luxuryButton} href={localizePath("/about", locale)}>
                <span className={styles.buttonText}>{t.buttonText}</span>
                <span className={styles.arrowIcon}>
                  <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1 L17 6 M17 6 L12 11 M17 6 H1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.featureBand} id="craft">
          {[
            { id: "01", title: t.f1Title, desc: t.f1Desc },
            { id: "02", title: t.f2Title, desc: t.f2Desc },
            { id: "03", title: t.f3Title, desc: t.f3Desc }
          ].map((item) => (
            <article key={item.id} className={styles.featureCard}>
              <div className={styles.cardHeader}>
                <span className={styles.cardNumber}>{item.id}</span>
                <h3 className={styles.cardTitle}>{item.title}</h3>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.jpSub}>{item.desc}</p>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}