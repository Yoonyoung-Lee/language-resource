# Language Resource Service

A TypeScript-based language resource management system built with Next.js 14, Supabase, and AI-powered suggestions.

## 🚀 Features

- **Search Resources**: Find language resources stored in Supabase database
- **Insert Resources**: Add new language resources with multi-language support
- **Audit Resources**: Analyze resource completeness and quality with health scoring
- **AI Suggestions**: Get intelligent text improvement suggestions using Ollama qwen2.5:7b-instruct
- **Multi-language Support**: Korean, English, Chinese, Japanese, Vietnamese
- **Figma Plugin Integration**: Connect with Figma plugin for design workflow
- **shadcn/ui Components**: Modern, accessible UI components

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL database)
- **AI**: Ollama with qwen2.5:7b-instruct model
- **Authentication**: Development header-based auth (`x-secret`)
- **Styling**: Tailwind CSS with CSS variables for theming

## 📁 Project Structure

```
apps/web/
├── app/
│   ├── api/                      # API routes
│   │   ├── resources/
│   │   │   ├── search/          # GET - Search resources in Supabase
│   │   │   └── insert/          # POST - Insert new resource
│   │   ├── audit-supabase/      # POST - Comprehensive resource audit
│   │   └── suggest-ai/          # POST - AI-powered suggestions
│   ├── dashboard/               # Management dashboard
│   │   └── page.tsx            # 4-section dashboard (search/insert/audit/suggest)
│   └── page.tsx                # Main homepage with Perplexity-style UI
├── lib/
│   ├── env.ts                  # Centralized environment configuration
│   ├── supabase.ts            # Supabase client setup (browser + admin)
│   ├── repository.ts          # SupabaseRepo class for database operations
│   ├── withSecret.ts          # API security middleware
│   └── withCors.ts            # CORS middleware
├── components/                 # UI components with shadcn/ui
│   ├── main-layout.tsx        # Left navigation layout
│   ├── home-page.tsx          # Central search interface
│   ├── resources-page.tsx     # Resource listing page
│   └── search-results-page.tsx # Two-column search results
```

## 🔧 Setup Instructions

### 1. Environment Variables

Copy the example file and fill in your values:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Then edit `.env.local` with your actual values:

```env
# Supabase Configuration
# Get these from your Supabase Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Ollama Configuration (for AI suggestions)
OLLAMA_URL=http://localhost:11434

# Development Security (change in production)
SECRET_PASSWORD=devpass
NEXT_PUBLIC_SECRET=devpass
```

**How to get Supabase keys:**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret!

### 2. Supabase Database Setup

Create the `language_resources` table in your Supabase SQL editor:

```sql
CREATE TABLE language_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  products TEXT[] NOT NULL DEFAULT '{}',
  category JSONB DEFAULT '{}',
  translations JSONB NOT NULL,
  product_specific JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('approved', 'draft', 'review')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_language_resources_key ON language_resources(key);
CREATE INDEX idx_language_resources_products ON language_resources USING GIN(products);
CREATE INDEX idx_language_resources_translations ON language_resources USING GIN(translations);
CREATE INDEX idx_language_resources_status ON language_resources(status);

-- Full-text search index
CREATE INDEX idx_language_resources_search ON language_resources USING GIN(
  (translations || category || jsonb_build_object('key', key))
);
```

### 3. Ollama Setup (Optional - for AI suggestions)

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
ollama serve

# Pull the qwen2.5:7b-instruct model
ollama pull qwen2.5:7b-instruct
```

### 4. Development

```bash
# Install dependencies (from project root)
pnpm install

# Start development server
cd apps/web
pnpm dev
```

**Access Points:**
- Main App: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

## 📡 API Endpoints

All endpoints require `x-secret: devpass` header for development.

### Search Resources
```bash
GET /api/resources/search?query=hello&locale=ko-KR&product=knox&limit=50
```

### Insert New Resource
```bash
POST /api/resources/insert
Content-Type: application/json

{
  "key": "button.login",
  "products": ["knox", "brity"],
  "translations": {
    "ko-KR": "로그인",
    "en-US": "Login",
    "zh-CN": "登录"
  },
  "category": {
    "section1": "authentication",
    "component": "button"
  },
  "status": "draft",
  "metadata": {
    "author": "developer-name"
  }
}
```

### Audit Resources
```bash
POST /api/audit-supabase
Content-Type: application/json

{
  "locale": "ko-KR",
  "product": "knox"
}
```

### AI Suggestions
```bash
POST /api/suggest-ai
Content-Type: application/json

{
  "text": "로그인 해주세요",
  "locale": "ko-KR",
  "product": "knox",
  "context": "UI button text"
}
```

## 🎨 Dashboard Features

The `/dashboard` page provides 4 main sections:

1. **🔍 Search Resources**: Query the Supabase database
2. **➕ Insert Resource**: Add new language resources
3. **📊 Audit Resources**: Get health score and recommendations
4. **🤖 AI Suggestions**: Get intelligent text improvements

Each section is a self-contained card with its own state management.

## 🔒 Security & Authentication

**Development Mode:**
- Uses simple `x-secret` header authentication
- Secret password configurable via `SECRET_PASSWORD` env var
- CORS enabled for local development

**Production Considerations:**
- Replace header auth with proper JWT/session authentication
- Configure CORS for production domains
- Use environment-specific Supabase keys
- Enable RLS (Row Level Security) in Supabase

## 🏗 Architecture Decisions

### Repository Pattern
- `SupabaseRepo` class encapsulates all database operations
- Clean separation between API routes and data access
- Easy to test and maintain

### Type Safety
- Comprehensive TypeScript interfaces for all data structures
- Supabase client properly typed
- API request/response types defined

### Component Structure
- shadcn/ui components for consistency
- CSS variables for theming (dark/light mode ready)
- Responsive design with Tailwind CSS

### Error Handling
- Graceful fallbacks for AI service unavailability
- Detailed error messages in development
- User-friendly error states in UI

## 🧪 Testing API Endpoints

Use the dashboard or test with curl:

```bash
# Search test
curl -H "x-secret: devpass" \
  "http://localhost:3000/api/resources/search?query=login&locale=ko-KR"

# Insert test
curl -X POST -H "Content-Type: application/json" -H "x-secret: devpass" \
  -d '{"key":"test.button","products":["knox"],"translations":{"ko-KR":"테스트","en-US":"Test"},"metadata":{"author":"tester"}}' \
  http://localhost:3000/api/resources/insert

# Audit test
curl -X POST -H "Content-Type: application/json" -H "x-secret: devpass" \
  -d '{"locale":"ko-KR"}' \
  http://localhost:3000/api/audit-supabase
```

## 📝 Development Notes

- **Comments**: All code includes explanatory comments for non-developers
- **Error Handling**: Comprehensive try-catch blocks with meaningful messages
- **Validation**: Input validation on both client and server side
- **Performance**: Indexed database queries and efficient React state management
- **Accessibility**: shadcn/ui components follow accessibility best practices

## 🚀 Next Steps

- [ ] Implement user authentication and authorization
- [ ] Add real-time collaboration features
- [ ] Enhance AI suggestions with context awareness
- [ ] Add export/import functionality for resources
- [ ] Implement version control for resource changes
- [ ] Add analytics and usage tracking

## 📄 License

Private project - Samsung SDS