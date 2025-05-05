import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DocumentType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface TextInputFormProps {
  onComplete: (documentId: number, fileName: string, documentType: DocumentType) => void;
}

export default function TextInputForm({ onComplete }: TextInputFormProps) {
  const [content, setContent] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("cv");
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Please enter content",
        description: "You need to provide document content to continue",
        variant: "destructive",
      });
      return;
    }

    if (!fileName.trim()) {
      toast({
        title: "Please enter a file name",
        description: "You need to provide a name for your document",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Instead of uploading a file, we'll create a document directly with the content
      const response = await fetch("/api/documents/create-from-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          fileName: fileName + ".txt",
          documentType,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create document");
      }

      const data = await response.json();
      toast({
        title: "Content saved",
        description: "Your document has been created successfully",
      });
      onComplete(data.id, data.fileName, documentType);
    } catch (error) {
      toast({
        title: "Failed to save content",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Enter Your Document Content</h3>
      
      <div className="bg-white p-6 rounded-lg border mb-6">
        <div className="mb-4">
          <Label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
            Document Name
          </Label>
          <Input
            id="fileName"
            placeholder="My Resume"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="mb-6">
          <RadioGroup
            value={documentType}
            onValueChange={(value) => setDocumentType(value as DocumentType)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4"
          >
            <div className="border rounded-lg p-4 flex items-center cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="cv" id="cv" className="mr-3" />
              <Label htmlFor="cv" className="cursor-pointer flex-1">
                <span className="block text-sm font-medium text-gray-700">CV / Resume</span>
                <span className="block text-xs text-gray-500 mt-1">Tailor your existing resume</span>
              </Label>
            </div>
            
            <div className="border rounded-lg p-4 flex items-center cursor-pointer hover:bg-gray-50">
              <RadioGroupItem value="cover" id="cover" className="mr-3" />
              <Label htmlFor="cover" className="cursor-pointer flex-1">
                <span className="block text-sm font-medium text-gray-700">Cover Letter</span>
                <span className="block text-xs text-gray-500 mt-1">Generate a cover letter from your resume</span>
              </Label>
            </div>
          </RadioGroup>

          <Label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            {documentType === "cv" 
              ? "Paste your resume/CV content here" 
              : "Paste your resume content to generate a matching cover letter"}
          </Label>
          <Textarea
            id="content"
            className="min-h-[300px] mb-4 font-mono text-sm"
            placeholder={documentType === "cv" 
              ? "Paste your resume or CV content here..." 
              : "Paste your resume content here and we'll generate a matching cover letter..."}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}