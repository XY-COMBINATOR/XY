/**
 * XY COMBINATOR — Kinetic Editorial page.
 * Asymmetric editorial lanes, Space Grotesk display type, signal-red motion and a paper/ink material system.
 */
import { useEffect, useState } from "react";
import { xyOsEnabled } from "@/lib/featureFlags";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { assetUrl } from "@/lib/assets";
import { ProjectsArchive } from "@/components/ProjectsArchive";
import {
  ArrowDownRight,
  ArrowUpRight,
  Asterisk,
  ChevronDown,
  Menu,
  Minus,
  Plus,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

const team = [
  {
    id: "01",
    role: "The maker",
    name: "PIVOT",
    focus: "Builds the unexpected bridge between an idea and a working thing.",
    tags: ["Code", "Kinetic"],
    tone: "ember",
  },
  {
    id: "02",
    role: "The organizer",
    name: "FRAME",
    focus: "Turns a loud set of possibilities into one calm, usable route.",
    tags: ["Flow", "Logic"],
    tone: "graphite",
  },
  {
    id: "03",
    role: "The connector",
    name: "TRACE",
    focus:
      "Finds the invisible patterns that let complex systems speak plainly.",
    tags: ["Systems", "Signal"],
    tone: "cobalt",
  },
  {
    id: "04",
    role: "The storyteller",
    name: "VIVID",
    focus: "Gives each direction a visual pulse that is hard to forget.",
    tags: ["Image", "Voice"],
    tone: "cream",
  },
] as const;

const capabilities = [
  [
    "01",
    "IDENTITIES",
    "Names, systems, and visual languages with a point of view.",
  ],
  [
    "02",
    "INTERFACES",
    "Digital experiences that make complexity feel inevitable.",
  ],
  [
    "03",
    "MOTION",
    "Movement with a job: clarity, energy, and a sense of arrival.",
  ],
  [
    "04",
    "PRODUCTS",
    "Practical tools made with editorial sharpness and engineering care.",
  ],
] as const;

function ScrollLink({
  href,
  children,
  className = "",
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <a
      className={className}
      href={href}
      onClick={event => {
        onClick?.();
        const target = document.querySelector(href);
        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }}
    >
      {children}
    </a>
  );
}

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeMember, setActiveMember] = useState("01");
  const [isSoundOn, setIsSoundOn] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 28);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const rise = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 26 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className={`xy-site ${isSoundOn ? "is-live" : ""}`}>
      <div className="grain" aria-hidden="true" />
      <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <ScrollLink
          href="#top"
          className="brand-lockup"
          aria-label="XY COMBINATOR home"
        >
          <span className="brand-mark-shell" aria-hidden="true">
            <img
              src={assetUrl(
                "/manus-storage/xy-combinator-brand-mark_8b6de4c4.png"
              )}
              alt=""
              className="brand-mark"
            />
            <i />
          </span>
          <span className="brand-wordmark">
            <b>XY</b>
            <b>COMBINATOR</b>
          </span>
        </ScrollLink>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/collective">Collective</Link>
          <Link href="/people">People</Link>
          {xyOsEnabled && <Link href="/projects">Projects</Link>}
          <Link href="/capabilities">Capabilities</Link>
          <Link href="/dashboard">Team access</Link>
        </nav>

        <div className="header-actions">
          <button
            className="sound-button"
            type="button"
            onClick={() => setIsSoundOn(value => !value)}
            aria-label={
              isSoundOn
                ? "Disable ambient animation"
                : "Enable ambient animation"
            }
          >
            {isSoundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isSoundOn ? "ON" : "OFF"}</span>
          </button>
          <button
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen(value => !value)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={25} /> : <Menu size={25} />}
            <span className="sr-only">Toggle navigation menu</span>
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`mobile-menu ${menuOpen ? "is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <span className="menu-index">NAV / 01—03</span>
        {[
          ["About", "#about"],
          ["People", "#team"],
          ["Projects", "/projects"],
          ["Capabilities", "#capabilities"],
          ["Team access", "/dashboard"],
        ]
          .filter(([, href]) => xyOsEnabled || href !== "/projects")
          .map(([label, href]) =>
            href.startsWith("#") ? (
              <ScrollLink
                key={label}
                href={href}
                className="mobile-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                {label}
                <ArrowUpRight size={24} />
              </ScrollLink>
            ) : (
              <Link
                key={label}
                href={href}
                className="mobile-menu-link"
                onClick={() => setMenuOpen(false)}
              >
                {label}
                <ArrowUpRight size={24} />
              </Link>
            )
          )}
      </div>

      <main id="top">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-side-index">01 — ORIGIN</div>
          <motion.div
            className="hero-copy"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: prefersReducedMotion ? 0 : 0.11,
                },
              },
            }}
          >
            <motion.p className="eyebrow light" variants={rise}>
              INDEPENDENT CREATIVE COLLECTIVE <Asterisk size={13} />
            </motion.p>
            <h1 id="hero-heading">
              <motion.span variants={rise}>DIFFERENT</motion.span>
              <motion.span variants={rise} className="hero-word-shift">
                COORDINATES.
              </motion.span>
              <motion.span variants={rise} className="hero-accent">
                ONE DIRECTION.
              </motion.span>
            </h1>
            <motion.div variants={rise} className="hero-bottom-line">
              <p>
                We combine four perspectives to make work that moves culture and
                business forward.
              </p>
              <Link
                href="/collective"
                className="circle-arrow"
                aria-label="Explore XY COMBINATOR"
              >
                <ArrowDownRight size={25} />
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-orbit-wrap"
            initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.9,
              delay: 0.15,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            <img
              src={assetUrl(
                "/manus-storage/xy-combinator-brand-mark_8b6de4c4.png"
              )}
              alt="XY COMBINATOR original red and black team artwork"
              className="hero-orbit"
            />
            <span className="orbit-caption top">X / 41.19</span>
            <span className="orbit-caption bottom">Y / 02.04</span>
            <span className="orbit-pulse" aria-hidden="true" />
          </motion.div>

          <div className="hero-footnote">
            SCROLL TO COMBINE <ChevronDown size={16} />
          </div>
        </section>

        <section className="ticker" aria-label="XY COMBINATOR focus areas">
          <div className="ticker-track">
            {[
              "IDENTITY",
              "INTERACTION",
              "CULTURE",
              "PRODUCT",
              "IDENTITY",
              "INTERACTION",
              "CULTURE",
              "PRODUCT",
            ].map((item, index) => (
              <span key={`${item}-${index}`}>
                {item}
                <b>×</b>
              </span>
            ))}
          </div>
        </section>

        <section
          id="about"
          className="about-section section-pad"
          aria-labelledby="about-heading"
        >
          <motion.div
            className="section-label"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={rise}
          >
            <span>02</span>
            <Minus size={16} />
            <span>WHY WE COMBINE</span>
          </motion.div>
          <div className="about-layout">
            <motion.div
              className="about-statement"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: prefersReducedMotion ? 0 : 0.08,
                  },
                },
              }}
            >
              <motion.h2 variants={rise}>
                Good work doesn’t come from a single point of view.
              </motion.h2>
              <motion.div className="about-copy" variants={rise}>
                <p>
                  XY COMBINATOR is a four-person practice where design,
                  technology, strategy, and visual culture meet in the same
                  room.
                </p>
                <p>
                  We work with the friction between disciplines—because the
                  unexpected combinations are usually where the interesting
                  things begin.
                </p>
                <Link href="/collective" className="text-link">
                  Read our point of view <ArrowDownRight size={18} />
                </Link>
              </motion.div>
            </motion.div>
            <motion.figure
              className="about-art"
              initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
            >
              <img
                src={assetUrl(
                  "/manus-storage/xy-editorial-surface_fdafb998.png"
                )}
                alt="Abstract editorial surface with a coordinate grid and signal markings"
              />
              <figcaption>
                <span>UNLIKELY PAIRS / USEFUL TENSION</span>
                <span>2026</span>
              </figcaption>
            </motion.figure>
          </div>
        </section>

        <section
          id="team"
          className="team-section section-pad"
          aria-labelledby="team-heading"
        >
          <div className="team-header">
            <motion.div
              className="section-label light"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={rise}
            >
              <span>03</span>
              <Minus size={16} />
              <span>THE FOUR</span>
            </motion.div>
            <motion.h2
              id="team-heading"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={rise}
            >
              ONE TEAM.
              <br />
              <i>FOUR FORCES.</i>
            </motion.h2>
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={rise}
            >
              Four codenames, four instincts. Visit People to see the mix
              change.
            </motion.p>
          </div>

          <div className="team-panel">
            <div className="team-axis" aria-hidden="true">
              <span>X</span>
              <span>Y</span>
              <b />
            </div>
            <div className="team-cards">
              {team.map((member, index) => {
                const active = member.id === activeMember;
                return (
                  <motion.button
                    key={member.id}
                    type="button"
                    className={`team-card ${member.tone} ${active ? "is-active" : ""}`}
                    onMouseEnter={() => setActiveMember(member.id)}
                    onFocus={() => setActiveMember(member.id)}
                    onClick={() => setActiveMember(member.id)}
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.45,
                      delay: prefersReducedMotion ? 0 : index * 0.08,
                      ease: [0.23, 1, 0.32, 1],
                    }}
                    aria-pressed={active}
                  >
                    <span className="member-number">{member.id}</span>
                    <span className="member-graphic" aria-hidden="true">
                      <span />
                      <span />
                    </span>
                    <span className="member-role">{member.role}</span>
                    <span className="member-name">{member.name}</span>
                    <span className="member-plus">
                      {active ? <Minus size={18} /> : <Plus size={18} />}
                    </span>
                    <span className="member-detail">
                      {member.focus}
                      <em>{member.tags.join("  /  ")}</em>
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <div className="team-summary" aria-live="polite">
              <img
                src={assetUrl("/manus-storage/xy-team-field_bc07f035.png")}
                alt="Four abstract forms in a shared visual system"
              />
              <p>
                <span>
                  ACTIVE COORDINATE /{" "}
                  {team.find(member => member.id === activeMember)?.name}
                </span>
                {team.find(member => member.id === activeMember)?.focus}
              </p>
            </div>
          </div>
        </section>

        <ProjectsArchive />

        <section
          id="capabilities"
          className="capabilities section-pad"
          aria-labelledby="capabilities-heading"
        >
          <div className="capabilities-intro">
            <motion.div
              className="section-label"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={rise}
            >
              <span>04</span>
              <Minus size={16} />
              <span>WHAT WE MAKE</span>
            </motion.div>
            <motion.h2
              id="capabilities-heading"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={rise}
            >
              Clarity with
              <br />
              <i>some voltage.</i>
            </motion.h2>
          </div>
          <div className="capability-list">
            {capabilities.map(([number, title, description], index) => (
              <motion.article
                key={number}
                className="capability"
                initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.45,
                  delay: prefersReducedMotion ? 0 : index * 0.06,
                }}
              >
                <span className="capability-number">{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <ArrowUpRight size={21} className="capability-arrow" />
              </motion.article>
            ))}
          </div>
        </section>

        <section className="signal-section" aria-labelledby="signal-heading">
          <motion.div
            className="signal-image"
            initial={{
              clipPath: prefersReducedMotion
                ? "inset(0 0 0 0)"
                : "inset(0 100% 0 0)",
            }}
            whileInView={{ clipPath: "inset(0 0 0 0)" }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 1.05, ease: [0.77, 0, 0.175, 1] }}
          >
            <img
              src={assetUrl("/manus-storage/xy-signal-ribbon_df13d9c0.png")}
              alt="A red ribbon moving through a dark field of coordinates"
            />
          </motion.div>
          <div className="signal-content">
            <span className="eyebrow light">THE NEXT SIGNAL</span>
            <h2 id="signal-heading">Have a complex thing to make clear?</h2>
            <Link className="signal-cta" href="/contact">
              Start the conversation <ArrowUpRight size={21} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <span>XY COMBINATOR</span>
          <span>ANYWHERE / EVERYWHERE</span>
          <span>© 2026</span>
        </div>
        <div className="footer-bottom">
          <p>Four points. One trajectory.</p>
          <a href="mailto:hello@xycombinator.com">hello@xycombinator.com</a>
        </div>
      </footer>
    </div>
  );
}
