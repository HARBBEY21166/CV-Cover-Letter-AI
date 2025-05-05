import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateDocumentContent } from "@/lib/gemini";

interface ManualTextEntryProps {
  documentId: number;
  fileName: string;
  onComplete: () => void;
  onBack: () => void;
}

export default function ManualTextEntry({ 
  documentId, 
  fileName, 
  onComplete,
  onBack 
}: ManualTextEntryProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Please enter content",
        description: "You need to provide the document content to continue",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      await updateDocumentContent(documentId, content);
      toast({
        title: "Content saved",
        description: "Document content has been saved successfully",
      });
      onComplete();
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
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Enter Document Text</h3>
      
      <div className="bg-white p-6 rounded-lg border mb-6">
        <p className="text-gray-600 mb-4">
          We can't automatically extract text from your PDF file. Please copy and paste the content from <strong>{fileName}</strong> below:
        </p>
        
        <Textarea
          className="min-h-[400px] mb-4"
          placeholder="Paste your document content here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={onBack} disabled={saving}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}