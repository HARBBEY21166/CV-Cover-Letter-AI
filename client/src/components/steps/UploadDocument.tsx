import { useState, useRef } from "react";
import { UploadCloud, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatFileSize, getFileTypeIcon } from "@/lib/docUtils";
import { DocumentType } from "@/lib/types";
import { uploadDocument } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

interface UploadDocumentProps {
  onComplete: (documentId: number, fileName: string, documentType: DocumentType, fileExt: string) => void;
}

export default function UploadDocument({ onComplete }: UploadDocumentProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("cv");
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      
      // Validate file type
      if (!['docx', 'doc', 'pdf'].includes(fileExt)) {
        toast({
          title: "Unsupported file type",
          description: "Please upload a DOCX, DOC, or PDF file",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      setFileType(fileExt);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const fileExt = droppedFile.name.split('.').pop()?.toLowerCase() || '';
      
      // Validate file type
      if (!['docx', 'doc', 'pdf'].includes(fileExt)) {
        toast({
          title: "Unsupported file type",
          description: "Please upload a DOCX, DOC, or PDF file",
          variant: "destructive",
        });
        return;
      }
      
      setFile(droppedFile);
      setFileType(fileExt);
    }
  };

  const handleContinue = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a document",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const result = await uploadDocument(file, documentType);
      onComplete(result.id, result.fileName, documentType, fileType);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Upload Your Document</h3>
      
      <div className="mb-6">
        <div
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer ${
            file ? "border-primary/30 bg-primary/5" : "border-gray-300"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            id="document-upload"
            type="file"
            className="hidden"
            accept=".docx,.doc,.pdf"
            onChange={handleFileChange}
          />

          {!file ? (
            <div className="text-center">
              <UploadCloud className="h-12 w-12 text-gray-400 mb-2 mx-auto" />
              <p className="text-gray-700 mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">DOCX, DOC or PDF files</p>
            </div>
          ) : (
            <div className="text-center">
              <FileText className="h-12 w-12 text-primary mb-2 mx-auto" />
              <p className="text-gray-700 font-medium">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {file.name.split('.').pop()?.toUpperCase()} file • {formatFileSize(file.size)}
              </p>
            </div>
          )}
        </div>
        
        {file && (
          <div className="flex justify-center mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
              onClick={() => setFile(null)}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Change document
            </Button>
          </div>
        )}
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium text-gray-700 mb-2">What are you tailoring today?</p>
        
        <RadioGroup
          value={documentType}
          onValueChange={(value) => setDocumentType(value as DocumentType)}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="border rounded-lg p-4 flex items-center cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="cv" id="cv" className="mr-3" />
            <Label htmlFor="cv" className="cursor-pointer flex-1">
              <span className="block text-sm font-medium text-gray-700">CV / Resume</span>
              <span className="block text-xs text-gray-500 mt-1">Highlight your skills and experience</span>
            </Label>
          </div>
          
          <div className="border rounded-lg p-4 flex items-center cursor-pointer hover:bg-gray-50">
            <RadioGroupItem value="cover" id="cover" className="mr-3" />
            <Label htmlFor="cover" className="cursor-pointer flex-1">
              <span className="block text-sm font-medium text-gray-700">Cover Letter</span>
              <span className="block text-xs text-gray-500 mt-1">Explain why you're the perfect fit</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleContinue}
          disabled={!file || uploading}
          className="px-5 py-2"
        >
          {uploading ? "Uploading..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
