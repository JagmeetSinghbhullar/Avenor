"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { GoogleIcon } from "@/components/icons/GoogleIcon";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackFailed = searchParams.get("error") === "auth_callback_failed";
  const nextPath = getSafeRedirectPath(searchParams.get("next"));

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackFailed ? "Sign-in didn't complete. Please try again." : null
  );

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        // Without this, Google silently reuses whichever of the
        // browser's own Google sessions is active, skipping the account
        // picker entirely — so a user who signed out of Avenor (which
        // only clears our session, not Google's) and wants to sign back
        // in with a different Google account never gets the chance to
        // choose. This forces the picker to show every time.
        queryParams: { prompt: "select_account" },
      },
    });
    if (signInError) {
      setError(signInError.message);
      setIsLoading(false);
    }
    // On success the browser is redirected to Google, so there's nothing
    // more to do here — no navigation call needed.
  };

  return (
    <div className="bg-background flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-sm p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <h1 className="text-foreground text-xl font-semibold tracking-tight">
              Sign in to Avenor
            </h1>
            <p className="text-muted-foreground text-sm">Your personal QA testing dashboard</p>
          </div>

          {error && (
            <div
              role="alert"
              className="border-danger/30 bg-danger-subtle text-danger-subtle-foreground mt-6 rounded-lg border px-3 py-2 text-sm"
            >
              {error}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            fullWidth
            size="lg"
            className="mt-6"
            onClick={() => void handleGoogleSignIn()}
            isLoading={isLoading}
            leftIcon={!isLoading && <GoogleIcon />}
          >
            Continue with Google
          </Button>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
