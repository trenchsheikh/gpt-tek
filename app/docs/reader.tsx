"use client";
import { appUrl, docsUrl, websiteUrl, docsLink } from "@/lib/site-urls";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Search,
} from "lucide-react";
import type { DocPage } from "@/lib/documentation";
import { SiteControls, XLink } from "../site-controls";
import styles from "./docs.module.css";

export default function DocsReader({
  page,
  pages,
}: {
  page: DocPage;
  pages: DocPage[];
}) {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const query = search.trim().toLowerCase();
  const results = pages.filter((item) =>
    [
      item.title,
      item.description,
      ...item.sections.map(
        (s) =>
          s.title +
          " " +
          (s.paragraphs || []).join(" ") +
          " " +
          (s.steps || []).join(" ") +
          " " +
          (s.table?.rows || []).flat().join(" "),
      ),
    ]
      .join(" ")
      .toLowerCase()
      .includes(query),
  );
  const index = pages.findIndex((item) => item.slug === page.slug);
  const groups = Array.from(new Set(pages.map((item) => item.group)));
  const href = (slug: string) => docsLink(slug);

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href={websiteUrl} className={styles.brand}>
          <img src="/avelis-logo.png" alt="" />
          <span>
            AgentRouter <small>Docs</small>
          </span>
        </Link>
        <label className={styles.search}>
          <Search size={16} />
          <input
            aria-label="Search documentation"
            placeholder="Search documentation…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <div className={styles.headerLinks}>
          <SiteControls />
          <Link href={websiteUrl}>Website</Link>
          <Link href={appUrl} className={styles.launch}>
            Open app <ArrowUpRight size={14} />
          </Link>
        </div>
      </header>
      {query && (
        <section
          className={styles.searchResults}
          aria-label="Documentation search results"
        >
          <div>
            <strong>
              {results.length} results for “{search}”
            </strong>
            <button onClick={() => setSearch("")}>Clear search</button>
          </div>
          {results.map((item) => (
            <Link
              key={item.slug}
              href={href(item.slug)}
              onClick={() => setSearch("")}
            >
              <BookOpen size={16} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <ArrowRight size={15} />
            </Link>
          ))}
          {!results.length && (
            <p>
              No matching documentation. Try “routing”, “wallet” or “rentals”.
            </p>
          )}
        </section>
      )}
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <details open className={styles.navigation}>
            <summary>Documentation navigation</summary>
            <nav aria-label="Documentation">
              {groups.map((group) => (
                <div key={group}>
                  <p>{group}</p>
                  {pages
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <Link
                        href={href(item.slug)}
                        key={item.slug}
                        className={
                          item.slug === page.slug ? styles.active : undefined
                        }
                        aria-current={
                          item.slug === page.slug ? "page" : undefined
                        }
                      >
                        {item.title}
                      </Link>
                    ))}
                </div>
              ))}
            </nav>
          </details>
          <div className={styles.sidebarNote}>
            <img src="/providers/openrouter-lime.png" alt="" />
            <span>
              Model access through
              <br />
              <strong>OpenRouter</strong>
            </span>
          </div>
        </aside>
        <main id="docs-content" className={styles.article}>
          <div className={styles.breadcrumb}>
            <BookOpen size={14} /> {page.group} <span>/</span> {page.title}
          </div>
          <h1>{page.title}</h1>
          <p className={styles.description}>{page.description}</p>
          {page.slug === "overview" && (
            <div className={styles.startLinks}>
              <Link href={docsLink("quickstart")}>
                <strong>Build your first agent</strong>
                <span>
                  Follow the guided setup <ArrowRight size={15} />
                </span>
              </Link>
              <Link href={docsLink("architecture")}>
                <strong>Understand the system</strong>
                <span>
                  Explore the technical architecture <ArrowRight size={15} />
                </span>
              </Link>
            </div>
          )}
          {page.sections.map((section) => (
            <section
              id={section.id}
              key={section.id}
              className={styles.section}
            >
              <h2>
                <a href={"#" + section.id}>{section.title}</a>
              </h2>
              {section.paragraphs?.map((text, n) => (
                <p key={n}>{text}</p>
              ))}
              {section.steps && (
                <ol>
                  {section.steps.map((text, n) => (
                    <li key={n}>{text}</li>
                  ))}
                </ol>
              )}
              {section.table && (
                <div className={styles.tableWrap}>
                  <table>
                    <thead>
                      <tr>
                        {section.table.headers.map((label) => (
                          <th key={label} scope="col">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, n) => (
                        <tr key={n}>
                          {row.map((cell, k) => (
                            <td key={k}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {section.code && (
                <div className={styles.code}>
                  <div>
                    <span>HTTP / JSON</span>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(section.code!);
                          setCopied(true);
                        } catch {
                          setCopied(false);
                        }
                      }}
                      aria-label="Copy request example"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <pre>
                    <code>{section.code}</code>
                  </pre>
                </div>
              )}
              {section.note && (
                <aside className={styles.note}>
                  <strong>Keep in mind</strong>
                  <p>{section.note}</p>
                </aside>
              )}
              {section.link && (
                <a
                  className={styles.reference}
                  href={section.link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {section.link.label}
                  <ArrowUpRight size={14} />
                </a>
              )}
            </section>
          ))}
          <nav
            className={styles.pageNav}
            aria-label="Previous and next documentation pages"
          >
            {pages[index - 1] ? (
              <Link href={href(pages[index - 1].slug)}>
                <small>
                  <ArrowLeft size={13} /> Previous
                </small>
                <strong>{pages[index - 1].title}</strong>
              </Link>
            ) : (
              <span />
            )}
            {pages[index + 1] && (
              <Link href={href(pages[index + 1].slug)}>
                <small>
                  Next <ArrowRight size={13} />
                </small>
                <strong>{pages[index + 1].title}</strong>
              </Link>
            )}
          </nav>
          <footer className={styles.footer}>
            <XLink />
            AgentRouter documentation{" "}
            <span>Strategy. Models. Execution boundaries.</span>
          </footer>
        </main>
        <aside className={styles.toc}>
          <strong>On this page</strong>
          <nav aria-label="On this page">
            {page.sections.map((section) => (
              <a href={"#" + section.id} key={section.id}>
                {section.title}
              </a>
            ))}
          </nav>
          <Link href={appUrl}>
            Start building <ArrowUpRight size={14} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
