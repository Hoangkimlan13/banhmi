import PageHero from "@/components/PageHero";

export default function ContactPage() {
  return (
    <main>
      <PageHero
        eyebrow="CONTACT"
        title="Contact"
        copy="For reservations, delivery support, allergies, press, careers, and private dining requests."
      />

      <section className="section reservation-layout">
        <form className="reservation-form">
          <label>
            Name
            <input placeholder="Your name" />
          </label>
          <label>
            Email
            <input placeholder="you@example.com" type="email" />
          </label>
          <label>
            Topic
            <select defaultValue="Reservation">
              <option>Reservation</option>
              <option>Delivery</option>
              <option>Private dining</option>
              <option>Press</option>
              <option>Careers</option>
            </select>
          </label>
          <label>
            Message
            <textarea placeholder="How can we help?" />
          </label>
          <button className="button button-primary" type="button">
            Send message
          </button>
        </form>
        <aside className="booking-card">
          <p className="eyebrow">GUEST SUPPORT</p>
          <h2>guest@niimura.jp</h2>
          <p>+81 3 0000 1129</p>
          <p>Response hours: 10:00-20:00 JST</p>
        </aside>
      </section>
    </main>
  );
}
