// components/product-detail/ProductAllergens.tsx
"use client";

interface ProductAllergensProps {
  allergens: any[];
  locale: string;
  showAllergens: boolean;
  onToggle: () => void;
  label: string;          
  subtitle?: string;       
}

export default function ProductAllergens({
  allergens,
  locale,
  showAllergens,
  onToggle,
  label,
  subtitle,
}: ProductAllergensProps) {
  if (!Array.isArray(allergens) || allergens.length === 0) return null;

  return (
    <section
      className={`modal-allergens-section ${showAllergens ? "is-open" : ""}`}
    >
      <button
        type="button"
        className="allergens-toggle"
        onClick={onToggle}
        aria-expanded={showAllergens}
      >
        <span className="allergens-toggle-left">
          <span className="allergens-icon-wrap">
            <svg
              className="allergens-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9.5" />
              <path d="M12 7.5v5" />
              <circle
                cx="12"
                cy="16.5"
                r=".7"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </span>
          <span className="allergens-title-wrap">
            <span className="allergens-title">{label}</span>
            {subtitle && (
              <span className="allergens-subtitle">{subtitle}</span>
            )}
          </span>
        </span>
        <span
          className={`allergens-chevron ${showAllergens ? "open" : ""}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <div className={`allergens-content ${showAllergens ? "open" : ""}`}>
        <div className="allergen-list">
          {allergens.map((allergen: any) => {
            const allergenName =
              locale === "ja"
                ? allergen.name_ja || allergen.name_vi || allergen.name_en
                : locale === "en"
                ? allergen.name_en || allergen.name_vi || allergen.name_ja
                : locale === "zh"
                ? allergen.name_zh || allergen.name_vi || allergen.name_en
                : allergen.name_vi || allergen.name_ja || allergen.name_en;

            return (
              <span key={allergen.id} className="allergen-badge">
                <svg
                  className="allergen-badge-icon"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 3v18" />
                  <path d="M5.5 7.5c2.2 0 4.2 1 6.5 3" />
                  <path d="M18.5 7.5c-2.2 0-4.2 1-6.5 3" />
                  <path d="M5.5 16.5c2.2 0 4.2-1 6.5-3" />
                  <path d="M18.5 16.5c-2.2 0-4.2-1-6.5-3" />
                </svg>
                <span>{allergenName}</span>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}