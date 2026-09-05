import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/templates";
import { useState } from "react";
import {
  ArrowRight,
  QrCode,
  UtensilsCrossed,
  Radio,
  Palette,
  ShoppingBag,
  Sparkles,
  Bell,
  Plus,
  Star,
} from "lucide-react";

const FEATURES = [
  {
    icon: QrCode,
    title: "A table, a scan, a menu",
    body: "Every table gets its own code. Customers scan, browse your branded menu, and order without waiting on staff.",
  },
  {
    icon: Radio,
    title: "Orders land live",
    body: "Tickets hit your queue the moment they're placed — no refreshing, no relayed orders, no guessing what's next.",
  },
  {
    icon: Palette,
    title: "Looks like your shop, not ours",
    body: "Pick a template, set your colors and logo, choose dine-in or counter-only. Live in minutes, not weeks.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: QrCode,
    title: "Print your code",
    body: "Generate a QR per table (or one for your counter) straight from your dashboard — no designer needed.",
  },
  {
    n: "02",
    icon: ShoppingBag,
    title: "Customer scans & orders",
    body: "They browse your branded menu on their own phone and place the order — no app install, no waiting for staff.",
  },
  {
    n: "03",
    icon: Bell,
    title: "You get pinged instantly",
    body: "The ticket lands in your live queue the second it's placed, ready for the kitchen to fire.",
  },
];

const STATS = [
  { value: "3 min", label: "Average setup time" },
  { value: "9", label: "Storefront templates" },
  { value: "0%", label: "Commission on orders" },
  { value: "24/7", label: "Live order sync" },
];

const TESTIMONIALS = [
  {
    quote:
      "We printed table codes on a Tuesday and had our first QR order that same lunch service. Nobody on staff had to learn anything.",
    name: "Priya Nair",
    role: "Owner, Copper Leaf Café",
    rotate: "-1.5deg",
  },
  {
    quote:
      "The kitchen used to lose tickets on busy nights. Now every order lands on the tablet the second it's placed — queue's never been cleaner.",
    name: "Arjun Mehta",
    role: "Manager, Bombay Vada Pav Co.",
    rotate: "1deg",
  },
  {
    quote:
      "I picked the Night Market template, dropped in our logo, and it genuinely looks like we paid a designer for it.",
    name: "Sana Qureshi",
    role: "Founder, Sana's Street Kitchen",
    rotate: "-1deg",
  },
];

const FAQS = [
  {
    q: "Do customers need to download an app?",
    a: "No. Scanning the table's QR code opens your branded menu straight in their phone's browser — they order and pay from there, nothing to install.",
  },
  {
    q: "Do I need any special hardware?",
    a: "Just something to print a QR code on — a sticker, a table tent, or a laminated card. Your dashboard works on any phone, tablet, or laptop you already have.",
  },
  {
    q: "Can I change templates after I launch?",
    a: "Yes, anytime. Switching templates keeps your menu, theme colors, and logo — you're just changing the layout customers see.",
  },
  {
    q: "What if I only do takeaway, not table service?",
    a: "Pick counter-only mode during setup. Customers scan a single code at the counter instead of per-table codes, and orders queue the same way.",
  },
];

function FaqItem({ q, a, i }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.35, delay: i * 0.05 }}
      className="border-b border-border/70 py-4"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="font-heading text-base font-semibold">{q}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-primary"
        >
          <Plus className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {a}
        </p>
      </motion.div>
    </motion.div>
  );
}

