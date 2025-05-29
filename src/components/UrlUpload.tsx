import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UrlUpload() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url) {
      setError("Please enter a URL");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      // Submit URL for processing
      const response = await fetch("/api/url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process URL");
      }

      const { webPageId } = await response.json();
      setProgress(100);

      // Poll for vectorization progress
      // const pollInterval = setInterval(async () => {
      //   const progressResponse = await fetch(
      //     `/api/vectorize/status?documentId=${webPageId}`
      //   );
      //   const { progress, status } = await progressResponse.json();

      //   setProgress(50 + progress / 2); // Scale to 50-100%

      //   if (status === "completed" || status === "failed") {
      //     clearInterval(pollInterval);

      //     if (status === "completed") {
      //       router.push("/dashboard");
      //     } else {
      //       setError("Vectorization failed");
      //       setLoading(false);
      //     }
      //   }
      // }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Add Web Page</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700"
            >
              Web Page URL
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 p-2"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing web page</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className={`px-4 py-2 rounded-md text-white ${
                loading || !url.trim()
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Processing..." : "Add Web Page"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
