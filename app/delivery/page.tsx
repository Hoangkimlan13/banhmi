import Link from "next/link";
import PageHero from "@/components/PageHero";

const deliveryItems = [
  "Katsu sando set",
  "Rosu katsu bento",
  "Hire katsu bento",
  "Seasonal ramen kit",
  "Family side menu box",
];

export default function DeliveryPage() {
  return (
    <main>
      <PageHero
        eyebrow="DELIVERY"
        title="デリバリー"
        copy="Order crisp tonkatsu bento, katsu sando, ramen kits, and drinks for home, office, or hotel dining."
      />

      <section className="section delivery-panel">
        <div>
          <p className="eyebrow">ORDER OPTIONS</p>
          <h2>Elegant delivery, packed to keep texture intact.</h2>
          <p>
            Sauces, cabbage, rice, and cutlets are packed separately when needed
            so each bite arrives balanced.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/menu">
              Choose menu
            </Link>
            <Link className="button button-secondary" href="/contact">
              Corporate order
            </Link>
          </div>
        </div>
        <div className="pill-list vertical">
          {deliveryItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
