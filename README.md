# SuperIntern - Intern Management Platform

This is a [Next.js](https://nextjs.org) project for managing intern profiles and integrating with Supabase for data storage.

## Project Overview

SuperIntern is a platform designed to help manage intern profiles, resumes, and related information. The application uses:

- Next.js 15 with App Router
- TypeScript
- Supabase for database and storage
- UI components from a custom component library

## Recent Changes

- Removed Clerk authentication
- Added placeholder authentication (ready for custom auth implementation)
- Integrated Supabase for data storage and file uploads
- Added ESLint configuration for code quality

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Installation

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Supabase Setup

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Set up the following tables:
   - `intern_profiles` - For storing intern information
   - Create appropriate storage buckets for resume uploads

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Deployment

The application can be deployed on Vercel or any other platform that supports Next.js applications.

```bash
# Build the application
npm run build
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
