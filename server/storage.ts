import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  jobs, type Job, type InsertJob,
  processing, type Processing, type InsertProcessing,
  templates, type Template, type InsertTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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

  // Template methods
  getTemplate(id: number): Promise<Template | undefined>;
  getTemplates(documentType?: string): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, updates: Partial<Template>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async getDocumentsByUser(userId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.userId, userId));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const result = await db.insert(documents).values(insertDocument).returning();
    return result[0];
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const result = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return result[0];
  }

  // Job methods
  async getJob(id: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id));
    return result[0];
  }

  async getJobByDocument(documentId: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.documentId, documentId));
    return result[0];
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(insertJob).returning();
    return result[0];
  }

  // Processing methods
  async getProcessing(id: number): Promise<Processing | undefined> {
    const result = await db.select().from(processing).where(eq(processing.id, id));
    return result[0];
  }

  async getProcessingByDocument(documentId: number): Promise<Processing | undefined> {
    const result = await db
      .select()
      .from(processing)
      .where(eq(processing.documentId, documentId));
    return result[0];
  }

  async createProcessing(insertProcessing: InsertProcessing): Promise<Processing> {
    const result = await db.insert(processing).values(insertProcessing).returning();
    return result[0];
  }

  async updateProcessing(id: number, updates: Partial<Processing>): Promise<Processing | undefined> {
    const result = await db
      .update(processing)
      .set(updates)
      .where(eq(processing.id, id))
      .returning();
    return result[0];
  }

  // Template methods
  async getTemplate(id: number): Promise<Template | undefined> {
    const result = await db.select().from(templates).where(eq(templates.id, id));
    return result[0];
  }

  async getTemplates(documentType?: string): Promise<Template[]> {
    if (documentType) {
      return db.select().from(templates).where(eq(templates.documentType, documentType));
    }
    return db.select().from(templates);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const result = await db.insert(templates).values(insertTemplate).returning();
    return result[0];
  }

  async updateTemplate(id: number, updates: Partial<InsertTemplate>): Promise<Template | undefined> {
    const result = await db
      .update(templates)
      .set(updates)
      .where(eq(templates.id, id))
      .returning();
    return result[0];
  }

  async deleteTemplate(id: number): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }
}

// Use the DatabaseStorage implementation
export const storage = new DatabaseStorage();
