import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JobDetails as JobDetailsType } from "@/lib/types";
import { processDocument } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

interface JobDetailsProps {
  documentId: number;
  onBack: () => void;
  onComplete: (processingId: number) => void;
}

export default function JobDetails({ documentId, onBack, onComplete }: JobDetailsProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!jobTitle || !company || !jobDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all the job details",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const jobDetails: JobDetailsType = {
        title: jobTitle,
        company,
        description: jobDescription
      };

      const result = await processDocument(documentId, jobDetails);
      onComplete(result.documentId);
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Job Details</h3>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="job-title">Job Title</Label>
          <Input
            id="job-title"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Inc."
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="job-description">Job Description</Label>
          <Textarea
            id="job-description"
            rows={8}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="mt-1"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tip: Include the full job description to help our AI better match your qualifications
          </p>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        
        <Button 
          onClick={handleSubmit}
          disabled={!jobTitle || !company || !jobDescription || submitting}
        >
          {submitting ? "Processing..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
