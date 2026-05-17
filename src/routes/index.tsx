import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkflowShowcase } from "@/components/WorkflowShowcase";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <section className="about">
      <div className="about__hero">
        <div className="about__badge">
          <span>Data intelligence</span>
        </div>
        <h1 className="about__title">
          Building insights,{" "}
          <span className="about__titleAccent">with your data</span>
        </h1>
        <p className="about__lead">
          Upload your data. Get instant cleaning, analytics, and AI insights — zero code required.
        </p>
        <div className="cta-row" style={{ marginTop: "1.5rem" }}>
          <Link to="/upload" className="btn btn--primary">Get started</Link>
          <Link to="/dashboard" className="btn btn--ghost">Open dashboard</Link>
        </div>
      </div>

      <WorkflowShowcase />

      <div className="about__grid">
        <article className="about__card about__card--story">
          <div className="about__cardHeader">
            <span className="kicker">Story</span>
            <h2 className="h2">How it works</h2>
          </div>
          <div className="about__story">
            <p>Drop a CSV or Excel file and AutoInsight cleans empty rows, strips duplicates, and profiles every column in seconds — all in your browser.</p>
            <p>Explore interactive tables with conditional formatting, build charts with drill-down filters, and export polished snapshots when you need to share results.</p>
            <p>Ask questions in plain English. Our AI assistant uses full-dataset statistics so answers reflect your complete file, not just a sample.</p>
          </div>
        </article>

        <article className="about__card about__card--skills">
          <div className="about__cardHeader">
            <span className="kicker">Skills</span>
            <h2 className="h2">Capabilities</h2>
          </div>
          <p>The platform combines client-side parsing, cloud sync for your uploads, and Groq-powered analysis — fast, private, and built for real datasets.</p>
          <div className="about__skillsGrid">
            <div className="about__skillGroup">
              <h3 className="about__skillTitle">Ingest</h3>
              <div className="about__skillTags">
                {["CSV", "XLSX", "XLS", "Cloud sync"].map((t) => <span key={t} className="pill">{t}</span>)}
              </div>
            </div>
            <div className="about__skillGroup">
              <h3 className="about__skillTitle">Analyze</h3>
              <div className="about__skillTags">
                {["Tables", "Charts", "KPIs", "Drill-down"].map((t) => <span key={t} className="pill">{t}</span>)}
              </div>
            </div>
            <div className="about__skillGroup">
              <h3 className="about__skillTitle">AI</h3>
              <div className="about__skillTags">
                {["Chat", "Dashboard", "PDF export", "Groq"].map((t) => <span key={t} className="pill">{t}</span>)}
              </div>
            </div>
          </div>
        </article>

        <article className="about__card about__card--values">
          <div className="about__cardHeader">
            <span className="kicker">Values</span>
            <h2 className="h2">What drives the product</h2>
          </div>
          <ul className="about__valuesList">
            <li>
              <span className="about__valueIcon">⚡</span>
              <div>
                <strong>Speed</strong>
                <p className="muted">Client-side processing keeps uploads and cleaning under two seconds for most files.</p>
              </div>
            </li>
            <li>
              <span className="about__valueIcon">🛡</span>
              <div>
                <strong>Privacy</strong>
                <p className="muted">Analysis runs locally; your raw data never leaves the browser unless you choose cloud sync.</p>
              </div>
            </li>
            <li>
              <span className="about__valueIcon">✦</span>
              <div>
                <strong>AI-native</strong>
                <p className="muted">Natural language Q&A and automated reports powered by modern LLMs.</p>
              </div>
            </li>
          </ul>
        </article>

        <article className="about__card about__card--current">
          <div className="about__cardHeader">
            <span className="kicker">Currently</span>
            <h2 className="h2">What you can do today</h2>
          </div>
          <div className="about__currentList">
            {[
              { title: "Upload & clean", desc: "Parse, dedupe, and quality-report any spreadsheet." },
              { title: "Visualize & explore", desc: "Line, pie, and scatter charts with filters." },
              { title: "Chat with data", desc: "Ask questions and get answers grounded in your dataset." },
            ].map(({ title, desc }) => (
              <div key={title} className="about__currentItem">
                <span className="about__currentDot" />
                <div>
                  <strong>{title}</strong>
                  <p className="muted">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <section className="about__cta">
        <div className="about__ctaInner">
          <h2 className="h2">Ready to analyze your data?</h2>
          <p className="muted">Upload a file and start exploring in minutes.</p>
          <div className="cta-row">
            <Link to="/upload" className="btn btn--primary">Get in touch</Link>
            <Link to="/analytics" className="btn btn--ghost">View analytics</Link>
          </div>
        </div>
      </section>
    </section>
  );
}
