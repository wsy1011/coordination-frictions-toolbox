"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { type LocalizedText, useLocale } from "@/lib/locale";
import { AUTHOR_EMAIL, AUTHOR_NAME } from "@/lib/site";

const navItems = [
  { href: "/", label: { zh: "政策沙盘", en: "Policy Sandbox" } },
  { href: "/network", label: { zh: "连通网络", en: "Connected Lock Network" } },
  { href: "/rankings", label: { zh: "治理优先级", en: "Governance Prioritization" } },
  { href: "/about", label: { zh: "方法与边界", en: "Method and Scope" } },
];

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: LocalizedText;
  subtitle: LocalizedText;
}) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="min-h-screen bg-[var(--sand-100)] text-[var(--ink-900)]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(13,82,145,0.10),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(215,114,35,0.16),_transparent_30%)]" />
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[rgba(250,246,239,0.9)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1540px] flex-col gap-4 px-6 py-4 lg:px-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.35em] text-[var(--ink-500)]">
                Lock-Side Coordination Frictions
              </p>
              <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-[0.02em] lg:text-4xl">
                {t(title)}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-[var(--ink-600)] lg:text-base">
                {t(subtitle)}
              </p>
              <p className="mt-3 text-sm text-[var(--ink-700)]">
                {locale === "zh" ? "作者" : "Author"}:{" "}
                <span className="font-semibold">{AUTHOR_NAME}</span>
                {" · "}
                <a
                  href="https://github.com/wsy1011"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--accent-blue)]"
                >
                  GitHub: wsy1011
                </a>
                {" · "}
                <a
                  href={`mailto:${AUTHOR_EMAIL}`}
                  className="underline decoration-[var(--line)] underline-offset-4 hover:text-[var(--accent-blue)]"
                >
                  {AUTHOR_EMAIL}
                </a>
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="inline-flex rounded-full border border-[var(--line)] bg-white/80 p-1 shadow-sm">
                {(["zh", "en"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLocale(item)}
                    className={clsx(
                      "rounded-full px-3 py-1.5 text-sm transition-all",
                      locale === item
                        ? "bg-[var(--accent-blue)] text-white"
                        : "text-[var(--ink-700)] hover:text-[var(--accent-blue)]",
                    )}
                  >
                    {item === "zh" ? "中文" : "EN"}
                  </button>
                ))}
              </div>
              <nav className="flex flex-wrap items-center justify-end gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "rounded-full border px-4 py-2 text-sm transition-all",
                      pathname === item.href
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white shadow-[0_10px_30px_rgba(13,82,145,0.24)]"
                        : "border-[var(--line)] bg-white/70 text-[var(--ink-700)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]",
                    )}
                  >
                    {t(item.label)}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </header>
      <main className="relative mx-auto flex max-w-[1540px] flex-col gap-6 px-6 py-6 lg:px-10 lg:py-8">
        {children}
      </main>
    </div>
  );
}
