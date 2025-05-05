import { useEffect, useState } from "react";
import { CheckCircle, Clock, Check } from "lucide-react";
import { getProcessingStatus } from "@/lib/gemini";
import { useToast } from "@/hooks/use-toast";

interface ProcessingProps {
  documentId: number;
  onComplete: () => void;
}

interface ProcessingStep {
  id: string;
  label: string;
  description: string;
  progressThreshold: number;
}

const processingSteps: ProcessingStep[] = [
  {
    id: "parsing",
    label: "Analyzing document structure",
    description: "Parsing your document format",
    progressThreshold: 25,
  },
  {
    id: "extracting",
    label: "Extracting key information",
    description: "Identifying your skills and experience",
    progressThreshold: 50,
  },
  {
    id: "matching",
    label: "Matching to job requirements",
    description: "Aligning your profile with the job description",
    progressThreshold: 75,
  },
  {
    id: "generating",
    label: "Generating final document",
    description: "Maintaining your original formatting",
    progressThreshold: 100,
  },
];

export default function Processing({ documentId, onComplete }: ProcessingProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"processing" | "completed" | "failed">("processing");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let interval: number | undefined;
    let retries = 0;
    const maxRetries = 3;

    const checkStatus = async () => {
      try {
        const result = await getProcessingStatus(documentId);
        setProgress(result.progress);
        setStatus(result.status as "processing" | "completed" | "failed");

        if (result.errorMessage) {
          setError(result.errorMessage);
          clearInterval(interval);
          retries = 0;
        }

        if (result.status === "completed") {
          clearInterval(interval);
          retries = 0;
          // Wait a moment before moving to the next step
          setTimeout(onComplete, 1000);
        }

        if (result.status === "failed") {
          clearInterval(interval);
          retries = 0;
          toast({
            title: "Processing failed",
            description: result.errorMessage || "Failed to process document",
            variant: "destructive",
          });
        }
      } catch (err) {
        retries++;
        console.error("Failed to check processing status:", err);

        if (retries >= maxRetries) {
          clearInterval(interval);
          setStatus("failed");
          setError("Failed to check processing status");
          toast({
            title: "Processing failed",
            description: "Failed to check processing status",
            variant: "destructive",
          });
        }
      }
    };

    // Start checking status immediately
    checkStatus();
    
    // Then check every 2 seconds
    interval = window.setInterval(checkStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [documentId, onComplete, toast]);

  if (status === "failed") {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500 text-white mb-4">
          <span className="text-3xl">×</span>
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing Failed</h3>
        <p className="text-gray-600 mb-4">{error || "There was an error processing your document"}</p>
        
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500 text-white mb-4">
          <CheckCircle className="h-8 w-8" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Document Ready!</h3>
        <p className="text-gray-600">Your tailored document has been created successfully</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-8">
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 rounded-full border-4 border-t-primary border-primary-200 animate-spin"></div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Tailoring Your Document</h3>
      <p className="text-gray-600 mb-6">Please wait while our AI analyzes and customizes your document for this specific job</p>
      
      {/* Processing Steps */}
      <div className="max-w-md mx-auto space-y-3 text-left">
        {processingSteps.map((step) => (
          <div className="flex items-start space-x-3" key={step.id}>
            <div className={progress >= step.progressThreshold ? "text-green-500" : "text-gray-400"}>
              {progress >= step.progressThreshold ? (
                <Check className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{step.label}</p>
              <p className="text-xs text-gray-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">Processing: {progress}%</p>
      </div>
    </div>
  );
}
