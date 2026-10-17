import Link from "next/link";
import { categories, features } from "@/lib/features";

export default function Home() {
  const ready = features.filter((f) => f.ready).length;
  return (
    <article>
      <header className="feature-head">
        <h1>Motion Feature Lab</h1>
        <p className="tagline">
          One page per animation technique (GSAP, Rive and Three.js), each with a live demo and the code behind it. A sibling of
          the <a href="https://vercel.djmiskey.com">Vercel</a> and <a href="https://lab.djmiskey.com">Cloudflare</a> feature labs.{" "}
          {ready} of {features.length} built so far.
        </p>
      </header>
      <section className="how">
        <h2>The three tools</h2>
        <ol>
          <li><strong>GSAP</strong> animates the page itself: any CSS property, SVG or JavaScript value, sequenced on timelines and tied to scrolling.</li>
          <li><strong>Rive</strong> plays interactive vector animations designed in the Rive editor. Designers build the motion and its logic; the app feeds it data.</li>
          <li><strong>Three.js</strong> renders real-time 3D with WebGL. Here it&apos;s used through <strong>react-three-fiber</strong>, which lets a scene be written as React components.</li>
        </ol>
        <p className="small muted">Every demo respects the motion setting in the sidebar, which follows your system&apos;s &quot;reduce motion&quot; preference by default.</p>
      </section>
      {categories.map((cat) => (
        <section key={cat} className="grid-section">
          <h2>{cat}</h2>
          <div className="grid">
            {features.filter((f) => f.category === cat).map((f) => (
              <Link key={f.slug} href={`/${f.slug}`} className={`tile${f.ready ? "" : " pending"}`}>
                <span className="tile-name">{f.name}</span>
                <span className="tile-sum">{f.summary}</span>
                <span className="badge">{f.ready ? "Live" : `Phase ${f.phase}`}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
