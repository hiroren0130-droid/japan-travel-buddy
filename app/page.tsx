"use client";

import Link from "next/link";
import {
  Bot,
  FolderOpen,
  Map,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import Header from "@/components/Header";
import { useLocale } from "@/components/LocaleProvider";

export default function HomePage() {
  const { messages: defaultMessages } = useLocale();
  const featureItems = [
    {
      icon: Bot,
      label: defaultMessages.home.features.aiPowered,
    },
    {
      icon: MapPin,
      label: defaultMessages.home.features.kyotoSpots,
    },
    {
      icon: Map,
      label: defaultMessages.home.features.googleMaps,
    },
    {
      icon: MessageCircle,
      label: defaultMessages.home.features.gpt,
    },
  ];

  const featureCards = [
    {
      icon: Bot,
      title: defaultMessages.home.cards.aiPlan.title,
      description: defaultMessages.home.cards.aiPlan.description,
      href: "/chat",
      linkLabel: defaultMessages.home.cards.aiPlan.linkLabel,
    },
    {
      icon: Map,
      title: defaultMessages.home.cards.map.title,
      description: defaultMessages.home.cards.map.description,
      href: "/chat",
      linkLabel: defaultMessages.home.cards.map.linkLabel,
    },
    {
      icon: FolderOpen,
      title: defaultMessages.home.cards.save.title,
      description: defaultMessages.home.cards.save.description,
      href: "/dashboard",
      linkLabel: defaultMessages.home.cards.save.linkLabel,
    },
  ];

  return (
    <>
      <Header />

      <main
        className="
          relative
          min-h-[calc(100vh-64px)]
          overflow-hidden
          bg-gradient-to-br
          from-slate-50
          via-white
          to-blue-100
        "
      >
        {/* Background Effects */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-40 -top-48 h-[620px] w-[620px] rounded-full bg-blue-200/45 blur-[140px]" />

          <div className="absolute right-[-180px] top-24 h-[540px] w-[540px] rounded-full bg-cyan-200/40 blur-[140px]" />

          <div className="absolute bottom-[-230px] left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-indigo-200/35 blur-[150px]" />

          <div className="absolute left-1/2 top-[28%] h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-white/70 blur-[120px]" />
        </div>

        <section className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
          {/* Hero */}
          <div
  className="
    mx-auto
    flex
    min-h-[640px]
    max-w-6xl
    flex-col
    items-center
    justify-center
    py-16
    text-center
    sm:min-h-[680px]
    sm:py-20
    lg:min-h-[720px]
    lg:py-24
  "
>
            <div
              className="
                inline-flex
                items-center
                gap-2.5
                rounded-full
                border
                border-white/80
                bg-white/75
                px-6
                py-3
                text-sm
                font-extrabold
                text-blue-600
                shadow-lg
                shadow-blue-900/5
                backdrop-blur-xl
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-white/90
                hover:shadow-xl
              "
            >
              <Sparkles size={18} aria-hidden="true" />

              <span>{defaultMessages.home.badge}</span>
            </div>

            <p
  className="
    mt-12
    text-sm
    font-black
    uppercase
    tracking-[0.38em]
    text-blue-600
    sm:text-base
  "
>
              {defaultMessages.appName}
            </p>

            <h1 className="text-center font-black tracking-[-0.05em] text-slate-950">
  <span className="block text-[48px] leading-[0.92] sm:text-[64px] lg:text-[82px]">
    {defaultMessages.home.hero.title}
  </span>

  <span className="-mt-1 block bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-[42px] leading-[0.92] text-transparent sm:text-[56px] lg:text-[68px]">
  {defaultMessages.home.hero.titleAccent}
</span>
</h1>

            <p
              className="
                mt-8
                text-lg
                font-extrabold
                leading-relaxed
                text-slate-800
                sm:text-2xl
              "
            >
              {defaultMessages.home.hero.subtitleLead}
              <br className="sm:hidden" />
              {defaultMessages.home.hero.subtitleRest}
            </p>

            <p
              className="
                mx-auto
                mt-5
                max-w-3xl
                text-base
                leading-8
                text-slate-600
                sm:text-lg
                sm:leading-9
              "
            >
              {defaultMessages.home.hero.descriptionLead}
              <br className="hidden sm:block" />
              {defaultMessages.home.hero.descriptionRest}
            </p>

            <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
              <Link
                href="/chat"
                className="
                  group
                  inline-flex
                  min-h-16
                  w-full
                  items-center
                  justify-center
                  gap-2.5
                  rounded-2xl
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-500
                  px-10
                  text-base
                  font-extrabold
                  text-white
                  shadow-xl
                  shadow-blue-500/25
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:scale-[1.02]
                  hover:shadow-2xl
                  hover:shadow-blue-500/35
                  active:translate-y-0
                  active:scale-[0.98]
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-blue-500
                  focus-visible:ring-offset-2
                  sm:w-auto
                  sm:text-lg
                "
              >
                <Sparkles size={20} aria-hidden="true" />

                <span>{defaultMessages.home.hero.primaryCta}</span>

                <span
                  className="transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="
                  inline-flex
                  min-h-16
                  w-full
                  items-center
                  justify-center
                  gap-2.5
                  rounded-2xl
                  border
                  border-white/80
                  bg-white/80
                  px-10
                  text-base
                  font-extrabold
                  text-slate-800
                  shadow-lg
                  shadow-slate-900/5
                  backdrop-blur-xl
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-blue-100
                  hover:bg-white
                  hover:text-blue-600
                  hover:shadow-xl
                  active:translate-y-0
                  active:scale-[0.98]
                  focus:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-blue-500
                  focus-visible:ring-offset-2
                  sm:w-auto
                  sm:text-lg
                "
              >
                <FolderOpen
                  size={20}
                  className="text-amber-500"
                  aria-hidden="true"
                />

                <span>{defaultMessages.home.hero.secondaryCta}</span>
              </Link>
            </div>

            <div
  aria-hidden="true"
  className="mt-10 h-px w-32 bg-gradient-to-r from-transparent via-blue-300 to-transparent"
/>
          </div>

          {/* Information bar */}
<div
  className="
    -mt-10
    mx-auto
    grid
    max-w-6xl
    grid-cols-2
    gap-y-5
    rounded-3xl
    border
    border-white/80
    bg-white/85
    px-5
    py-4
    shadow-lg
    backdrop-blur-md
    sm:grid-cols-4
    sm:px-8
  "
>
            {featureItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className={`
                    flex
                    items-center
                    justify-center
                    gap-3
                    text-sm
                    font-bold
                    text-slate-700
                    sm:text-base
                    ${
                      index > 0
                        ? "sm:border-l sm:border-slate-200"
                        : ""
                    }
                  `}
                >
                  <Icon
                    size={21}
                    className="text-blue-600"
                    aria-hidden="true"
                  />

                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Feature cards */}
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="
                    group
                    flex
                    min-h-[290px]
                    flex-col
                    items-center
                    rounded-[32px]
                    border
                    border-white/80
                    bg-white/90
                    px-8
                    py-8
                    text-center
                    shadow-md
                    backdrop-blur-md
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:border-blue-100
                    hover:shadow-xl
                  "
                >
                  <div
                    className={`
                      flex
                      h-20
                      w-20
                      items-center
                      justify-center
                      rounded-full
                      ${
                        index === 0
                          ? "bg-violet-50 text-violet-600"
                          : index === 1
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-indigo-50 text-indigo-600"
                      }
                    `}
                  >
                    <Icon
                      size={34}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
                    {feature.title}
                  </h2>

                  <p className="mt-3 max-w-sm flex-1 text-base leading-7 text-slate-600">
                    {feature.description}
                  </p>

                  <Link
                    href={feature.href}
                    className="
                      mt-5
                      inline-flex
                      items-center
                      gap-2
                      text-sm
                      font-bold
                      text-blue-600
                      transition-colors
                      hover:text-blue-700
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-blue-500
                      focus-visible:ring-offset-2
                    "
                  >
                    <span>{feature.linkLabel}</span>

                    <span
                      className="transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
