/**
 * Projects and achievements are intentionally presented as editable editorial
 * templates. Replace their prompts with verified work, awards, launches, and milestones.
 */
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, FolderOpen, Plus } from "lucide-react";

const projectTemplates = [
  ["01", "YOUR PROJECT TITLE", "Add the project’s one-line ambition here.", "Replace this with the real brief, your contribution, and the outcome once the work is ready to share."],
  ["02", "YOUR PROJECT TITLE", "Add a second team project or prototype.", "Use this panel for the problem, the format, and the reasoning that made the direction work."],
  ["03", "YOUR PROJECT TITLE", "Add a launch, experiment, or community build.", "Keep the evidence specific: a verified release, a documented collaboration, or a measurable milestone."],
] as const;

const achievementTemplates = [
  ["PIVOT", "Add a verified launch, award, or milestone."],
  ["FRAME", "Add a verified launch, award, or milestone."],
  ["TRACE", "Add a verified launch, award, or milestone."],
  ["VIVID", "Add a verified launch, award, or milestone."],
] as const;

export function ProjectsArchive() {
  const [activeNumber, setActiveNumber] = useState("01");
  const reducedMotion = useReducedMotion();
  const activeProject = projectTemplates.find((project) => project[0] === activeNumber) ?? projectTemplates[0];

  return (
    <>
      <section id="projects" className="project-archive" aria-labelledby="projects-heading">
        <div className="archive-label"><span>05</span><span>SELECTED PROJECTS</span><span>EDIT WITH REAL WORK</span></div>
        <div className="archive-intro">
          <h2 id="projects-heading">THE <i>WORK</i><br />NEEDS A HOME.</h2>
          <p>This interactive index is ready for your real projects. Choose a panel to preview the story structure, then replace the template with your team’s verified case-study details.</p>
        </div>
        <div className="project-stage">
          <div className="project-list" role="tablist" aria-label="Project templates">
            {projectTemplates.map(([number, title, shortCopy], index) => {
              const active = activeNumber === number;

              return <motion.button key={number} type="button" role="tab" aria-selected={active} className={`project-trigger ${active ? "is-active" : ""}`} onClick={() => setActiveNumber(number)} initial={{ opacity: 0, x: reducedMotion ? 0 : -18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: index * 0.06 }}><span>{number}</span><strong>{title}</strong><em>{shortCopy}</em><ArrowUpRight size={19} /></motion.button>;
            })}
          </div>
          <motion.article key={activeProject[0]} className="project-detail" initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} role="tabpanel">
            <div className="project-orbit" aria-hidden="true"><FolderOpen size={37} /><span /><i /></div>
            <p>PROJECT {activeProject[0]} / CASE STUDY TEMPLATE</p>
            <h3>{activeProject[1]}</h3>
            <strong>{activeProject[2]}</strong>
            <span>{activeProject[3]}</span>
            <button type="button" className="template-action" onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}>Plan this project <ArrowUpRight size={17} /></button>
          </motion.article>
        </div>
      </section>

      <section className="achievement-ledger" aria-labelledby="achievements-heading">
        <div className="achievement-intro"><span>06 / ACHIEVEMENTS</span><h2 id="achievements-heading">EARN THE<br /><i>RECEIPT.</i></h2><p>Keep this record honest. Add only verified awards, completed launches, certified skills, or public milestones for each team member.</p></div>
        <div className="achievement-grid">
          {achievementTemplates.map(([name, prompt], index) => <motion.article key={name} initial={{ opacity: 0, y: reducedMotion ? 0 : 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: index * 0.06 }}><div><span>{`0${index + 1}`}</span><CheckCircle2 size={18} /></div><h3>{name}</h3><p>{prompt}</p><button type="button" onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}><Plus size={16} /> Add verified milestone</button></motion.article>)}
        </div>
      </section>
    </>
  );
}
