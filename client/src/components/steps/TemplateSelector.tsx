import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentType } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export interface Template {
  id: number;
  name: string;
  description: string;
  documentType: DocumentType;
  content: string;
  previewImageUrl?: string;
  isDefault: boolean;
}

interface TemplateSelectorProps {
  documentType: DocumentType;
  onSelectTemplate: (template: Template) => void;
  onBack: () => void;
}

export default function TemplateSelector({ documentType, onSelectTemplate, onBack }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/templates?documentType=${documentType}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch templates");
        }
        
        const data = await response.json();
        
        if (data.length === 0) {
          // If no templates available, create default templates
          await createDefaultTemplates();
          const newResponse = await fetch(`/api/templates?documentType=${documentType}`);
          const newData = await newResponse.json();
          setTemplates(newData);
        } else {
          setTemplates(data);
        }
        
        // Set default template
        const defaultTemplate = data.find((t: Template) => t.isDefault) || data[0];
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        }
      } catch (error) {
        toast({
          title: "Error fetching templates",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [documentType, toast]);

  const createDefaultTemplates = async () => {
    try {
      // Create default CV template
      if (documentType === "cv") {
        await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Professional Resume",
            description: "A clean, professional resume layout suitable for most industries",
            documentType: "cv",
            content: "{{name}}\n{{contact}}\n\nPROFESSIONAL SUMMARY\n{{summary}}\n\nEXPERIENCE\n{{experience}}\n\nEDUCATION\n{{education}}\n\nSKILLS\n{{skills}}",
            isDefault: true,
          }),
        });
        
        await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Modern Resume",
            description: "A contemporary resume design with a creative touch",
            documentType: "cv",
            content: "# {{name}}\n\n**{{contact}}**\n\n## Professional Summary\n{{summary}}\n\n## Skills\n{{skills}}\n\n## Experience\n{{experience}}\n\n## Education\n{{education}}",
            isDefault: false,
          }),
        });
      } 
      // Create default Cover Letter template
      else if (documentType === "cover") {
        await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Traditional Cover Letter",
            description: "A formal cover letter format with proper business letter structure",
            documentType: "cover",
            content: "{{date}}\n\n{{recipientInfo}}\n\nDear {{recipientName}},\n\n{{introduction}}\n\n{{body}}\n\n{{closing}}\n\nSincerely,\n\n{{name}}\n{{signature}}",
            isDefault: true,
          }),
        });
        
        await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Modern Cover Letter",
            description: "A more contemporary cover letter with a conversational tone",
            documentType: "cover",
            content: "# {{name}}\n{{contact}}\n\n{{date}}\n\nDear {{recipientName}},\n\n{{introduction}}\n\n{{body}}\n\n{{closing}}\n\nBest regards,\n{{name}}",
            isDefault: false,
          }),
        });
      }
    } catch (error) {
      console.error("Error creating default templates:", error);
    }
  };

  const handleContinue = () => {
    if (selectedTemplateId === null) {
      toast({
        title: "Please select a template",
        description: "You need to select a template to continue",
        variant: "destructive",
      });
      return;
    }
    
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        Choose a {documentType === "cv" ? "Resume" : "Cover Letter"} Template
      </h3>
      
      <div className="bg-white p-6 rounded-lg border mb-6">
        <RadioGroup 
          value={selectedTemplateId?.toString() || ""} 
          onValueChange={(value) => setSelectedTemplateId(parseInt(value))}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {templates.map((template) => (
            <div key={template.id} className="relative">
              <RadioGroupItem
                value={template.id.toString()}
                id={`template-${template.id}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`template-${template.id}`}
                className="flex flex-col h-full rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <div className="font-semibold mb-1">{template.name}</div>
                <div className="text-sm text-muted-foreground mb-3">{template.description}</div>
                
                {template.previewImageUrl ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-md border">
                    <img
                      src={template.previewImageUrl}
                      alt={template.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative h-40 w-full overflow-hidden rounded-md border bg-gray-100 flex items-center justify-center">
                    <p className="text-sm text-gray-500">Preview not available</p>
                  </div>
                )}
                
                {template.isDefault && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    Default
                  </div>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}