import { useState } from "react";
import { ArrowUpRight, Check, LoaderCircle } from "lucide-react";
import { PublicFrame } from "@/components/PublicFrame";
import { trpc } from "@/lib/trpc";

type FormStatus = "idle" | "sent" | "error";

/**
 * The form delegates validation to the server contract. The UI only tracks
 * submission state and never stores entries outside the user’s current session.
 */
export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const submit = trpc.contact.submit.useMutation({
    onSuccess: () => { setStatus("sent"); setName(""); setEmail(""); setMessage(""); },
    onError: () => setStatus("error"),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    submit.mutate({ name, email, message });
  }

  return (
    <PublicFrame label="04 / CONTACT">
      <main className="route-main contact-page">
        <section className="contact-copy"><p className="route-kicker light">THE NEXT SIGNAL</p><h1>LET’S MAKE<br />THE <i>RIGHT NOISE.</i></h1><p>Tell us what needs a sharper direction. We only use the details you provide to respond to your enquiry.</p></section>
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <label>Your name<input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required autoComplete="name" /></label>
          <label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" maxLength={254} required autoComplete="email" /></label>
          <label>What should we know?<textarea value={message} onChange={(event) => setMessage(event.target.value)} minLength={20} maxLength={2000} required /></label>
          <button type="submit" disabled={submit.isPending}>{submit.isPending ? <><LoaderCircle size={18} className="spin" /> Sending</> : <>Send the signal <ArrowUpRight size={18} /></>}</button>
          {status === "sent" && <p className="form-state success"><Check size={17} /> Received. We will be in touch.</p>}
          {status === "error" && <p className="form-state error">We could not send that yet. Check the details and try again.</p>}
        </form>
      </main>
    </PublicFrame>
  );
}
