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
import { getDocument, getDownloadUrl, getViewUrl } from "@/lib/gemini";
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
    // Use window.document instead of document to avoid confusion with documentData.document
    const link = window.document.createElement("a");
    link.href = downloadUrl;
    link.download = `${documentData.document.fileName}.${format}`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
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
                {document.fileType === 'pdf' ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Original PDF Document</h4>
                      <p className="text-gray-700 text-sm">Your uploaded PDF document:</p>
                    </div>
                    
                    <iframe 
                      src={getViewUrl(documentId)} 
                      className="w-full h-[450px] border border-gray-200 rounded" 
                      title="Original Document PDF"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Original Document Content</h4>
                      <p className="text-gray-700 text-sm">Your uploaded document content:</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-md p-4 bg-white">
                      <pre className="whitespace-pre-wrap text-sm font-serif">{document.originalContent || "No content available."}</pre>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tailored" className="p-4 h-[600px] overflow-y-auto">
                {document.fileType === 'pdf' ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                      <h4 className="font-medium text-amber-800 mb-2">Tailored Content Preview</h4>
                      <p className="text-amber-700 text-sm">We've generated tailored content for you below:</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-md p-4 bg-white">
                      <pre className="whitespace-pre-wrap text-sm font-serif">{document.tailoredContent || "No tailored content available."}</pre>
                    </div>
                    
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-500 mb-2">You can download this content as a text file:</p>
                      <Button onClick={() => handleDownload("pdf")} size="sm">
                        Download Tailored Content
                      </Button>
                    </div>
                  </div>
                ) : document.documentType === 'both' ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md p-4 mb-4">
                      <h4 className="font-medium text-blue-800 mb-2">CV and Cover Letter</h4>
                      <p className="text-blue-700 text-sm">We've generated both a tailored CV and a matching cover letter:</p>
                    </div>
                    
                    {document.tailoredContent && document.tailoredContent.includes("=== TAILORED CV/RESUME ===") ? (
                      <div>
                        {document.tailoredContent.split("=== TAILORED CV/RESUME ===")[1]
                          .split("=== COVER LETTER ===")
                          .map((content, index) => (
                            <div key={index} className="mb-6">
                              <div className="bg-white border border-gray-200 rounded-md p-4 mb-2">
                                <h5 className="font-medium text-gray-800 mb-2">
                                  {index === 0 ? "Tailored CV/Resume" : "Cover Letter"}
                                </h5>
                                <pre className="whitespace-pre-wrap text-sm font-serif">{content.trim()}</pre>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-md p-4 bg-white">
                        <pre className="whitespace-pre-wrap text-sm font-serif">{document.tailoredContent || "No tailored content available."}</pre>
                      </div>
                    )}
                    
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-500 mb-2">Download your documents:</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => handleDownload("docx")} size="sm">DOCX</Button>
                        <Button onClick={() => handleDownload("pdf")} size="sm">PDF</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                      <h4 className="font-medium text-blue-800 mb-2">Tailored Content Preview</h4>
                      <p className="text-blue-700 text-sm">We've tailored your document content based on the job requirements:</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-md p-4 bg-white">
                      <pre className="whitespace-pre-wrap text-sm font-serif">{document.tailoredContent || "No tailored content available."}</pre>
                    </div>
                    
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-500 mb-2">Download the tailored document:</p>
                      <div className="flex gap-2 justify-center">
                        <Button onClick={() => handleDownload("docx")} size="sm">DOCX</Button>
                        <Button onClick={() => handleDownload("pdf")} size="sm">PDF</Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="diff" className="p-4 h-[600px] overflow-y-auto">
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4 mb-4">
                    <h4 className="font-medium text-indigo-800 mb-2">Document Differences</h4>
                    <p className="text-indigo-700 text-sm">Here's how your document has been tailored to match the job requirements:</p>
                  </div>
                
                  {(differences.added.length > 0 || 
                    differences.removed.length > 0 || 
                    differences.modified.length > 0) ? (
                    <div className="space-y-6">
                      {differences.added.length > 0 && (
                        <div className="border rounded-md overflow-hidden">
                          <div className="bg-green-100 px-4 py-2 border-b border-green-200">
                            <h5 className="font-medium text-green-800">Added Content</h5>
                            <p className="text-xs text-green-700">New content that emphasizes relevant skills and experiences</p>
                          </div>
                          <div className="p-4 bg-green-50">
                            {differences.added.map((item, i) => (
                              <div key={`added-${i}`} className="mb-2 last:mb-0">
                                <p className="text-green-800 text-sm border-l-2 border-green-500 pl-3 py-1">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {differences.removed.length > 0 && (
                        <div className="border rounded-md overflow-hidden">
                          <div className="bg-red-100 px-4 py-2 border-b border-red-200">
                            <h5 className="font-medium text-red-800">Removed Content</h5>
                            <p className="text-xs text-red-700">Content that was less relevant to this specific job</p>
                          </div>
                          <div className="p-4 bg-red-50">
                            {differences.removed.map((item, i) => (
                              <div key={`removed-${i}`} className="mb-2 last:mb-0">
                                <p className="text-red-800 text-sm border-l-2 border-red-500 pl-3 py-1 line-through opacity-75">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {differences.modified.length > 0 && (
                        <div className="border rounded-md overflow-hidden">
                          <div className="bg-amber-100 px-4 py-2 border-b border-amber-200">
                            <h5 className="font-medium text-amber-800">Modified Content</h5>
                            <p className="text-xs text-amber-700">Content that was rephrased to better match job requirements</p>
                          </div>
                          <div className="p-4 bg-amber-50">
                            {differences.modified.map((item, i) => (
                              <div key={`modified-${i}`} className="mb-2 last:mb-0">
                                <p className="text-amber-800 text-sm border-l-2 border-amber-500 pl-3 py-1">{item}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border rounded-md p-8 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <RefreshCw className="h-8 w-8 text-gray-400" />
                      </div>
                      <h5 className="text-lg font-medium text-gray-700 mb-2">No Significant Changes</h5>
                      <p className="text-gray-500 max-w-md mx-auto">
                        We didn't detect significant differences between your original and tailored documents.
                        This could mean your document was already well-aligned with the job requirements.
                      </p>
                    </div>
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
