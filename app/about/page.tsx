import PageHero from "@/components/PageHero";

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="ABOUT"
        title="About にいむら"
        copy="A modern tonkatsu house built around restraint: excellent pork, precise frying, calm rooms, and honest hospitality."
      />

      <section className="section story-section" id="craft">
        <div>
          <p className="eyebrow">OUR CRAFT</p>
          <h2>Every detail protects the crunch.</h2>
        </div>
        <div className="story-grid">
          <article>
            <h3>Pork</h3>
            <p>Selected from partner farms and aged for natural sweetness.</p>
          </article>
          <article>
            <h3>Panko</h3>
            <p>Fresh bread crumbs with a light, irregular texture.</p>
          </article>
          <article>
            <h3>Oil</h3>
            <p>Managed in small batches for aroma, clarity, and finish.</p>
          </article>
          <article>
            <h3>Room</h3>
            <p>Warm wood, low light, and service that stays attentive.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
