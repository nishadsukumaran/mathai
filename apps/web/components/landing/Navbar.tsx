"use client";

import Link       from "next/link";
import { useState } from "react";
import { motion }   from "framer-motion";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-200">
            M
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">
            Math<span className="text-indigo-600">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition">
            Features
          </Link>
          <Link href="/auth/signin" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition">
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all"
          >
            Get Started Free
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 -mr-2 text-gray-600"
          aria-label="Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3"
        >
          <Link href="/features" className="block text-sm font-semibold text-gray-700 py-2">Features</Link>
          <Link href="/auth/signin" className="block text-sm font-semibold text-gray-700 py-2">Sign In</Link>
          <Link
            href="/auth/signup"
            className="block text-center text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3 rounded-xl"
          >
            Get Started Free
          </Link>
        </motion.div>
      )}
    </nav>
  );
}
