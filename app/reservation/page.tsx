import Link from "next/link";
import PageHero from "@/components/PageHero";

const bookingTypes = [
  "Counter tasting",
  "Table dining",
  "Private dining",
  "Anniversary course",
];

export default function ReservationPage() {
  return (
    <main>
      <PageHero
        eyebrow="RESERVATION"
        title="予約"
        copy="Book a seat for tonkatsu courses, seasonal ramen evenings, private dining, or special celebrations."
      />

      <section className="section reservation-layout">
        <form className="reservation-form">
          <label>
            Name
            <input placeholder="Your name" />
          </label>
          <label>
            Date
            <input type="date" />
          </label>
          <label>
            Time
            <input type="time" />
          </label>
          <label>
            Guests
            <input min="1" max="12" type="number" placeholder="2" />
          </label>
          <label>
            Store
            <select defaultValue="Ginza Flagship">
              <option>Ginza Flagship</option>
              <option>Umeda Dining</option>
              <option>Gion Salon</option>
            </select>
          </label>
          <label>
            Notes
            <textarea placeholder="Allergies, occasion, seat preference" />
          </label>
          <button className="button button-primary" type="button">
            Send reservation request
          </button>
        </form>

        <aside className="booking-card" id="private-dining">
          <p className="eyebrow">PRIVATE DINING</p>
          <h2>For celebrations that need a quieter room.</h2>
          <p>
            Our team can arrange seasonal katsu courses, drink pairings,
            message plates, and business dinners with discreet service.
          </p>
          <div className="pill-list">
            {bookingTypes.map((type) => (
              <span key={type}>{type}</span>
            ))}
          </div>
          <Link className="text-link" href="/contact">
            Ask concierge
          </Link>
        </aside>
      </section>
    </main>
  );
}
