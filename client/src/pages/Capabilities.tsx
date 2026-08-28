import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "wouter";
import { PublicFrame } from "@/components/PublicFrame";

const work = [
  [
    "01",
    "IDENTITIES",
    "Naming, visual language, voice, and principles that make a position feel owned.",
  ],
  [
    "02",
    "INTERFACES",
    "Experiences that turn complicated product decisions into clear, repeatable paths.",
  ],
  [
    "03",
    "MOTION",
    "Movement designed to make hierarchy, state, and personality easier to understand.",
  ],
  [
    "04",
    "PRODUCTS",
    "Useful digital tools shaped with both technical care and editorial instinct.",
  ],
] as const;

export default function Capabilities() {
  const [activeCapability, setActiveCapability] = useState("IDENTITIES");

  return (
    <PublicFrame label="03 / CAPABILITIES">
      <main className="route-main paper-page capability-page">
        <header className="capability-head">
          <p className="route-kicker">WHAT WE MAKE</p>
          <h1>
            CLARITY
            <br />
            WITH <i>VOLTAGE.</i>
          </h1>
          <p>
            We work across the moments where a good idea needs a visible,
            usable, memorable form.
          </p>
        </header>
        <section className="capability-grid" aria-label="Capabilities">
          {work.map(([number, name, copy], index) => {
            const active = activeCapability === name;

            return (
              <motion.button
                key={name}
                type="button"
                className={`capability-choice ${active ? "is-active" : ""}`}
                onClick={() => setActiveCapability(name)}
                aria-pressed={active}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
              >
                <span>{number}</span>
                <em>{active ? "ACTIVE" : "OPEN"}</em>
                <h2>{name}</h2>
                <p>{copy}</p>
                <div className="capability-extra">
                  A focused working session maps the highest-value next decision
                  before we design the visible output.
                </div>
              </motion.button>
            );
          })}
        </section>
        <Link href="/contact" className="large-route-cta">
          Bring us the complicated brief <ArrowUpRight size={25} />
        </Link>
      </main>
    </PublicFrame>
  );
}
