import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema - kept from original
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Document schema for uploaded files
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // docx, pdf, gdoc
  documentType: text("document_type").notNull(), // cv, cover
  originalContent: text("original_content").notNull(),
  tailoredContent: text("tailored_content"),
  jobTitle: text("job_title"),
  company: text("company"),
  jobDescription: text("job_description"),
  status: text("status").notNull().default("pending"), // pending, processing, completed
  createdAt: text("created_at").notNull().default("NOW()"),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  tailoredContent: true,
  status: true,
  createdAt: true,
});

// Job schema for defining job details
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  documentId: integer("document_id").notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
});

// Processing schema for tracking document processing
export const processing = pgTable("processing", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  errorMessage: text("error_message"),
});

export const insertProcessingSchema = createInsertSchema(processing).omit({
  id: true,
  progress: true,
  status: true,
  errorMessage: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertProcessing = z.infer<typeof insertProcessingSchema>;
export type Processing = typeof processing.$inferSelect;
