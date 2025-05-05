import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  insertDocumentSchema,
  insertJobSchema,
  insertProcessingSchema,
} from "@shared/schema";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  const apiRouter = express.Router();

  // Document upload endpoint
  apiRouter.post("/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { documentType } = req.body;
      const fileName = req.file.originalname;
      const fileType = path.extname(fileName).slice(1).toLowerCase();
      
      // Validate supported file types
      if (!["docx", "pdf", "gdoc"].includes(fileType)) {
        return res.status(400).json({ 
          message: "Unsupported file type. Please upload DOCX, PDF, or Google Doc" 
        });
      }

      // Store file path instead of content
      const originalFilePath = req.file.path;

      // Extract content for text-based files if needed
      let originalContent = null;
      if (fileType === "docx") {
        try {
          // For docx files, we'll implement proper parsing later
          // For now, leave as null
        } catch (err) {
          console.error("Failed to extract content from DOCX:", err);
        }
      }

      // Save document to storage with file path instead of content
      const document = await storage.createDocument({
        fileName,
        fileType,
        documentType,
        originalFilePath,
        originalContent,
        userId: null,
      });

      res.json({
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        documentType: document.documentType,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // Save job details and process document
  apiRouter.post("/documents/:id/process", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      // Validate job details
      const jobSchema = z.object({
        title: z.string().min(1),
        company: z.string().min(1),
        description: z.string().min(10),
      });
      
      const jobData = jobSchema.parse(req.body);
      
      // Get the document
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Create job
      const job = await storage.createJob({
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        documentId,
      });
      
      // Create processing record
      const processing = await storage.createProcessing({
        documentId,
      });
      
      // Update document with job info
      await storage.updateDocument(documentId, {
        jobTitle: jobData.title,
        company: jobData.company,
        jobDescription: jobData.description,
        status: "processing",
      });
      
      // Start processing document (async)
      processDocument(documentId, job.id, processing.id);
      
      res.json({
        documentId,
        jobId: job.id,
        processingId: processing.id,
        status: "processing",
      });
    } catch (error) {
      console.error("Processing error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid job details", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to process document" });
    }
  });

  // Get document processing status
  apiRouter.get("/documents/:id/status", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      // Get processing status
      const processing = await storage.getProcessingByDocument(documentId);
      if (!processing) {
        return res.status(404).json({ message: "Processing not found" });
      }
      
      res.json({
        documentId,
        status: processing.status,
        progress: processing.progress,
        errorMessage: processing.errorMessage,
      });
    } catch (error) {
      console.error("Status error:", error);
      res.status(500).json({ message: "Failed to get processing status" });
    }
  });

  // Get processed document
  apiRouter.get("/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      // Get document
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Get job details
      const job = await storage.getJobByDocument(documentId);
      
      res.json({
        document,
        job,
      });
    } catch (error) {
      console.error("Document retrieval error:", error);
      res.status(500).json({ message: "Failed to get document" });
    }
  });

  // Download document
  apiRouter.get("/documents/:id/download/:format", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const format = req.params.format;
      
      // Validate format
      if (!["docx", "pdf", "gdoc"].includes(format)) {
        return res.status(400).json({ message: "Unsupported download format" });
      }
      
      // Get document
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // In a real implementation, we would create the requested file format
      // For now we just return the tailored content as a text file
      const content = document.tailoredContent || document.originalContent;
      
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename="${document.fileName}"`);
      res.send(content);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Register API routes
  app.use("/api", apiRouter);

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

// Helper function to process document using Gemini API
async function processDocument(documentId: number, jobId: number, processingId: number) {
  try {
    // Get document and job
    const document = await storage.getDocument(documentId);
    const job = await storage.getJob(jobId);
    
    if (!document || !job) {
      await storage.updateProcessing(processingId, {
        status: "failed",
        errorMessage: "Document or job not found",
      });
      return;
    }
    
    // Update processing status to started
    await storage.updateProcessing(processingId, {
      status: "processing",
      progress: 10,
    });
    
    // Extract content from document
    const content = document.originalContent;
    
    // Update progress
    await storage.updateProcessing(processingId, { progress: 30 });
    
    // Prepare prompt for Gemini
    const prompt = `
      You are a professional document tailoring assistant. I have a ${document.documentType === 'cv' ? 'CV/Resume' : 'Cover Letter'} 
      that I want to tailor for a job application.
      
      The job title is: ${job.title}
      The company is: ${job.company}
      The job description is: ${job.description}
      
      Here is my original document content:
      ${content}
      
      Please analyze my document and rewrite it to better match the job requirements.
      Focus on highlighting relevant skills and experiences that align with the job description.
      Preserve the original formatting and structure as much as possible.
      Return only the rewritten content.
    `;
    
    // Update progress
    await storage.updateProcessing(processingId, { progress: 50 });
    
    // Call Gemini API to rewrite content
    const result = await model.generateContent(prompt);
    const tailoredContent = result.response.text();
    
    // Update progress
    await storage.updateProcessing(processingId, { progress: 75 });
    
    // Update document with tailored content
    await storage.updateDocument(documentId, {
      tailoredContent,
      status: "completed",
    });
    
    // Complete processing
    await storage.updateProcessing(processingId, {
      status: "completed",
      progress: 100,
    });
    
  } catch (error) {
    console.error("Document processing error:", error);
    // Update processing with error
    await storage.updateProcessing(processingId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    
    // Update document status
    await storage.updateDocument(documentId, {
      status: "failed",
    });
  }
}
