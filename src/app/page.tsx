import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <main className="flex flex-col items-center gap-8 w-full max-w-lg">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <h1 className="text-3xl font-bold text-gray-900 text-center">
          Welcome to Inquiro Document Search
        </h1>
        <p className="text-gray-600 text-center">
          Upload, search, and chat with your documents using AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/sign-in"
            className="flex-1 px-6 py-3 rounded-md bg-indigo-600 text-white text-center font-semibold hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="flex-1 px-6 py-3 rounded-md bg-white border border-indigo-600 text-indigo-600 text-center font-semibold hover:bg-indigo-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </main>
      <footer className="mt-12 flex gap-6 flex-wrap items-center justify-center text-sm text-gray-500">
        <a
          className="flex items-center gap-2 hover:underline"
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Powered by Next.js
        </a>
        <a
          className="flex items-center gap-2 hover:underline"
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/vercel.svg"
            alt="Vercel logomark"
            width={16}
            height={16}
          />
          Deploy on Vercel
        </a>
      </footer>
    </div>
  );
}
