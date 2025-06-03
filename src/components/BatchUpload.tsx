import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function BatchUploadForm() {
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [resourceType, setResourceType] = useState<"document" | "url" | "both">(
    "document"
  );
  const [resourceName, setResourceName] = useState("");
  const [urlFields, setUrlFields] = useState<{ id: string; value: string }[]>(
    []
  );

  const [uploading, setUploading] = useState(false);
  const [vectorizingProgress, setVectorizingProgress] = useState<
    Record<string, number>
  >({});
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newResources = acceptedFiles.map((file) => ({
        id: crypto.randomUUID(),
        type: "document",
        file,
        name: resourceName || file.name,
      }));
      setResources((prev) => [...prev, ...newResources]);
    },
    [resourceName]
  );

  const addUrlField = () => {
    setUrlFields((prev) => [...prev, { id: crypto.randomUUID(), value: "" }]);
  };

  const updateUrlField = (id: string, value: string) => {
    setUrlFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, value } : field))
    );
  };

  const removeUrlField = (id: string) => {
    setUrlFields((prev) => prev.filter((f) => f.id !== id));
  };

  const removeFile = (id: string) => {
    setResources((prev) => prev.filter((res) => res.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    multiple: true,
    disabled: resourceType === "url", // disable uploader if only url selected
  });

  // Helper: filter resources based on resourceType for display
  const filteredResources =
    resourceType === "both"
      ? resources
      : resources.filter((res) => res.type === resourceType);

  // Create a process function to handle the resources
  const processResources = async () => {
    try {
      if (!resourceName.trim()) {
        alert("Please enter a name for the resource.");
        return;
      }
      if (resources.length === 0) {
        alert("Please add at least one resource (document or URL).");
        return;
      }
      setUploading(true); // Start uploading

      setError(null); // Reset error state
      const formData = new FormData();

      // Add document files with associated metadata (id and name)
      resources
        .filter((res) => res.type === "document" && res.file)
        .forEach((res) => {
          formData.append("files", res.file); // actual file
          formData.append("fileIds", res.id); // corresponding ID
        });

      // Add URL resources as JSON with id and name
      const urls = resources
        .filter((res) => res.type === "url" && res.url)
        .map((res) => ({
          id: res.id,
          url: res.url,
          name: res.name,
        }));

      if (urls.length > 0) {
        formData.append("urls", JSON.stringify(urls));
      }

      formData.append("name", resourceName);
      formData.append("type", resourceType);

      const res = await fetch("/api/upload-batch", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      console.log("Upload success:", data);

      // Poll for vectorization progress

      const pollInterval = setInterval(async () => {
        let completedCount = 0;

        for (const [resourceId, id] of Object.entries(data.ids)) {
          try {
            const progressResponse = await fetch(`/api/vectorize?id=${id}`);
            const { progress, status } = await progressResponse.json();

            setVectorizingProgress((prev) => ({
              ...prev,
              [resourceId]: progress,
            }));

            if (status === "completed") {
              completedCount++;
            } else if (status === "failed") {
              setError(`Vectorization failed for document ${id}`);
              clearInterval(pollInterval);
              setUploading(false);
              console.error(`Vectorization failed for document ${id}`);
              alert(`Vectorization failed for document ${id}`);
              return;
            }
          } catch (err) {
            setError("Error checking vectorization status.");
            clearInterval(pollInterval);
            setUploading(false);
            return;
          }
        }

        // If all are completed
        if (completedCount === Object.keys(data.ids).length) {
          console.log("All vectorizations completed!");
          clearInterval(pollInterval);
          setUploading(false);
          alert("All resources processed successfully!");
          // redirect to chat page or show success message
          // Optionally redirect to chat page
          router.push(`/chat/batchResource/${data.batchResourceId}`);
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to process resources:", error);
      alert("There was an error processing your resources.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Batch Upload Resources</h2>

        {/* Name Field */}
        <div className="mb-4">
          <Label className="block mb-2">Name</Label>
          <Input
            placeholder="Enter name for the resource"
            value={resourceName}
            onChange={(e) => setResourceName(e.target.value)}
          />
        </div>

        {/* Type Radio Group */}
        <div className="mb-4">
          <Label className="block mb-2">Type</Label>
          <RadioGroup
            value={resourceType}
            onValueChange={(value) => {
              setResourceType(value as "document" | "url" | "both");
              setUrlFields([]);
            }}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="document" id="r1" />
              <Label htmlFor="r1">Document</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="url" id="r2" />
              <Label htmlFor="r2">Web Page</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="both" id="r3" />
              <Label htmlFor="r3">Both</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Conditional Inputs */}
        <div>
          {(resourceType === "url" || resourceType === "both") && (
            <div className="mb-4 space-y-3">
              <Label className="mb-2">Select Web Page URLs</Label>
              {urlFields.map((field) => (
                <div key={field.id} className="flex gap-2 items-center">
                  <Input
                    placeholder="Enter a webpage URL"
                    value={field.value}
                    onChange={(e) => updateUrlField(field.id, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeUrlField(field.id)}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button type="button" onClick={addUrlField}>
                  + Add URL
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const urlsToSave = urlFields
                      .map((f) => f.value.trim())
                      .filter((v) => v !== "");

                    if (urlsToSave.length === 0) return;

                    const newUrls = urlsToSave.map((url) => ({
                      id: crypto.randomUUID(),
                      type: "url",
                      url,
                      name: resourceName || url,
                    }));

                    setResources((prev) => [...prev, ...newUrls]);
                    setUrlFields([]);
                  }}
                  disabled={urlFields.every((f) => !f.value.trim())}
                >
                  Save All URLs
                </Button>
              </div>
            </div>
          )}

          {(resourceType === "document" || resourceType === "both") && (
            <div className="mb-4">
              <Label className="block mb-2">Select Documents</Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-300 hover:border-indigo-400"
                }`}
              >
                <input {...getInputProps()} />
                <p className="text-sm font-medium">
                  Drag and drop files here, or click to select files
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports PDF, DOC, DOCX, and TXT files (max 10MB each)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Display Resources */}
        {filteredResources.length > 0 && (
          <div className="mt-4 space-y-2">
            {filteredResources.map((res) => {
              const progress = vectorizingProgress[res.id]; // match by document ID

              return (
                <div
                  key={res.id}
                  className="flex flex-col bg-gray-100 p-3 rounded-md space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {res.name}
                      </span>
                      {res.file && (
                        <span className="text-xs text-gray-500">
                          {(res.file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                      {res.url && (
                        <span className="text-xs text-blue-600 underline">
                          {res.url}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => removeFile(res.id)}
                      className="text-gray-500 hover:text-red-500"
                      disabled={progress !== undefined && progress < 100} // optional: prevent delete during processing
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Show progress bar if upload started */}
                  {progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Generating vectors</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button
            onClick={processResources}
            type="button"
            disabled={uploading || filteredResources.length === 0}
            className={
              "px-4 py-2 rounded-md  font-medium bg-indigo-600 hover:bg-indigo-700"
            }
          >
            {uploading ? "Processing..." : "Process Resources"}
          </Button>
        </div>
      </div>
    </div>
  );
}
