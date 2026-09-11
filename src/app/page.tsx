import Link from "next/link";
import { ArrowLeft, ArrowRight, LogOut, Mail } from "lucide-react";
import { getSessionUser } from "@/lib/session";
import { loginUrl, PORTFOLIO_URL } from "@/lib/env";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import { PreviewTable } from "@/components/landing/preview-table";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { SignOutButton } from "@/components/landing/sign-out-button";
import { SiteFooter } from "@/components/layout/site-footer";
import s from "./page.module.scss";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getSessionUser();

  return (
    <div className={s.wrap}>
      <div className={s.page}>
      <header className={s.header}>
        <Wordmark />
        {user?.allowed ? (
          <Button asChild variant="primary" size="sm">
            <Link href="/problems">Open tracker <ArrowRight size={14} /></Link>
          </Button>
        ) : user ? null : (
          <Button asChild size="sm">
            <a href={loginUrl("/problems")}>Sign in</a>
          </Button>
        )}
      </header>

      <section className={s.hero}>
        <p className={s.eyebrow}>Personal LeetCode companion</p>
        <h1 className={s.title}>
          Remember what you solved.
          <br />
          <span className={s.titleAccent}>Re-practice before you forget.</span>
        </h1>
        <p className={s.lead}>
          Code Tracker keeps every problem you have worked on in a category tree, records how familiar each attempt
          felt, and tells you exactly which ones are due for another round.
        </p>
        <div className={s.cta}>
          {user?.allowed ? (
            <Button asChild variant="primary">
              <Link href="/problems">Open tracker <ArrowRight size={16} /></Link>
            </Button>
          ) : user ? (
            <div className={s.restricted} role="status">
              <p>
                Signed in as <strong>{user.email ?? user.name}</strong>.<br />
                This tool is restricted to authorized users.<br />
                If you want access, please contact the owner.
              </p>
              <div className={s.restrictedActions}>
                <Button asChild variant="primary" size="sm">
                  <a href="mailto:roger@roger.tw?subject=Code%20Tracker%20access">
                    <Mail size={14} /> roger@roger.tw
                  </a>
                </Button>
                <Button asChild size="sm">
                  <a href={PORTFOLIO_URL}>
                    <ArrowLeft size={14} /> Back to roger.tw
                  </a>
                </Button>
                <SignOutButton>
                  <LogOut size={14} /> Sign out
                </SignOutButton>
              </div>
            </div>
          ) : (
            <>
              <Button asChild variant="primary">
                <a href={loginUrl("/problems")}>Sign in with roger.tw <ArrowRight size={16} /></a>
              </Button>
              <span className={s.ctaHint}>Uses your roger.tw account.</span>
            </>
          )}
        </div>
      </section>

      <section className={s.preview} aria-label="Preview of the problem list">
        <PreviewTable />
      </section>

      <FeatureGrid />

      </div>
      <SiteFooter />
    </div>
  );
}
