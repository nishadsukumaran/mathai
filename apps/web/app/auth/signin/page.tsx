"use client";

/**
 * @module apps/web/app/auth/signin
 *
 * Custom sign-in page.
 * Kid-friendly design with Google OAuth sign-in.
 */

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const error = searchParams.get("error");

  useEffect(() => {
    getProviders().then(setProviders);
  }, []);

  const handleSignIn = async (providerId: string) => {
    setLoading(true);
    await signIn(providerId, { callbackUrl });
  };

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Couldn't start sign in. Please try again.",
    OAuthCallback: "Something went wrong during sign in. Please try again.",
    OAuthCreateAccount: "Couldn't create your account. Please try again.",
    EmailCreateAccount: "Couldn't create your account. Please try again.",
    Callback: "Something went wrong. Please try again.",
    OAuthAccountNotLinked: "This email is already linked to another account.",
    SessionRequired: "Please sign in to continue.",
    Default: "An error occurred. Please try again.",
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md text-center">
        {/* Logo / mascot area */}
        <div className="text-7xl mb-4">🧮</div>
        <h1 className="text-3xl font-bold text-indigo-700 mb-2">MathAI</h1>
        <p className="text-gray-500 mb-8">Sign in to start earning XP and levelling up!</p>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {errorMessages[error] ?? errorMessages["Default"]}
          </div>
        )}

        {/* Provider buttons */}
        <div className="space-y-3">
          {providers && Object.values(providers).length > 0 ? (
            Object.values(providers).map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleSignIn(provider.id)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-2xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-indigo-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {provider.id === "google" && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {loading ? "Signing in..." : `Continue with ${provider.name}`}
              </button>
            ))
          ) : (
            <div className="text-gray-400 text-sm py-4">
              No sign-in providers configured yet.
              <br />
              <span className="text-indigo-500">
                Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local
              </span>
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
