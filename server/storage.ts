import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  jobs, type Job, type InsertJob,
  processing, type Processing, type InsertProcessing
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByUser(userId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  
  // Job methods
  getJob(id: number): Promise<Job | undefined>;
  getJobByDocument(documentId: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  
  // Processing methods
  getProcessing(id: number): Promise<Processing | undefined>;
  getProcessingByDocument(documentId: number): Promise<Processing | undefined>;
  createProcessing(processing: InsertProcessing): Promise<Processing>;
  updateProcessing(id: number, updates: Partial<Processing>): Promise<Processing | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private jobs: Map<number, Job>;
  private processing: Map<number, Processing>;
  private currentUserId: number;
  private currentDocumentId: number;
  private currentJobId: number;
  private currentProcessingId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.jobs = new Map();
    this.processing = new Map();
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentJobId = 1;
    this.currentProcessingId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByUser(userId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (document) => document.userId === userId,
    );
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const now = new Date().toISOString();
    const document: Document = { 
      ...insertDocument, 
      id, 
      status: "pending", 
      createdAt: now,
      tailoredContent: null 
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  // Job methods
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getJobByDocument(documentId: number): Promise<Job | undefined> {
    return Array.from(this.jobs.values()).find(
      (job) => job.documentId === documentId,
    );
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const job: Job = { ...insertJob, id };
    this.jobs.set(id, job);
    return job;
  }

  // Processing methods
  async getProcessing(id: number): Promise<Processing | undefined> {
    return this.processing.get(id);
  }

  async getProcessingByDocument(documentId: number): Promise<Processing | undefined> {
    return Array.from(this.processing.values()).find(
      (processing) => processing.documentId === documentId,
    );
  }

  async createProcessing(insertProcessing: InsertProcessing): Promise<Processing> {
    const id = this.currentProcessingId++;
    const processing: Processing = { 
      ...insertProcessing, 
      id, 
      progress: 0, 
      status: "pending",
      errorMessage: null
    };
    this.processing.set(id, processing);
    return processing;
  }

  async updateProcessing(id: number, updates: Partial<Processing>): Promise<Processing | undefined> {
    const processing = this.processing.get(id);
    if (!processing) return undefined;

    const updatedProcessing = { ...processing, ...updates };
    this.processing.set(id, updatedProcessing);
    return updatedProcessing;
  }
}

export const storage = new MemStorage();
