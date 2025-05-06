# CV and Cover Letter AI

A sophisticated CV and Cover Letter Automation application that leverages Google Gemini AI to dynamically tailor resumes and cover letters for targeted job applications.

## Features

- AI-powered document tailoring to specific job descriptions
- Support for both CV (resume) and cover letter generation
- Option to generate both document types simultaneously
- Comparison view to see original vs tailored content
- Direct text input for ease of use
- Multiple export formats (DOCX, PDF)
- Proper professional formatting for all documents
- PostgreSQL database for reliable data persistence

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Google Gemini API key

## Setup Instructions

1. **Clone the repository**
   ```
   git clone <repository-url>
   cd CV-Cover-Letter-AI
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file and update it with your values:
   ```
   cp .env.example .env
   ```
   
   Edit the `.env` file and add:
   - Your PostgreSQL database connection string
   - Your Google Gemini API key

4. **Initialize the database**
   ```
   npm run db:push
   ```

5. **Start the application**
   ```
   npm run dev
   ```

6. **Access the application**
   
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Database Setup

To set up a PostgreSQL database:

1. Install PostgreSQL on your system or use a cloud provider (like ElephantSQL, Render, Supabase, etc.)
2. Create a new database and user with appropriate permissions
3. Update the `DATABASE_URL` in your `.env` file with the connection string in this format:
   ```
   DATABASE_URL=postgresql://username:password@host:port/database_name
   ```

## Deploying to Production

When deploying to production, make sure to:

1. Set appropriate environment variables on your hosting platform
2. Build the project using `npm run build`
3. Start the server using `npm start`

## License

[MIT License](LICENSE)