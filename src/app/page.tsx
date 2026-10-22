import { FeatureLink } from "@/components/FeatureLink";
import { panel } from "@/components/FeaturePage";
import { cx } from "@/components/ui";
import { categories, features } from "@/lib/features";

export default function Home() {
  const ready = features.filter((f) => f.ready).length;
  return (
    <article>
      <header className="mb-6">
        <h1>Motion Feature Lab</h1>
        <p className="m-0 text-[1.05rem] text-muted">
          One page per animation technique (GSAP, Rive and Three.js), each with a live demo and the code behind it. A sibling of
          the <a href="https://vercel.djmiskey.com">Vercel</a> and <a href="https://lab.djmiskey.com">Cloudflare</a> feature labs.{" "}
          {ready} of {features.length} built so far.
        </p>
      </header>
      <section className={cx(panel, "mb-4 [&_li+li]:mt-1.5")}>
        <h2>The three tools</h2>
        <ol>
          <li><strong>GSAP</strong> animates the page itself: any CSS property, SVG or JavaScript value, sequenced on timelines and tied to scrolling.</li>
          <li><strong>Rive</strong> plays interactive vector animations designed in the Rive editor. Designers build the motion and its logic; the app feeds it data.</li>
          <li><strong>Three.js</strong> renders real-time 3D with WebGL. Here it&apos;s used through <strong>react-three-fiber</strong>, which lets a scene be written as React components.</li>
        </ol>
        <p className="mb-0 text-sm text-muted">Every demo respects the motion setting in the sidebar, which follows your system&apos;s &quot;reduce motion&quot; preference by default.</p>
        <p className="mb-0 text-sm text-muted">
          This site measures how it performs for visitors: page load and responsiveness times, JavaScript errors and request
          timings go to Grafana Cloud, tagged with a random id for the browser tab (no cookies, names or accounts), and are shown
          on the <a href="https://obs.djmiskey.com/real-users">Observability lab</a>. Grafana&apos;s servers see your IP address
          when your browser sends them, as any server does.
        </p>
      </section>
      {categories.map((cat) => (
        <section key={cat} className="mt-7">
          <h2>{cat}</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
            {features.filter((f) => f.category === cat).map((f) => (
              <FeatureLink key={f.slug} slug={f.slug} className={cx("flex flex-col gap-1 rounded-xl border border-line bg-surface px-4 py-3.5 text-fg no-underline hover:border-accent", !f.ready && "opacity-70")}>
                <span className="font-semibold">{f.name}</span>
                <span className="text-sm text-muted">{f.summary}</span>
                <span className={cx("self-start rounded-full px-2 py-px text-xs", f.ready ? "bg-accent text-white" : "bg-code text-muted")}>{f.ready ? "Live" : `Phase ${f.phase}`}</span>
              </FeatureLink>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
