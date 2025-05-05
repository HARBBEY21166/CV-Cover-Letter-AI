import { db } from "./db";
import { templates } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDefaultTemplates() {
  console.log("Checking for templates in the database...");
  
  // Check if we have any CV templates
  const cvTemplates = await db.select().from(templates).where(eq(templates.documentType, "cv"));
  
  if (cvTemplates.length === 0) {
    console.log("No CV templates found. Creating default CV templates...");
    
    // Create default professional CV template
    await db.insert(templates).values({
      name: "Professional Resume",
      description: "A clean, professional resume layout suitable for most industries",
      documentType: "cv",
      content: `# PROFESSIONAL RESUME

CONTACT INFORMATION
------------------
{{name}}
{{email}} | {{phone}} | {{location}}
{{linkedin}} | {{portfolio}}

PROFESSIONAL SUMMARY
-------------------
{{summary}}

SKILLS
------
{{skills}}

EXPERIENCE
----------
{{experience}}

EDUCATION
---------
{{education}}

CERTIFICATIONS
-------------
{{certifications}}

LANGUAGES
---------
{{languages}}`,
      isDefault: true,
    });
    
    // Create modern CV template
    await db.insert(templates).values({
      name: "Modern Resume",
      description: "A contemporary resume design with a creative touch",
      documentType: "cv",
      content: `# {{name}}

**{{email}} • {{phone}} • {{location}} • {{linkedin}}**

## PROFESSIONAL SUMMARY
{{summary}}

## TECHNICAL SKILLS
{{skills}}

## PROFESSIONAL EXPERIENCE
{{experience}}

## EDUCATION
{{education}}

## PROJECTS
{{projects}}`,
      isDefault: false,
    });
    
    // Create minimalist CV template
    await db.insert(templates).values({
      name: "Minimalist Resume",
      description: "A clean and simple resume design that focuses on content",
      documentType: "cv",
      content: `{{name}}
{{email}} | {{phone}}

OBJECTIVE
---------
{{summary}}

SKILLS
------
{{skills}}

EXPERIENCE
----------
{{experience}}

EDUCATION
---------
{{education}}`,
      isDefault: false,
    });
    
    console.log("Default CV templates created successfully!");
  } else {
    console.log(`Found ${cvTemplates.length} existing CV templates.`);
  }
  
  // Check if we have any cover letter templates
  const coverTemplates = await db.select().from(templates).where(eq(templates.documentType, "cover"));
  
  if (coverTemplates.length === 0) {
    console.log("No cover letter templates found. Creating default cover letter templates...");
    
    // Create traditional cover letter template
    await db.insert(templates).values({
      name: "Traditional Cover Letter",
      description: "A formal cover letter format with proper business letter structure",
      documentType: "cover",
      content: `{{date}}

{{yourName}}
{{yourAddress}}
{{yourCity}}, {{yourState}} {{yourZip}}
{{yourPhone}}
{{yourEmail}}

{{recipientName}}
{{recipientTitle}}
{{companyName}}
{{companyAddress}}
{{companyCity}}, {{companyState}} {{companyZip}}

Dear {{recipientName}},

I am writing to express my interest in the {{position}} position at {{companyName}} as advertised on {{jobSource}}. With my background in {{relevantField}} and experience in {{relevantSkill}}, I am confident that I would be a valuable addition to your team.

{{paragraphAboutExperience}}

{{paragraphAboutSkills}}

{{paragraphAboutCompanyFit}}

Thank you for considering my application. I am eager to discuss how my skills and experiences align with the needs of {{companyName}}. Please feel free to contact me at {{yourPhone}} or {{yourEmail}} to arrange an interview.

Sincerely,

{{yourName}}`,
      isDefault: true,
    });
    
    // Create modern cover letter template
    await db.insert(templates).values({
      name: "Modern Cover Letter",
      description: "A more contemporary cover letter with a conversational tone",
      documentType: "cover",
      content: `# {{yourName}}
{{yourEmail}} | {{yourPhone}} | {{yourLocation}}

{{date}}

Dear {{recipientName}},

I'm excited to apply for the {{position}} role at {{companyName}}. As a {{yourCurrentRole}} with {{yearsOfExperience}} years of experience in {{industry}}, I was thrilled to see this opportunity that aligns perfectly with my career goals and skill set.

{{paragraphAboutWhyThisCompany}}

{{paragraphHighlightingRelevantSkills}}

{{paragraphAboutImpact}}

I'd love the opportunity to discuss how my background can help {{companyName}} achieve its goals. Please feel free to reach out to me at {{yourPhone}} or {{yourEmail}} to schedule a conversation.

Best regards,

{{yourName}}`,
      isDefault: false,
    });
    
    // Create simple cover letter template
    await db.insert(templates).values({
      name: "Simple Cover Letter",
      description: "A straightforward cover letter format that gets to the point",
      documentType: "cover",
      content: `{{date}}

Dear Hiring Manager,

I am writing to apply for the {{position}} position at {{companyName}}.

My background includes:
- {{keyExperience1}}
- {{keyExperience2}}
- {{keyExperience3}}

I am interested in this role because {{reasonForInterest}}.

I look forward to discussing this opportunity with you further. You can reach me at {{yourEmail}} or {{yourPhone}}.

Sincerely,
{{yourName}}`,
      isDefault: false,
    });
    
    console.log("Default cover letter templates created successfully!");
  } else {
    console.log(`Found ${coverTemplates.length} existing cover letter templates.`);
  }
}