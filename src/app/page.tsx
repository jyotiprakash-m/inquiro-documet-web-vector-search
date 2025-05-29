import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center flex-col px-4 py-12">
      <main className="bg-white border border-gray-200 rounded-3xl shadow-lg max-w-2xl w-full text-center p-10 flex flex-col items-center gap-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 leading-tight font-serif">
          <span className="font-extrabold underline font-sans">Inquiro</span>{" "}
          <br /> Document Search
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-md">
          Upload, search, and chat with your documents using AI.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/sign-in"
            className="flex-1 px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold text-lg shadow-sm hover:bg-indigo-700 transition-all text-center"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="flex-1 px-6 py-3 rounded-full border border-indigo-600 text-indigo-600 font-semibold text-lg hover:bg-indigo-50 transition-all text-center"
          >
            Sign Up
          </Link>
        </div>
      </main>
      <footer className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-gray-500">
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
