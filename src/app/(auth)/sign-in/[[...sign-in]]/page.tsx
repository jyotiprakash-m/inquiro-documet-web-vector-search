import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-3">
        Sign In
      </h1>
      <SignIn />
    </div>
  );
}
