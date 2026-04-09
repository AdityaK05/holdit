"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

import SearchBar from "@/components/SearchBar";
import ProductCard from "@/components/ProductCard";
import { mockProducts } from "@/lib/mock-data";

const steps = [
  { num: "01", title: "Search", desc: "Look up any product you need before heading out." },
  { num: "02", title: "Reserve", desc: "See nearby stores with live stock and hold your item." },
  { num: "03", title: "Pickup", desc: "Show your OTP at the store and walk out in seconds." },
];

const marqueeItems = [
  "HEADPHONES", "GROCERIES", "ELECTRONICS", "FASHION", "GAMING",
  "KITCHEN", "STATIONERY", "HOME", "ACCESSORIES",
];

export default function HomePage() {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <main>
      {/* ── Hero Section ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden px-6 lg:px-8">
        {/* Subtle grid lines */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        {/* Radial glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(255,255,255,0.03)] blur-[120px]" />

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative mx-auto w-full max-w-5xl text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-8"
          >
            {/* Small label */}
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252] animate-[fade-in-blur_0.6s_0.2s_both]">
              Reserve before you go
            </p>

            {/* Main heading */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-5xl font-bold tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl"
              >
                Know what&apos;s
              </motion.h1>
            </div>
            <div className="overflow-hidden -mt-4">
              <motion.h1
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-5xl font-bold tracking-[-0.04em] sm:text-7xl lg:text-8xl"
              >
                <span className="gradient-text">in stock</span>
              </motion.h1>
            </div>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-lg leading-8 text-[#525252] animate-[fade-in-blur_0.8s_0.5s_both]">
              Check product availability at your nearest store. Reserve it instantly, pick it up with an OTP. No wasted trips.
            </p>

            {/* Search Bar */}
            <div className="mx-auto max-w-2xl animate-[slide-up_0.6s_0.7s_both]">
              <SearchBar onSearch={(q) => router.push(`/search?q=${encodeURIComponent(q)}`)} />
            </div>

            {/* Scroll indicator */}
            <div className="pt-12 animate-[fade-in-blur_0.8s_1.2s_both]">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto h-12 w-6 rounded-full border border-[rgba(255,255,255,0.15)]"
              >
                <motion.div
                  animate={{ y: [2, 14, 2] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="mx-auto mt-2 h-2 w-1 rounded-full bg-white"
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Marquee Strip ── */}
      <section className="overflow-hidden border-y border-[rgba(255,255,255,0.05)] py-5">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="mx-8 text-sm font-semibold tracking-[0.25em] text-[#1a1a1a] hover:text-[#525252] transition-colors duration-300">
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-6 py-32 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252]">How it works</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
              Three simple steps
            </h2>
          </motion.div>

          <div className="space-y-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true, margin: "-80px" }}
                className="group flex items-start gap-8 border-t border-[rgba(255,255,255,0.05)] py-12 transition-all hover:bg-[rgba(255,255,255,0.01)]"
              >
                <span className="text-6xl font-bold tracking-[-0.04em] text-[#1a1a1a] transition-colors duration-300 group-hover:text-[#525252]">
                  {step.num}
                </span>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight text-white">{step.title}</h3>
                  <p className="mt-2 text-base leading-7 text-[#525252]">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="px-6 py-32 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 flex items-end justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#525252]">Popular now</p>
              <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
                Trending products
              </h2>
            </div>
            <button
              type="button"
              onClick={() => router.push("/search?q=all")}
              className="hidden items-center gap-2 text-sm font-semibold text-[#525252] hover:text-white transition-colors sm:flex"
            >
              View all
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {mockProducts.slice(0, 6).map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-[rgba(255,255,255,0.05)] px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-10 lg:grid-cols-4">
          {[
            { value: "1,200+", label: "Products reserved" },
            { value: "50+", label: "Partner stores" },
            { value: "< 15min", label: "Avg. pickup time" },
            { value: "4.9★", label: "User rating" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm text-[#525252]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-32 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl text-center"
        >
          <h2 className="text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl">
            Ready to never waste a trip?
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-base leading-7 text-[#525252]">
            Join thousands of smart shoppers who reserve before they leave.
          </p>
          <div className="mt-10 inline-block">
            <button type="button" onClick={() => router.push("/register")}
              className="btn-gradient rounded-full px-10 py-4 text-sm tracking-wide">
              Get Started Free
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[rgba(255,255,255,0.05)] px-6 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-xs text-[#3a3a3a]">© 2026 HoldIt. All rights reserved.</p>
          <p className="text-xs text-[#3a3a3a]">Made with precision</p>
        </div>
      </footer>
    </main>
  );
}
