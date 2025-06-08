import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateShareUrl } from "@/lib/shareUrlUtils";
import { CopyIcon, Share2, ShareIcon } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
interface ShareProps {
  type: "document" | "webpage" | "batchResource";
  resourceId: string;
}

export default function Share({ type, resourceId }: ShareProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const { userId } = useAuth();
  const [shareUrl, setShareUrl] = useState<string>("");
  const [maxViews, setMaxViews] = useState<number>(1);

  const handleGenerateAndCreate = async () => {
    try {
      const result = generateShareUrl({
        shareBy: userId as string,
        type,
        resourceId,
        maxViews,
      });
      setShareUrl(result.encodedUrl);

      const res = await fetch(`/api/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resourceId,
          type: type,
          shareUrl: result.encodedUrl,
          token: result.token,
        }),
      });
    } catch (error) {
      console.log("Error during generating url", error);
    }
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(baseUrl + shareUrl);
      alert("Share URL copied to clipboard!");
    }
  };

  return (
    <Dialog onOpenChange={() => setShareUrl("")}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Share URL</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="maxViews">Max Views</Label>
            <Input
              type="number"
              id="maxViews"
              min={1}
              value={maxViews}
              onChange={(e) => setMaxViews(Number(e.target.value))}
            />
          </div>
          {shareUrl === "" && (
            <Button onClick={handleGenerateAndCreate}>Generate URL</Button>
          )}
          {shareUrl && (
            <div className="grid gap-2">
              <Label>Share URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  readOnly
                  value={baseUrl + shareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button variant="ghost" size="icon" onClick={handleCopy}>
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
