import { motion } from "framer-motion";
import { useState } from "react";
import { PublicFrame } from "@/components/PublicFrame";

const coordinates = [
  ["01", "PIVOT", "The maker", "Builds the unexpected bridge between an idea and a working thing."],
  ["02", "FRAME", "The organizer", "Turns a loud set of possibilities into one calm, usable route."],
  ["03", "TRACE", "The connector", "Finds the invisible patterns that let complex systems speak plainly."],
  ["04", "VIVID", "The storyteller", "Gives each direction a visual pulse that is hard to forget."],
] as const;

/** The names are working codenames and can be replaced with the team’s public names later. */
export default function People() {
  const [activeName, setActiveName] = useState("PIVOT");
  const activeCoordinate = coordinates.find((coordinate) => coordinate[1] === activeName) ?? coordinates[0];

  return (
    <PublicFrame label="02 / PEOPLE">
      <main className="route-main ink-page people-page">
        <div className="people-heading"><p className="route-kicker light">THE FOUR COORDINATES</p><h1>NO SINGLE<br /><i>POINT OF VIEW.</i></h1></div>
        <section className="coordinate-list" aria-label="Team coordinates">
          {coordinates.map(([number, name, role, copy], index) => (
            <motion.button key={name} type="button" className={`coordinate-card card-${index + 1} ${activeName === name ? "is-active" : ""}`} onClick={() => setActiveName(name)} aria-pressed={activeName === name} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: index * 0.07 }}>
              <span>{number}</span><div className="coordinate-symbol" aria-hidden="true"><b /><i /></div><p>{role}</p><h2>{name}</h2><div className="coordinate-copy">{copy}</div>
            </motion.button>
          ))}
        </section>
        <section className="coordinate-reader" aria-live="polite">
          <p>ACTIVE COORDINATE / {activeCoordinate[0]}</p>
          <h2>{activeCoordinate[1]} — {activeCoordinate[2]}</h2>
          <span>{activeCoordinate[3]}</span>
        </section>
      </main>
    </PublicFrame>
  );
}
