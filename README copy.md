# Next.js Document Search Application

This application allows users to upload documents or ingest web pages, then chat with the content using AI. The application uses OpenAI's embeddings for document search and the Vercel AI SDK for streaming responses.

## Features

- **Authentication**: Secure user authentication with Clerk
- **Document Upload**: Upload PDF, DOC, DOCX, and TXT files
- **Web Page Ingestion**: Add content from any URL
- **Vector Search**: Convert documents to vectors for semantic search
- **Chat Interface**: Ask questions about your documents with AI-powered responses
- **Progress Tracking**: Real-time progress bars for upload and vectorization

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Authentication**: Clerk
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma
- **AI**: OpenAI API for embeddings and chat completions
- **Streaming**: Vercel AI SDK for streaming responses

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database with pgvector extension
- OpenAI API key
- Clerk account and API keys

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-publishable-key
CLERK_SECRET_KEY=your-secret-key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Database
DATABASE_URL="postgresql://username:password@localhost:9090/inquiro"
```

### Pull and run docker image

```
docker pull pgvector/pgvector:pg16
```

```
docker run -d \
  --name pgvector-db \
  -e POSTGRES_USER=inquiro \
  -e POSTGRES_PASSWORD=inquiro \
  -e POSTGRES_DB=inquiro \
  -p 9090:5432 \
  -v pgvector_data:/var/lib/postgresql/data \
  pgvector/pgvector:pg16

```

### Installation

1. Install dependencies:

   ```
   bun install

   ```

2. Set up the database:

   ```
   bunx prisma migrate dev --name init
   ```

3. Generate prisma type

```
bunx prisma generate
```

3. Run the development server:

   ```
   bun run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app`: Next.js app router pages
- `/src/components`: Reusable React components
- `/src/lib`: Utility functions and shared code
- `/prisma`: Database schema and migrations
- `/public`: Static assets

## Usage Flow

1. Sign up or log in using Clerk authentication
2. Navigate to the dashboard
3. Upload a document or add a web page URL
4. Wait for the vectorization process to complete
5. Click on a document to open the chat interface
6. Ask questions about the document content

## API Endpoints

- `POST /api/upload`: Upload a document file
- `POST /api/url`: Process a web page URL
- `GET /api/documents`: Get all user documents
- `GET /api/documents/[documentId]`: Get a specific document
- `POST /api/chat/[documentId]`: Chat with a document
- `GET /api/vectorize/status`: Check vectorization status

## Development Notes

- The application uses the app router in Next.js
- Authentication is handled by Clerk middleware
- Document vectors are stored in PostgreSQL using pgvector
- Chat responses are streamed using the Vercel AI SDK

## Future Improvements

- Add support for more file types
- Implement batch document uploads
- Add document sharing functionality
- Improve vector search with hybrid search techniques
- Add document summarization feature
