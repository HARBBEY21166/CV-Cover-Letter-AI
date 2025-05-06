import fs from 'fs';
import path from 'path';
import { log } from './vite';

// File retention time: 4 hours in milliseconds
const FILE_RETENTION_MS = 4 * 60 * 60 * 1000;

// Directory where uploads are stored
const uploadsDir = path.join(process.cwd(), 'uploads');

/**
 * Cleans up files in the uploads directory that are older than the specified retention period
 */
function cleanupOldFiles() {
  try {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return;
    }

    // Get current time
    const now = Date.now();
    
    // Read all files in the uploads directory
    const files = fs.readdirSync(uploadsDir);
    
    let deletedCount = 0;
    
    // Check each file
    for (const file of files) {
      try {
        const filePath = path.join(uploadsDir, file);
        
        // Get file stats
        const stats = fs.statSync(filePath);
        
        // Calculate file age
        const fileAge = now - stats.mtimeMs;
        
        // Delete files older than retention period
        if (fileAge > FILE_RETENTION_MS) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        log(`Error processing file ${file}: ${err}`);
      }
    }
    
    if (deletedCount > 0) {
      log(`Cleanup: Deleted ${deletedCount} files older than 4 hours from uploads directory`);
    }
  } catch (err) {
    log(`Error during file cleanup: ${err}`);
  }
}

/**
 * Schedules the cleanup to run periodically
 */
export function scheduleFileCleanup() {
  // Run cleanup immediately on startup
  cleanupOldFiles();
  
  // Schedule cleanup to run every hour
  // Using setInterval is appropriate since this is a long-running Node.js server
  const ONE_HOUR_MS = 60 * 60 * 1000;
  setInterval(cleanupOldFiles, ONE_HOUR_MS);
  
  log('File cleanup scheduler started (4 hour retention)');
}