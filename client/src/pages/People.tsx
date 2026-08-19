import { motion } from "framer-motion";
import { PublicFrame } from "@/components/PublicFrame";

const coordinates = [
  ["01", "PIVOT", "The maker", "Builds the unexpected bridge between an idea and a working thing."],
  ["02", "FRAME", "The organizer", "Turns a loud set of possibilities into one calm, usable route."],
  ["03", "TRACE", "The connector", "Finds the invisible patterns that let complex systems speak plainly."],
  ["04", "VIVID", "The storyteller", "Gives each direction a visual pulse that is hard to forget."],
] as const;

/** The names are working codenames and can be replaced with the team’s public names later. */
export default function People() {
  return (
    <PublicFrame label="02 / PEOPLE">
      <main className="route-main ink-page people-page">
        <div className="people-heading"><p className="route-kicker light">THE FOUR COORDINATES</p><h1>NO SINGLE<br /><i>POINT OF VIEW.</i></h1></div>
        <section className="coordinate-list" aria-label="Team coordinates">
          {coordinates.map(([number, name, role, copy], index) => (
            <motion.article key={name} className={`coordinate-card card-${index + 1}`} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: index * 0.07 }}>
              <span>{number}</span><div className="coordinate-symbol" aria-hidden="true"><b /><i /></div><p>{role}</p><h2>{name}</h2><div className="coordinate-copy">{copy}</div>
            </motion.article>
          ))}
        </section>
      </main>
    </PublicFrame>
  );
}
