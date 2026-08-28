import { ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { PublicFrame } from "@/components/PublicFrame";

/** The collective page explains why the four disciplines are intentionally combined. */
export default function Collective() {
  return (
    <PublicFrame label="01 / COLLECTIVE">
      <main className="route-main paper-page">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="route-hero split-hero"
        >
          <div>
            <p className="route-kicker">HOW WE WORK</p>
            <h1>
              WE START
              <br />
              WITH THE
              <br />
              <i>FRICTION.</i>
            </h1>
          </div>
          <div className="route-intro">
            <p>
              Not every good idea is neat at the beginning. We put brand,
              systems, motion, and visual culture in direct conversation until a
              clearer direction appears.
            </p>
            <Link href="/people" className="route-link">
              Meet the four forces <ArrowDownRight size={18} />
            </Link>
          </div>
        </motion.div>
        <section
          className="manifesto-grid"
          aria-label="XY COMBINATOR working principles"
        >
          <article>
            <span>01</span>
            <h2>Find the live wire.</h2>
            <p>
              Every project has a tension worth protecting. We look for it
              before we choose the format.
            </p>
          </article>
          <article>
            <span>02</span>
            <h2>Make the system visible.</h2>
            <p>
              Structure should guide people without asking them to decode it
              first.
            </p>
          </article>
          <article>
            <span>03</span>
            <h2>Give it a pulse.</h2>
            <p>
              Motion, language, and image make a product feel like it has a
              reason to exist.
            </p>
          </article>
        </section>
      </main>
    </PublicFrame>
  );
}
