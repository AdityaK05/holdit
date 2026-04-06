"use client";

import { useRouter } from "next/navigation";

import SearchBar from "@/components/SearchBar";

const steps = [
  {
    title: "Search",
    description: "Look up the exact product you need before you step out.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
  },
  {
    title: "Reserve",
    description: "See nearby stores with live stock and hold your item instantly.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
        <circle cx="12" cy="11" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Pickup",
    description: "Show your OTP in store and walk out with confidence.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M6 8h12l-1 11H7L6 8Z" />
        <path d="M9 8a3 3 0 1 1 6 0" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="bg-white">
      <section className="overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <span className="inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              Guaranteed pickup, less guesswork
            </span>
            <div className="space-y-5">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Reserve before you go
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Check product availability + reserve it at your nearest store
              </p>
            </div>
            <div className="max-w-2xl">
              <SearchBar
                onSearch={(query) => router.push(`/search?q=${encodeURIComponent(query)}`)}
              />
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-2xl shadow-blue-100/60">
              <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
                <div className="space-y-4">
                  <span className="inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-200">
                    Store pickup made simple
                  </span>
                  <h2 className="text-2xl font-semibold">Know before you leave home.</h2>
                  <p className="text-sm leading-7 text-slate-300">
                    Search for what you need, compare nearby availability, and reserve it with a pickup OTP in minutes.
                  </p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-6 -left-4 h-24 w-24 rounded-full bg-blue-100 blur-2xl" />
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-100 blur-2xl" />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">How it works</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              HoldIt helps you avoid wasted trips by making nearby stock visible and reservable.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.title}
                className="rounded-3xl border border-slate-200 bg-gray-100 p-6 shadow-sm"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-blue-600 p-3 text-white">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
