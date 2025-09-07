# Language Resource Service V2

A simplified TypeScript-based language resource management system built with Next.js 14, Supabase, and AI-powered suggestions.

## 🚀 Features

- **Simplified Schema**: Streamlined database structure based on user requirements
- **Product Assignment**: Knox, Brity, 공통사용 checkbox selection
- **Classification**: 기능 카테고리 (feature category), 컴포넌트 (component), 아트보드 (artboard)
- **Bilingual Support**: Korean (main) and English translations
- **Author Tracking**: 작성자 (author) and creation/modification dates
- **AI Suggestions**: Get intelligent text improvements using Ollama qwen2.5:7b-instruct
- **Modern UI**: shadcn/ui components with responsive design

## 🏗 Database Structure

### Core Fields:
- **ID**: 고유 식별자 (숫자) - Serial primary key
- **Knox/Brity/공통사용**: 체크박스 - Boolean fields for product assignment
- **기능 카테고리**: 서비스 기능 분류 - Service feature classification
- **컴포넌트**: UI 요소 분류 - UI component classification
- **아트보드**: 피그마 프레임 명 - Figma frame name
- **국문**: 한국어 (메인 텍스트) - Korean text (required)
- **영문**: 영어 번역 - English translation (optional)
- **작성자**: 리소스 작성자 - Resource author (required)
- **최초 입력일**: 최초 입력 날짜 - Creation date (auto)
- **최종 수정일**: 마지막 수정 날짜 - Last modification date (auto)

## 🔧 Setup Instructions

### 1. Environment Variables

Create `.env.local` file in `apps/web/`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Security (development only)
SECRET_PASSWORD=devpass

# Ollama Configuration (for AI suggestions)
OLLAMA_URL=http://localhost:11434
```

### 2. Supabase Database Schema

Run this SQL in your Supabase SQL editor:

```sql
-- Simplified language resources table
CREATE TABLE language_resources (
  -- Primary key (고유 식별자)
  id SERIAL PRIMARY KEY,
  
  -- Product assignment (체크박스)
  knox BOOLEAN DEFAULT FALSE,
  brity BOOLEAN DEFAULT FALSE,
  is_common BOOLEAN DEFAULT FALSE, -- 공통사용
  
  -- Classification fields
  feature_category TEXT, -- 기능 카테고리: 서비스 기능 분류
  component TEXT, -- 컴포넌트: UI 요소 분류
  artboard TEXT, -- 아트보드: 피그마 프레임 명
  
  -- Main content (핵심 텍스트)
  korean_text TEXT NOT NULL, -- 국문: 한국어 (메인 텍스트)
  english_text TEXT, -- 영문: 영어 번역
  
  -- Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('approved', 'draft', 'review')),
  author TEXT NOT NULL, -- 작성자: 리소스 작성자
  created_at TIMESTAMPTZ DEFAULT NOW(), -- 최초 입력일
  updated_at TIMESTAMPTZ DEFAULT NOW(), -- 최종 수정일
  notes TEXT -- 메모나 추가 설명
);

-- Performance indexes
CREATE INDEX idx_language_resources_knox ON language_resources(knox);
CREATE INDEX idx_language_resources_brity ON language_resources(brity);
CREATE INDEX idx_language_resources_common ON language_resources(is_common);
CREATE INDEX idx_language_resources_feature_category ON language_resources(feature_category);
CREATE INDEX idx_language_resources_component ON language_resources(component);
CREATE INDEX idx_language_resources_status ON language_resources(status);
CREATE INDEX idx_language_resources_author ON language_resources(author);

-- Full-text search
CREATE INDEX idx_language_resources_search_all ON language_resources USING GIN(
  to_tsvector('korean', 
    COALESCE(korean_text, '') || ' ' ||
    COALESCE(english_text, '') || ' ' ||
    COALESCE(feature_category, '') || ' ' ||
    COALESCE(component, '') || ' ' ||
    COALESCE(artboard, '') || ' ' ||
    COALESCE(notes, '')
  )
);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_language_resources_updated_at
    BEFORE UPDATE ON language_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample data
INSERT INTO language_resources (
  knox, brity, is_common, feature_category, component, artboard,
  korean_text, english_text, status, author, notes
) VALUES 
(TRUE, FALSE, FALSE, '인증', 'Input', 'Login Screen', '입력 코드', 'Enter the Code', 'approved', 'designer1', '로그인 화면의 코드 입력 필드'),
(TRUE, TRUE, FALSE, '워크스페이스', 'Popup', 'Create Workspace', '나중에 추가하고 닫기', 'Add Later & Close', 'approved', 'designer1', '워크스페이스 생성 팝업'),
(TRUE, TRUE, TRUE, '일반', 'Button', 'Common UI', '확인', 'OK', 'approved', 'designer1', '공통으로 사용되는 확인 버튼');
```

### 3. Development

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

### Insert New Resource
```bash
POST /api/resources/insert
Content-Type: application/json

{
  "korean_text": "로그인",
  "english_text": "Login",
  "author": "designer1",
  "knox": true,
  "brity": false,
  "is_common": false,
  "feature_category": "인증",
  "component": "Button",
  "artboard": "Login Screen",
  "notes": "로그인 버튼",
  "status": "draft"
}
```

### Search Resources
```bash
GET /api/resources/search?query=로그인&product=knox&limit=50
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

## 🎨 UI Components

### Language Resources Collection Page
- **Table-like Display**: Shows all resources in card format
- **Product Badges**: Knox, Brity, 공통 indicators
- **Category Tags**: 기능카테고리, 컴포넌트, 아트보드
- **Translation Status**: English translation availability
- **Author & Dates**: Creation and modification tracking
- **Search & Filter**: Real-time search across all fields

### Dashboard Features
- **Enhanced Insert Form**: All new fields with validation
- **Improved Audit**: Knox/Brity/공통 statistics
- **Search**: Simplified search interface
- **AI Suggestions**: Context-aware improvements

## 🔍 Key Improvements

### Simplified Schema
- Removed complex nested JSON structures
- Clear boolean fields for product assignment
- Focused on Korean-English bilingual support
- Direct field access for better performance

### Enhanced UX
- Visual product indicators (Knox, Brity, 공통)
- Category-based organization
- Author attribution and date tracking
- Notes field for additional context

### Better Performance
- Optimized database indexes
- Simplified queries
- Reduced data complexity
- Faster search operations

## 📝 Development Notes

- **Korean Focus**: Korean text is the primary content
- **English Optional**: English translations are supplementary
- **Author Required**: Every resource must have an author
- **Product Assignment**: At least one of Knox/Brity/공통사용 must be selected
- **Flexible Categories**: Feature category, component, and artboard are optional
- **Notes Support**: Additional context can be added to any resource

## 🚀 Migration from V1

If migrating from the previous complex schema:

1. Export existing data
2. Transform to new simplified structure
3. Map old categories to new fields
4. Import using the new insert API
5. Verify data integrity with audit tools

## 📄 License

Private project - Samsung SDS
