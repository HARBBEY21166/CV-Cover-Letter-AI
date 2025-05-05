import { useState } from "react";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import StepIndicator from "@/components/ui/StepIndicator";
import FeatureCard from "@/components/ui/FeatureCard";
import TestimonialCard from "@/components/ui/TestimonialCard";
import JobDetails from "@/components/steps/JobDetails";
import Processing from "@/components/steps/Processing";
import Results from "@/components/steps/Results";
import TextInputForm from "@/components/steps/TextInputForm";
import TemplateSelector, { Template } from "@/components/steps/TemplateSelector";
import { DocumentType } from "@/lib/types";
import { Sparkles, FileText, Clock } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState(1);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [documentType, setDocumentType] = useState<DocumentType>("cv");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const handleTextInputComplete = (id: number, name: string, type: DocumentType) => {
    setDocumentId(id);
    setFileName(name);
    setDocumentType(type);
    // Skip template selection step - go directly to job details
    setStep(3);
  };

  const handleTemplateSelected = (template: Template) => {
    setSelectedTemplate(template);
    setStep(3);
  };

  const handleJobDetailsComplete = (id: number) => {
    setDocumentId(id);
    setStep(4);
  };

  const handleProcessingComplete = () => {
    setStep(5);
  };

  const handleReset = () => {
    setStep(1);
    setDocumentId(null);
    setFileName("");
    setDocumentType("cv");
    setSelectedTemplate(null);
  };

  return (
    <div className="min-h-screen pb-12">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Introduction Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Tailor Your CV & Cover Letter with AI</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Enter your document content and job description - our AI will customize your application to match the role perfectly.
          </p>
        </div>

        {/* Application Workflow */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Step Progress Indicator */}
          <div className="bg-gray-50 px-6 py-4 border-b">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <StepIndicator step={1} currentStep={step} label="Document" />
              
              <div className={`w-12 h-0.5 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}></div>
              
              <StepIndicator step={2} currentStep={step} label="Template" />
              
              <div className={`w-12 h-0.5 ${step >= 3 ? "bg-primary" : "bg-gray-200"}`}></div>
              
              <StepIndicator step={3} currentStep={step} label="Job Details" />
              
              <div className={`w-12 h-0.5 ${step >= 4 ? "bg-primary" : "bg-gray-200"}`}></div>
              
              <StepIndicator step={4} currentStep={step} label="Processing" />
              
              <div className={`w-12 h-0.5 ${step >= 5 ? "bg-primary" : "bg-gray-200"}`}></div>
              
              <StepIndicator step={5} currentStep={step} label="Results" />
            </div>
          </div>

          {/* Step Content Container */}
          <div className="p-6">
            {step === 1 && (
              <TextInputForm onComplete={handleTextInputComplete} />
            )}

            {step === 2 && documentId && (
              <TemplateSelector 
                documentType={documentType}
                onSelectTemplate={handleTemplateSelected}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && documentId && (
              <JobDetails 
                documentId={documentId}
                onBack={() => setStep(1)} 
                onComplete={handleJobDetailsComplete} 
              />
            )}

            {step === 4 && documentId && (
              <Processing 
                documentId={documentId} 
                onComplete={handleProcessingComplete} 
              />
            )}

            {step === 5 && documentId && (
              <Results 
                documentId={documentId} 
                onReset={handleReset} 
              />
            )}
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our AI-Powered Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Sparkles}
              title="AI-Powered Tailoring"
              description="Our AI uses Google Gemini to intelligently rewrite your documents to match specific job requirements."
            />
            
            <FeatureCard
              icon={FileText}
              title="Custom Cover Letters"
              description="Generate perfectly tailored cover letters based on your resume and job descriptions."
            />
            
            <FeatureCard
              icon={Clock}
              title="Fast Processing"
              description="Get your tailored documents in minutes, saving you hours of manual editing work."
            />
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">What Our Users Say</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TestimonialCard
              name="Sarah J."
              role="Software Engineer"
              quote="I landed 3 interviews after using this tool to tailor my resume. The AI perfectly highlighted my relevant experience for each job."
              imageUrl=""
            />
            
            <TestimonialCard
              name="Michael T."
              role="Marketing Specialist"
              quote="This saved me hours of tweaking my cover letter for each application. The content was spot-on and matched exactly what the job required."
              imageUrl=""
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}