# Language Resource Service

A TypeScript-based language resource management system built with Next.js 14 (App Router) and shadcn/ui.

## Features

- **Search Resources**: Find language resources by query and locale
- **Text Auditing**: Compare input texts against existing resources to find matches and missing translations
- **Text Suggestions**: Get AI-powered suggestions for improving text content (mock implementation)
- **Multi-language Support**: Currently supports Korean (ko-KR) and English (en-US)

## Quick Start

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Set Up Environment**:
   ```bash
   cp .env.local.example .env.local
   ```

3. **Start Development Server**:
   ```bash
   pnpm run dev
   ```

4. **Access the Dashboard**:
   - Open http://localhost:3000/dashboard
   - The main page is at http://localhost:3000

## API Endpoints

All API endpoints require an `x-secret` header for authentication (unless `SECRET_PASSWORD` is not set in development).

### GET /api/resources/search
Search language resources by query and locale.

**Query Parameters**:
- `query` (required): Search term
- `locale` (optional): Language locale (default: 'ko-KR')

**Example**:
```bash
curl -H "x-secret: devpass" "http://localhost:3000/api/resources/search?query=홈페이지&locale=ko-KR"
```

### POST /api/suggest
Get text improvement suggestions.

**Request Body**:
```json
{
  "text": "개선할 텍스트",
  "locale": "ko-KR",
  "styleGuide": "친근한 톤앤매너" // optional
}
```

**Example**:
```bash
curl -X POST -H "Content-Type: application/json" -H "x-secret: devpass" \
  -d '{"text":"안녕하세요","locale":"ko-KR"}' \
  http://localhost:3000/api/suggest
```

### POST /api/audit
Audit texts against existing language resources.

**Request Body**:
```json
{
  "texts": ["텍스트1", "텍스트2"],
  "locale": "ko-KR"
}
```

**Example**:
```bash
curl -X POST -H "Content-Type: application/json" -H "x-secret: devpass" \
  -d '{"texts":["홈페이지 타이틀","새로운 텍스트"],"locale":"ko-KR"}' \
  http://localhost:3000/api/audit
```

## Configuration

### Authentication

The service uses a simple header-based authentication system:

- **Development**: If `SECRET_PASSWORD` is not set, all requests are allowed
- **Production**: Set `SECRET_PASSWORD` in your environment and include `x-secret` header in requests

### Environment Variables

Create a `.env.local` file with:

```bash
SECRET_PASSWORD=your_secure_password_here
NEXT_PUBLIC_SECRET=your_secure_password_here
```

### Resource Data

Language resources are stored in `/resources.json` at the project root. The file contains an array of resource objects:

```json
[
  {
    "key": "homepage.title",
    "locale": "ko-KR", 
    "text": "홈페이지 타이틀",
    "status": "approved"
  }
]
```

**Resource Properties**:
- `key`: Unique identifier for the resource (can be null)
- `locale`: Language code (e.g., 'ko-KR', 'en-US')
- `text`: The actual text content
- `status`: Either 'approved' or 'draft'

## Project Structure

```
apps/web/
├── app/
│   ├── api/                    # API routes
│   │   ├── audit/             # POST /api/audit
│   │   ├── resources/search/  # GET /api/resources/search
│   │   └── suggest/           # POST /api/suggest
│   ├── dashboard/             # Dashboard UI
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── lib/                       # Shared utilities
│   ├── types.ts              # TypeScript definitions
│   ├── loadResources.ts      # Resource loading logic
│   ├── withCors.ts           # CORS middleware
│   └── withSecret.ts         # Authentication middleware
└── components/               # Reusable components
```

## Development Notes

- The service starts with mock data from `resources.json`
- Authentication is simplified for development (set `SECRET_PASSWORD` for security)
- CORS is configured for local development and Figma plugin integration
- All code includes inline comments for non-developer readability

## Next Steps

- Replace mock suggestion logic with actual AI/LLM integration (Ollama)
- Add database integration for scalable resource storage
- Implement user management and role-based permissions
- Add more sophisticated text matching algorithms