function OrderTicket() {
  return (
    <div className="relative mx-auto w-full max-w-[300px] rotate-[-2deg] select-none">
      <div className="ticket-notch-top ticket-notch-bottom relative rounded-sm bg-card px-5 pt-7 pb-6 shadow-[0_18px_40px_-12px_hsl(var(--ink)/0.35)]">
        <div className="flex items-center justify-between text-xs font-mono-ticket text-muted-foreground">
          <span>NO. 0148</span>
          <span className="flex items-center gap-1 text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            LIVE
          </span>
        </div>
        <p className="mt-1 font-heading text-lg font-semibold">Table 04 · Dine-in</p>

        <div className="dashed-divider my-4" />

        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span>2× Paneer Tikka Wrap</span>
            <span className="font-mono-ticket">₹398</span>
          </li>
          <li className="flex justify-between">
            <span>1× Cold Brew</span>
            <span className="font-mono-ticket">₹149</span>
          </li>
          <li className="flex justify-between">
            <span>1× Loaded Fries</span>
            <span className="font-mono-ticket">₹179</span>
          </li>
        </ul>

        <div className="dashed-divider my-4" />

        <div className="flex items-center justify-between">
          <span className="font-heading text-sm font-semibold uppercase tracking-wide">
            Total
          </span>
          <span className="font-mono-ticket text-lg font-semibold text-primary">
            ₹726
          </span>
        </div>
      </div>

      <div className="absolute -right-5 -top-5 flex h-16 w-16 rotate-12 items-center justify-center rounded-full border-2 border-accent/70 bg-background/80 text-[10px] font-heading font-semibold uppercase tracking-wide text-accent shadow-sm">
        Placed
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <span className="font-heading text-lg font-semibold">QROder</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-8 md:grid-cols-2 md:pt-16">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
          }}
        >
          <motion.span
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono-ticket text-xs uppercase tracking-wide text-muted-foreground"
          >
            <QrCode className="h-3.5 w-3.5" /> No app to download
          </motion.span>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-5 font-heading text-4xl font-bold leading-[1.05] sm:text-5xl"
          >
            Scan the table.
            <br />
            <span className="text-primary">Skip the wait.</span>
          </motion.h1>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-5 max-w-md text-base text-muted-foreground"
          >
            QROder turns any table or counter into a branded ordering point.
            Customers scan, order, and pay — your kitchen sees it the instant
            it&apos;s placed.
          </motion.p>

          <motion.div
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link to="/register">
              <Button size="lg">
                Start free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Log in
              </Button>
            </Link>
          </motion.div>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-4 font-mono-ticket text-xs text-muted-foreground"
          >
            No card required · Dine-in or counter-only
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, rotate: 4 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          whileHover={{ rotate: -1, scale: 1.02 }}
        >
          <OrderTicket />
        </motion.div>
      </main>

      {/* Stats strip — a receipt-style line-item row backing up the claims above */}
      <section className="border-y border-border/70 bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-8 px-6 py-10 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <p className="font-heading text-2xl font-bold sm:text-3xl">{s.value}</p>
              <p className="mt-1 font-mono-ticket text-[11px] uppercase tracking-wide text-secondary-foreground/60">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-border/70 bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-heading text-base font-semibold">
                {title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — numbered ticket-style steps */}
      <section className="border-t border-border/70">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono-ticket text-xs uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> How it works
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
              From scan to served, in three steps
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ n, icon: Icon, title, body }, i) => (
              <motion.div
                key={n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="ticket-notch-top ticket-notch-bottom relative rounded-sm bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-ticket text-xs text-muted-foreground">
                    {n}
                  </span>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="dashed-divider my-3" />
                <h3 className="font-heading text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — pinned like notes on a kitchen corkboard */}
      <section className="border-t border-border/70 bg-card/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 font-mono-ticket text-xs uppercase tracking-wide text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-primary" /> From shop owners
            </span>
            <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
              Trusted by kitchens that hate slow tickets
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16, rotate: "0deg" }}
                whileInView={{ opacity: 1, y: 0, rotate: t.rotate }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative rounded-sm border border-border bg-background p-5 shadow-[0_10px_24px_-14px_hsl(var(--ink)/0.35)]"
              >
                <span className="absolute -top-2.5 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-2 border-accent/70 bg-background" />
                <p className="font-heading text-sm leading-relaxed">
                  “{t.quote}”
                </p>
                <div className="dashed-divider my-3" />
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="font-mono-ticket text-xs text-muted-foreground">
                  {t.role}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Template showcase — real templates pulled straight from the app */}
      <section className="border-t border-border/70 bg-card/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 font-mono-ticket text-xs uppercase tracking-wide text-muted-foreground">
                <Palette className="h-3.5 w-3.5 text-primary" /> {TEMPLATES.length} storefront looks
              </span>
              <h2 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">
                Pick a look, make it yours
              </h2>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                From compact single-page menus to full sidebar layouts —
                every template takes your logo, colors and font.
              </p>
            </div>
            <Link to="/register">
              <Button variant="outline" size="sm">
                Browse templates <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {TEMPLATES.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <div
                  className="flex h-14 items-center justify-center gap-1.5"
                  style={{ background: t.preview.bg }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: t.preview.accent }}
                  />
                  <span
                    className="h-2.5 w-6 rounded-full opacity-70"
                    style={{ background: t.preview.accent }}
                  />
                </div>
                <p className="px-2.5 py-2 text-[11px] font-medium leading-tight">
                  {t.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — plain answers to the questions that stall a "get started" click */}
      <section className="border-t border-border/70">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <div className="mb-8 text-center">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              Questions, answered
            </h2>
          </div>
          <div>
            {FAQS.map((f, i) => (
              <FaqItem key={f.q} q={f.q} a={f.a} i={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA band */}
      <section className="border-t border-border/70">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <UtensilsCrossed className="mx-auto h-6 w-6 text-primary" />
          <h2 className="mt-4 font-heading text-2xl font-bold sm:text-3xl">
            Ready to skip the wait?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Set up your first QR menu in minutes — no card, no commitment.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg">
                Start free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-8">
        <p className="font-mono-ticket text-xs text-muted-foreground">
          © {new Date().getFullYear()} QROder
        </p>
      </footer>
    </div>
  );
}