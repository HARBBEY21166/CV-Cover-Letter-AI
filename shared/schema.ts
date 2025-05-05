import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  userId: integer("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // docx, pdf, gdoc
  documentType: text("document_type").notNull(), // cv, cover
  originalContent: text("original_content").notNull(),
  tailoredContent: text("tailored_content"),
  jobTitle: text("job_title"),
  company: text("company"),
  jobDescription: text("job_description"),
  status: text("status").notNull().default("pending"), // pending, processing, completed
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  documentId: integer("document_id").notNull().references(() => documents.id),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
});

// Processing schema for tracking document processing
export const processing = pgTable("processing", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => documents.id),
  progress: integer("progress").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProcessingSchema = createInsertSchema(processing).omit({
  id: true,
  progress: true,
  status: true,
  errorMessage: true,
  createdAt: true,
});

// Define relations after all tables are defined
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  job: many(jobs),
  processing: many(processing),
}));

export const jobsRelations = relations(jobs, ({ one }) => ({
  document: one(documents, {
    fields: [jobs.documentId],
    references: [documents.id],
  }),
}));

export const processingRelations = relations(processing, ({ one }) => ({
  document: one(documents, {
    fields: [processing.documentId],
    references: [documents.id],
  }),
}));

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertProcessing = z.infer<typeof insertProcessingSchema>;
export type Processing = typeof processing.$inferSelect;
