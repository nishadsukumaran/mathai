import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50/50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-xs">
              M
            </div>
            <span className="font-black text-gray-900">
              Math<span className="text-indigo-600">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/features" className="hover:text-gray-900 transition">Features</Link>
            <Link href="/auth/signin" className="hover:text-gray-900 transition">Sign In</Link>
            <Link href="/auth/signup" className="hover:text-gray-900 transition">Get Started</Link>
          </div>

          <p className="text-xs text-gray-400">
            Built with care for young mathematicians
          </p>
        </div>
      </div>
    </footer>
  );
}
