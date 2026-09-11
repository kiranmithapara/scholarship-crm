import { useRef, useState } from "react";
import { Upload, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getFileUrl } from "@/lib/utils";
import type { DocumentType, StudentDocumentItem } from "@/types/student.types";

interface FileUploadCardProps {
  label: string;
  type: DocumentType;
  existingDocument?: StudentDocumentItem;
  onUpload: (type: DocumentType, file: File) => Promise<void>;
}

/** FileUploadCard - one document slot (Aadhaar, Hostel Receipt, 12th Marksheet). Shows uploaded state + view link. */
export function FileUploadCard({ label, type, existingDocument, onUpload }: FileUploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(type, file);
      toast.success(`${label} uploaded successfully`);
    } catch {
      toast.error(`Failed to upload ${label}`);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-3.5 sm:p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            existingDocument ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
          }`}
        >
          {existingDocument ? <CheckCircle2 className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{label}</p>
          <p className="text-xs text-muted-foreground">{existingDocument ? "Uploaded" : "Not uploaded yet"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {existingDocument && (
          <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
            <a href={getFileUrl(existingDocument.fileUrl)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View
            </a>
          </Button>
        )}
        <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={handleFileSelect} className="hidden" />
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          {isUploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
          {existingDocument ? "Replace" : "Upload"}
        </Button>
      </div>
    </div>
  );
}
