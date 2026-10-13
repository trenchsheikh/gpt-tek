import Link from "next/link";
import "../landing.css";
export default async function SignInError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="landing">
      <main className="landing-main">
        <section className="landing-hero">
          <img src="/logo.png" alt="GPT Tek" width={55} height={55} />
          <h1 style={{ fontSize: 40 }}>Let’s get you connected.</h1>
          <p>
            {error === "Configuration"
              ? "The sign-in provider needs to be configured by the project owner."
              : "Sign-in could not be completed. Try again to start a fresh, secure session."}
          </p>
          <Link className="landing-button" href="/app?signin=1">
            Back to sign in →
          </Link>
          <p style={{ fontSize: 12, marginTop: 24 }}>
            <Link href="/">Return home</Link>
          </p>
        </section>
      </main>
    </div>
  );
}
