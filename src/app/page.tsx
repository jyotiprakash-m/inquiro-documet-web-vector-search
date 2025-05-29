import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center px-4 py-12">
      <main className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-3xl shadow-xl max-w-2xl w-full text-center p-10 text-white flex flex-col items-center gap-8">
        <Image
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          className="invert"
          priority
        />
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight drop-shadow-lg">
          Inquiro Document Search
        </h1>
        <p className="text-lg sm:text-xl text-white/80 max-w-md">
          Upload, search, and chat with your documents using AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/sign-in"
            className="flex-1 px-6 py-3 rounded-full bg-white text-indigo-700 font-bold text-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 text-center"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="flex-1 px-6 py-3 rounded-full border border-white text-white font-bold text-lg hover:bg-white/20 hover:scale-105 transition-all duration-300 text-center"
          >
            Sign Up
          </Link>
        </div>
      </main>
      <footer className="absolute bottom-6 left-0 right-0 flex flex-wrap gap-4 justify-center text-sm text-white/70">
        <a
          className="flex items-center gap-2 hover:underline"
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Powered by Next.js
        </a>
        <a
          className="flex items-center gap-2 hover:underline"
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/vercel.svg" alt="Vercel logo" width={16} height={16} />
          Deploy on Vercel
        </a>
      </footer>
    </div>
  );
}
