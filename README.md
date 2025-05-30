# Next.js Document Search Application

This application allows users to upload documents or ingest web pages, then chat with the content using AI. The application uses OpenAI's embeddings for document search.

## Features

- **Authentication**: Secure user authentication with Clerk
- **Document Upload**: Upload PDF, DOC, DOCX, and TXT files
- **Web Page Ingestion**: Add content from any URL
- **Vector Search**: Convert documents to vectors for semantic search
- **Chat Interface**: Ask questions about your documents with AI-powered responses
- **Progress Tracking**: Real-time progress bars for upload and vectorization

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: Clerk
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma
- **AI**: OpenAI API for embeddings and chat completions
- **Docker**: Create standalone docker image

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
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=document_search

# MINIO
MINIO_ENDPOINT=
MINIO_PORT=
MINIO_USE_SSL=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
MINIO_BUCKET_NAME=
```

### Pull pgvector and run docker image

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

## Docker Instructions

### Pull Docker Image

```sh
docker pull jyotipm17/inquiro:latest

```

### Run docker Image

```sh
docker run -d \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY= \
  -e CLERK_SECRET_KEY= \
  -e NEXT_PUBLIC_CLERK_SIGN_IN_URL= \
  -e NEXT_PUBLIC_CLERK_SIGN_UP_URL= \
  -e NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL= \
  -e NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL= \
  -e OPENAI_API_KEY= \
  -e DATABASE_URL= \
  -e POSTGRES_USER= \
  -e POSTGRES_PASSWORD= \
  -e POSTGRES_DB= \
  -e MINIO_ENDPOINT= \
  -e MINIO_PORT= \
  -e MINIO_USE_SSL= \
  -e MINIO_ACCESS_KEY= \
  -e MINIO_SECRET_KEY= \
  -e MINIO_BUCKET_NAME= \
  -p 3000:3000 \
  jyotipm17/inquiro
```

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

## API Endpoints

- `POST /api/upload`: Upload a document file in a folder
- `POST /api/minio`: Upload a document to MinIO
- `POST /api/urls`: Process and extract a web pages URL
- `POST /api/urls/[webPageId]`: Process a specific web page URL
- `GET /api/documents`: Get all user documents
- `GET /api/documents/[documentId]`: Get a specific document
- `POST /api/chat/document/[documentId]`: Chat with a document
- `POST /api/chat/webpage/[webPageId]`: Chat with a web page
- `GET /api/vectorize`: Create and Check vectorization status

## Development Notes

- The application uses the app router in Next.js
- Authentication is handled by Clerk middleware
- Document vectors are stored in PostgreSQL using pgvector

## Future Improvements

- Add support for more file types
- Implement batch document uploads
- Add document sharing functionality
- Improve vector search with hybrid search techniques
- Add document summarization feature
- Implement hybrid semantic + keyword search (see [Postgres Hybrid Search with pgvector](https://supabase.com/blog/hybrid-search-text-embeddings-postgres))
- Add user roles and permissions (admin, editor, viewer)
- Enable document versioning and history
- Add OCR support for scanned PDFs and images
- Integrate notifications for completed vectorization or chat responses
- Add analytics dashboard for document usage and queries
- Support multi-language document ingestion and search
- Add export/download options for chat history and document insights
- Improve error handling and user feedback throughout the app
- Add mobile-friendly and accessible UI enhancements
- Implement rate limiting and abuse prevention for API endpoints
- Add support for custom AI models or self-hosted embeddings

## filtered future goals

- 1.⁠ ⁠Fix the error through (Note: Return the response with status code.) ✅
- 2.⁠ ⁠Support multiple file type (at least docx, txt, ppt)
- 3.⁠ ⁠Batch document upload
- 4.⁠ ⁠Batch or multiple related URLs
- 5.⁠ ⁠Store the chat information
- 6.⁠ ⁠Document or URL sharing feature (can I get the userId of the clerk from email address)
- 7.⁠ ⁠Improve the vector search
- 8.⁠ ⁠Export or download chat history
- 9.⁠ ⁠Add rate limiting
- 10.⁠ ⁠Add token based (payment option enabled) – SaaS Product (written in red)
