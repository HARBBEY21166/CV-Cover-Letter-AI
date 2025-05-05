import { Template } from "@shared/schema";

/**
 * Apply template to document content by replacing template variables.
 * 
 * @param templateContent The template content with variables in {{variable}} format
 * @param documentContent The original document content
 * @param documentType The type of document (cv or cover)
 * @param jobDetails Additional job details for the document
 * @returns The processed content with template applied
 */
export function applyTemplate(
  templateContent: string,
  documentContent: string,
  documentType: string,
  jobDetails?: {
    title?: string;
    company?: string;
    description?: string;
  }
): string {
  // Extract basic information from document content
  const contentLines = documentContent.split('\n').filter(line => line.trim());
  const nameMatch = contentLines[0]?.match(/[A-Z][a-z]+ [A-Z][a-z]+/);
  const name = nameMatch ? nameMatch[0] : "Your Name";
  
  // Common template variables
  const variables: Record<string, string> = {
    name,
    content: documentContent,
    // Generic fallbacks - these would ideally be extracted more intelligently
    email: "your.email@example.com",
    phone: "123-456-7890",
    location: "City, State",
    summary: extractSection(documentContent, ["SUMMARY", "PROFILE", "OBJECTIVE", "ABOUT"]) || 
             "Experienced professional with a track record of success...",
    skills: extractSection(documentContent, ["SKILLS", "EXPERTISE", "COMPETENCIES"]) || 
            "Technical Skills, Communication, Leadership",
    experience: extractSection(documentContent, ["EXPERIENCE", "EMPLOYMENT", "WORK"]) || 
                "Professional work history and accomplishments",
    education: extractSection(documentContent, ["EDUCATION", "ACADEMIC"]) || 
               "Degree, Institution, Year",
    certifications: extractSection(documentContent, ["CERTIFICATIONS", "CERTIFICATES"]) || "",
    projects: extractSection(documentContent, ["PROJECTS", "PORTFOLIO"]) || "",
  };
  
  // Add job-specific variables
  if (jobDetails) {
    variables.position = jobDetails.title || "Position";
    variables.companyName = jobDetails.company || "Company";
    variables.jobDescription = jobDetails.description || "";
    
    // For cover letters, add some common cover letter variables
    if (documentType === "cover") {
      variables.date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      variables.recipientName = "Hiring Manager";
      variables.yourName = name;
      variables.paragraphAboutExperience = generateParagraphAboutExperience(documentContent, jobDetails);
      variables.paragraphAboutSkills = generateParagraphAboutSkills(documentContent, jobDetails);
      variables.paragraphAboutCompanyFit = generateParagraphAboutCompanyFit(jobDetails);
    }
  }
  
  // Replace all variables in the template
  let result = templateContent;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  
  return result;
}

/**
 * Extract a section from document content based on common section headers.
 */
function extractSection(content: string, possibleHeaders: string[]): string | null {
  // Try to find a section with one of the given headers
  const contentLines = content.split('\n');
  
  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i].trim().toUpperCase();
    
    // Check if this line contains a section header
    const matchedHeader = possibleHeaders.find(header => line.includes(header));
    if (matchedHeader) {
      // Found a section, now extract content until the next section or end
      let sectionContent = [];
      let j = i + 1;
      
      while (j < contentLines.length) {
        const nextLine = contentLines[j].trim();
        // If we hit another section header, stop
        if (nextLine.toUpperCase() === nextLine && nextLine.length > 0 && !nextLine.startsWith('-')) {
          if (nextLine.endsWith(':') || nextLine.endsWith('--')) {
            break;
          }
        }
        if (nextLine) {
          sectionContent.push(nextLine);
        }
        j++;
      }
      
      return sectionContent.join('\n');
    }
  }
  
  return null;
}

/**
 * Generate a paragraph about the candidate's experience relevant to the job.
 */
function generateParagraphAboutExperience(
  resumeContent: string, 
  jobDetails: { title?: string; company?: string; description?: string; }
): string {
  const jobTitle = jobDetails.title || "this position";
  const company = jobDetails.company || "your company";
  
  return `Throughout my career, I have developed a strong foundation in skills that would directly benefit ${company}. My experience has equipped me with the expertise needed for ${jobTitle}, and I am confident in my ability to make significant contributions to your team.`;
}

/**
 * Generate a paragraph about the candidate's skills relevant to the job.
 */
function generateParagraphAboutSkills(
  resumeContent: string, 
  jobDetails: { title?: string; company?: string; description?: string; }
): string {
  const jobDescription = jobDetails.description || "";
  let keySkills = "";
  
  // Extract skills from resume content
  const skillsSection = extractSection(resumeContent, ["SKILLS", "EXPERTISE", "COMPETENCIES"]);
  if (skillsSection) {
    // Get first 3 skills
    const skills = skillsSection.split(',').slice(0, 3).map(s => s.trim());
    keySkills = skills.join(", ");
  }
  
  if (!keySkills) {
    keySkills = "relevant skills";
  }
  
  return `I bring expertise in ${keySkills}, which aligns perfectly with the requirements outlined in the job description. I am particularly adept at applying these skills to deliver measurable results and would welcome the opportunity to bring this expertise to your organization.`;
}

/**
 * Generate a paragraph about why the candidate is a good fit for the company.
 */
function generateParagraphAboutCompanyFit(
  jobDetails: { title?: string; company?: string; description?: string; }
): string {
  const company = jobDetails.company || "your company";
  
  return `I am particularly drawn to ${company} because of its reputation for excellence and innovation in the industry. After researching your company values and recent achievements, I believe my professional approach and work ethic would integrate seamlessly with your team culture.`;
}