import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileDown, 
  File, 
  RefreshCw,
  FileText,
  FileIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDocument, getDownloadUrl } from "@/lib/gemini";
import { highlightDifferences, getDocumentTypeLabel } from "@/lib/docUtils";
import { PreviewTab, DocumentResult, ExportFormat } from "@/lib/types";

interface ResultsProps {
  documentId: number;
  onReset: () => void;
}

export default function Results({ documentId, onReset }: ResultsProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("original");
  const [documentData, setDocumentData] = useState<DocumentResult | null>(null);
  const [differences, setDifferences] = useState<{ 
    added: string[]; 
    removed: string[]; 
    modified: string[] 
  }>({ added: [], removed: [], modified: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const data = await getDocument(documentId);
        setDocumentData(data);
        
        // Calculate differences between original and tailored content
        if (data.document.originalContent && data.document.tailoredContent) {
          const diffs = highlightDifferences(
            data.document.originalContent,
            data.document.tailoredContent
          );
          setDifferences(diffs);
        }
      } catch (error) {
        toast({
          title: "Failed to load document",
          description: error instanceof Error ? error.message : "Failed to load your document",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId, toast]);

  const handleDownload = (format: ExportFormat) => {
    if (!documentData) return;
    
    const downloadUrl = getDownloadUrl(documentId, format);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${documentData.document.fileName}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load document data.</p>
        <Button onClick={onReset} className="mt-4">Start Over</Button>
      </div>
    );
  }

  const { document, job } = documentData;

  return (
    <div className="max-w-5xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Tailored Document</h3>
      
      {/* Document Preview and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Document Preview */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PreviewTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="original">Original</TabsTrigger>
              <TabsTrigger value="tailored">Tailored</TabsTrigger>
              <TabsTrigger value="diff">Changes</TabsTrigger>
            </TabsList>

            <div className="bg-white border rounded-lg overflow-hidden">
              <TabsContent value="original" className="p-4 h-[600px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{document.originalContent}</pre>
              </TabsContent>

              <TabsContent value="tailored" className="p-4 h-[600px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{document.tailoredContent}</pre>
              </TabsContent>

              <TabsContent value="diff" className="p-4 h-[600px] overflow-y-auto">
                <div className="space-y-4">
                  {differences.added.length > 0 && (
                    <div className="p-3 border rounded-md bg-green-50 border-green-200">
                      <div className="text-sm text-gray-600 mb-1">Added:</div>
                      {differences.added.map((item, i) => (
                        <p key={`added-${i}`} className="text-green-700 font-medium">{item}</p>
                      ))}
                    </div>
                  )}
                  
                  {differences.removed.length > 0 && (
                    <div className="p-3 border rounded-md bg-red-50 border-red-200">
                      <div className="text-sm text-gray-600 mb-1">Removed:</div>
                      {differences.removed.map((item, i) => (
                        <p key={`removed-${i}`} className="text-red-700 font-medium">{item}</p>
                      ))}
                    </div>
                  )}
                  
                  {differences.modified.length > 0 && (
                    <div className="p-3 border rounded-md bg-yellow-50 border-yellow-200">
                      <div className="text-sm text-gray-600 mb-1">Modified:</div>
                      {differences.modified.map((item, i) => (
                        <p key={`modified-${i}`} className="text-yellow-700 font-medium">{item}</p>
                      ))}
                    </div>
                  )}

                  {differences.added.length === 0 && 
                   differences.removed.length === 0 && 
                   differences.modified.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No significant changes detected
                    </p>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Right: Actions & Options */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 border">
            <h4 className="text-lg font-medium text-gray-800 mb-4">Document Info</h4>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Document Type</p>
                <p className="font-medium text-gray-800">
                  {getDocumentTypeLabel(document.documentType)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Job Position</p>
                <p className="font-medium text-gray-800">{job.title}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium text-gray-800">{job.company}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Relevance Score</p>
                <div className="flex items-center mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-500 h-2.5 rounded-full" 
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700">85%</span>
                </div>
              </div>
            </div>
            
            <h4 className="text-lg font-medium text-gray-800 mb-3">Download Options</h4>
            
            {/* Download Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => handleDownload("docx")}
              >
                <FileText className="h-4 w-4" />
                Download as DOCX
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => handleDownload("pdf")}
              >
                <File className="h-4 w-4" />
                Download as PDF
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => handleDownload("gdoc")}
              >
                <FileIcon className="h-4 w-4" />
                Save to Google Docs
              </Button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2"
                onClick={onReset}
              >
                <RefreshCw className="h-4 w-4" />
                Start Over
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
