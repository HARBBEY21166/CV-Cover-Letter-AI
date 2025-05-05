import { apiRequest } from "./queryClient";
import { DocumentUpload, JobDetails, ProcessingInfo, DocumentResult } from "./types";

// Upload document
export async function uploadDocument(
  file: File,
  documentType: string
): Promise<DocumentUpload> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload document");
  }

  return response.json();
}

// Process document with job details
export async function processDocument(
  documentId: number,
  jobDetails: JobDetails
): Promise<{ documentId: number; status: string }> {
  const res = await apiRequest("POST", `/api/documents/${documentId}/process`, jobDetails);
  return res.json();
}

// Get document processing status
export async function getProcessingStatus(
  documentId: number
): Promise<ProcessingInfo> {
  const res = await apiRequest("GET", `/api/documents/${documentId}/status`);
  return res.json();
}

// Get processed document
export async function getDocument(documentId: number): Promise<DocumentResult> {
  const res = await apiRequest("GET", `/api/documents/${documentId}`);
  return res.json();
}

// Generate download URL for document
export function getDownloadUrl(documentId: number, format: string): string {
  return `/api/documents/${documentId}/download/${format}`;
}

// Generate view URL for document (for PDF preview)
export function getViewUrl(documentId: number): string {
  return `/api/documents/${documentId}/view`;
}
