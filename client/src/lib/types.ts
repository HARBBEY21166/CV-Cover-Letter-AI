export type DocumentType = "cv" | "cover";
export type FileType = "docx" | "pdf" | "gdoc";
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

export interface DocumentUpload {
  id: number;
  fileName: string;
  fileType: FileType;
  documentType: DocumentType;
}

export interface JobDetails {
  title: string;
  company: string;
  description: string;
  templateId?: number;
}

export interface ProcessingInfo {
  documentId: number;
  status: ProcessingStatus;
  progress: number;
  errorMessage?: string;
}

export interface DocumentResult {
  document: {
    id: number;
    fileName: string;
    fileType: FileType;
    documentType: DocumentType;
    originalContent: string;
    tailoredContent: string;
    jobTitle: string;
    company: string;
    jobDescription: string;
    status: ProcessingStatus;
  };
  job: {
    id: number;
    title: string;
    company: string;
    description: string;
    documentId: number;
  };
}

export type PreviewTab = "original" | "tailored" | "diff";
export type ExportFormat = "docx" | "pdf" | "gdoc";
