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
  insertTemplateSchema,
  templates,
  type Document
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
      
      // Validate job details and template
      const jobSchema = z.object({
        title: z.string().min(1),
        company: z.string().min(1),
        description: z.string().min(10),
        templateId: z.number().optional(),
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
      
      // Update document with job info and template ID if provided
      const updateData: Partial<Document> = {
        jobTitle: jobData.title,
        company: jobData.company,
        jobDescription: jobData.description,
        status: "processing",
      };
      
      if (jobData.templateId) {
        updateData.templateId = jobData.templateId;
      }
      
      await storage.updateDocument(documentId, updateData);
      
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

  // Create document directly from text input
  apiRouter.post("/documents/create-from-text", async (req, res) => {
    try {
      const { content, fileName, documentType } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      if (!fileName) {
        return res.status(400).json({ message: "File name is required" });
      }
      
      // Create a text file with the content
      const filePath = path.join(uploadsDir, `${Date.now()}-${fileName}`);
      fs.writeFileSync(filePath, content);
      
      // Create document entry
      const document = await storage.createDocument({
        fileName,
        fileType: "txt",
        documentType,
        originalFilePath: filePath,
        originalContent: content,
        userId: null,
      });
      
      res.json({
        id: document.id,
        fileName: document.fileName,
        fileType: document.fileType,
        documentType: document.documentType,
      });
    } catch (error) {
      console.error("Create document error:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  // Update document content (for manual text entry)
  apiRouter.post("/documents/:id/content", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      // Get the document
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Update the document with the provided content
      const updatedDoc = await storage.updateDocument(documentId, {
        originalContent: content,
      });
      
      res.json({
        success: true,
        document: updatedDoc,
      });
    } catch (error) {
      console.error("Content update error:", error);
      res.status(500).json({ message: "Failed to update document content" });
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

      // Use the tailored file if available, otherwise use the original
      const filePath = document.tailoredFilePath && fs.existsSync(document.tailoredFilePath) 
        ? document.tailoredFilePath 
        : document.originalFilePath;
      
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Set content type based on file extension
      let contentType = "application/octet-stream"; // Default binary
      if (document.fileType === "pdf") {
        contentType = "application/pdf";
      } else if (document.fileType === "docx") {
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
      
      // Set headers for download
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${document.fileName}"`);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // View document (for PDF preview)
  apiRouter.get("/documents/:id/view", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      // Get document
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Use the tailored file if available, otherwise use the original
      const filePath = document.tailoredFilePath && fs.existsSync(document.tailoredFilePath) 
        ? document.tailoredFilePath 
        : document.originalFilePath;
      
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      // Set content type based on file extension
      let contentType = "application/octet-stream"; // Default binary
      if (document.fileType === "pdf") {
        contentType = "application/pdf";
      } else if (document.fileType === "docx") {
        contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }
      
      // Set headers for inline viewing (not download)
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename="${document.fileName}"`);
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("View error:", error);
      res.status(500).json({ message: "Failed to view document" });
    }
  });

  // Templates endpoints
  // Get all templates
  apiRouter.get("/templates", async (req, res) => {
    try {
      const { documentType } = req.query;
      
      // Get all templates, filtered by document type if provided
      const allTemplates = await storage.getTemplates(documentType as string);
      
      res.json(allTemplates);
    } catch (error) {
      console.error("Templates retrieval error:", error);
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  // Get template by ID
  apiRouter.get("/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      
      // Get template
      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Template retrieval error:", error);
      res.status(500).json({ message: "Failed to get template" });
    }
  });

  // Create new template
  apiRouter.post("/templates", async (req, res) => {
    try {
      // Validate template data
      const templateData = insertTemplateSchema.parse(req.body);
      
      // Create template
      const template = await storage.createTemplate(templateData);
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Template creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid template data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Update template
  apiRouter.put("/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      
      // Validate template data
      const templateData = insertTemplateSchema.parse(req.body);
      
      // Update template
      const updatedTemplate = await storage.updateTemplate(templateId, templateData);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Template update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid template data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  // Delete template
  apiRouter.delete("/templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      
      // Delete template
      await storage.deleteTemplate(templateId);
      
      res.status(204).send();
    } catch (error) {
      console.error("Template deletion error:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Serve uploaded files statically (alternative approach)
  app.use('/uploads', express.static(uploadsDir));

  // Register API routes
  app.use("/api", apiRouter);

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}

// No longer using templates

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
    let content = "";
    if (document.originalContent) {
      // Use existing content if available (from manual text entry)
      content = document.originalContent;
      console.log("Using manually entered content:", content.substring(0, 100) + "...");
    } else if (document.originalFilePath && fs.existsSync(document.originalFilePath)) {
      // Try to extract content from file if path exists
      if (document.fileType === "pdf") {
        // For PDFs, we should already have content from manual entry
        // But if not, we'll need PDF extraction libraries
        content = "PDF content should be entered manually. If you're seeing this, please go back and enter your document content.";
        console.log("PDF without manual content entry detected");
      } else if (document.fileType === "docx") {
        try {
          // Basic text extraction from DOCX
          // In a production app, we'd use proper docx.js parsing
          // This is a placeholder that at least provides some content
          const fileContent = fs.readFileSync(document.originalFilePath, 'utf8');
          content = fileContent.replace(/[^\x20-\x7E]/g, ' ').trim();
          
          // If content is still empty or invalid, use a message
          if (!content || content.length < 50) {
            content = "Your resume or CV content would be extracted here. The current implementation has limited DOCX parsing.";
          }
          
          console.log("Extracted DOCX content:", content.substring(0, 100) + "...");
        } catch (err) {
          console.error("Error extracting DOCX content:", err);
          content = "Failed to extract content from DOCX file. Please try manually entering your document content.";
        }
      }
    }
    
    if (!content) {
      throw new Error("Could not extract content from document");
    }
    
    // Update progress
    await storage.updateProcessing(processingId, { progress: 30 });
    
    // Use Gemini to tailor the content - no templates
    // Prepare prompt for Gemini
    const prompt = `
You are a professional document tailoring assistant with expertise in helping job applicants match their experience to specific job requirements.

TASK:
${document.documentType === 'cv' 
  ? 'Tailor this CV/Resume for a specific job opening.' 
  : 'Create a professional cover letter based on this resume for a specific job opening.'}

JOB DETAILS:
- Title: ${job.title}
- Company: ${job.company}
- Description: ${job.description}

ORIGINAL DOCUMENT CONTENT:
${content}

INSTRUCTIONS:
${document.documentType === 'cv' 
  ? `1. Analyze my CV/resume and the job description to identify alignment between my skills and the job requirements.
2. Rewrite my CV content to emphasize relevant skills, experiences, and achievements that match this specific job.
3. Use relevant keywords from the job description naturally throughout the CV.
4. Preserve the original sections and structure where possible (e.g., Education, Experience, Skills).
5. Make sure to adjust bullet points to highlight accomplishments that relate to this position.
6. Only include information from my original document - do not invent new experiences or skills.`
  : `1. Create a professional cover letter addressed to the hiring manager at ${job.company} for the ${job.title} position.
2. Use relevant keywords from the job description in a natural way.
3. Structure the letter with: formal header, introduction explaining my interest, 1-2 paragraphs highlighting relevant experiences/skills from my resume, and a conclusion.
4. Keep the tone professional but engaging.
5. Use information from my resume to highlight my qualifications - do not invent new qualifications.
6. Include a clear call to action in the closing paragraph.
7. Format as a proper business letter with date, address block, salutation, and professional closing.`
}

IMPORTANT FORMATTING:
1. Output format: Return ONLY the ${document.documentType === 'cv' ? 'rewritten CV/Resume' : 'complete cover letter'}.
2. DO NOT include any explanations, headers like "REWRITTEN CONTENT:", or notes.
3. ${document.documentType === 'cover' ? 'Make sure this is a proper cover letter, not a resume/CV.' : 'Make sure this is a properly formatted resume/CV.'}
`;
    
    // Update progress
    await storage.updateProcessing(processingId, { progress: 50 });
    
    // Call Gemini API to rewrite content
    const result = await model.generateContent(prompt);
    const tailoredContent = result.response.text();
    console.log("Generated content from AI, length:", tailoredContent.length);
    
    // Update progress - skip template application
    await storage.updateProcessing(processingId, { progress: 80 });
    
    // Save tailored content
    const tailoredFileName = `tailored-${Date.now()}-${document.fileName}`;
    const tailoredFilePath = path.join(uploadsDir, tailoredFileName);
    fs.writeFileSync(tailoredFilePath, tailoredContent);
    
    // Update progress
    await storage.updateProcessing(processingId, { progress: 90 });
    
    // Update document with tailored content and file path
    await storage.updateDocument(documentId, {
      tailoredContent,
      tailoredFilePath,
      status: "completed",
    });
    
    // Complete processing
    await storage.updateProcessing(processingId, {
      status: "completed",
      progress: 100,
    });
    
    console.log(`Document processing completed for document ID: ${documentId}`);
  } catch (error) {
    console.error("Document processing error:", error);
    
    try {
      // Update processing with error
      await storage.updateProcessing(processingId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error occurred",
      });
      
      // Update document status
      await storage.updateDocument(documentId, {
        status: "failed",
      });
    } catch (updateError) {
      console.error("Failed to update error status:", updateError);
    }
  }
}
