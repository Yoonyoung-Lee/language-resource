-- Language Resources Database Schema V2
-- Simplified structure based on user requirements

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop existing table and view if exists
DROP VIEW IF EXISTS language_resources_view;
DROP TABLE IF EXISTS language_resources;

-- Create the main language_resources table with simplified structure
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
  korean_text_norm TEXT, -- 정규화된 한국어 텍스트 (검색용)
  english_text TEXT, -- 영문: 영어 번역
  english_text_norm TEXT, -- 정규화된 영어 텍스트 (검색용)
  
  -- Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('approved', 'draft', 'review')),
  author TEXT NOT NULL, -- 작성자: 리소스 작성자
  created_at TIMESTAMPTZ DEFAULT NOW(), -- 최초 입력일: 최초 입력 날짜
  updated_at TIMESTAMPTZ DEFAULT NOW(), -- 최종 수정일: 마지막 수정 날짜
  
  -- Additional helpful fields
  notes TEXT -- 메모나 추가 설명
);

-- Create indexes for better performance
CREATE INDEX idx_language_resources_id ON language_resources(id);
CREATE INDEX idx_language_resources_knox ON language_resources(knox);
CREATE INDEX idx_language_resources_brity ON language_resources(brity);
CREATE INDEX idx_language_resources_common ON language_resources(is_common);
CREATE INDEX idx_language_resources_feature_category ON language_resources(feature_category);
CREATE INDEX idx_language_resources_component ON language_resources(component);
CREATE INDEX idx_language_resources_artboard ON language_resources(artboard);
CREATE INDEX idx_language_resources_status ON language_resources(status);
CREATE INDEX idx_language_resources_author ON language_resources(author);
CREATE INDEX idx_language_resources_created ON language_resources(created_at);
CREATE INDEX idx_language_resources_updated ON language_resources(updated_at);

-- Full-text search indexes
CREATE INDEX idx_language_resources_korean_search ON language_resources USING GIN(to_tsvector('korean', korean_text));
CREATE INDEX idx_language_resources_english_search ON language_resources USING GIN(to_tsvector('english', COALESCE(english_text, '')));
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

-- Indexes for normalized text fields (for trigram search)
CREATE INDEX idx_language_resources_korean_norm ON language_resources USING GIN(korean_text_norm gin_trgm_ops);
CREATE INDEX idx_language_resources_english_norm ON language_resources USING GIN(english_text_norm gin_trgm_ops);

-- Update trigger to automatically set updated_at
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

-- Text normalization function (matches the TypeScript normalize.ts logic)
CREATE OR REPLACE FUNCTION normalize_text(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN '';
    END IF;
    
    RETURN TRIM(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                LOWER(
                    REGEXP_REPLACE(input_text, '\s+', ' ', 'g')
                ), 
                '[.,!?;:()\[\]{}\"''`~]', '', 'g'
            ), 
            '\s+', ' ', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically normalize text fields on insert/update
CREATE OR REPLACE FUNCTION normalize_text_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize Korean text
    IF NEW.korean_text IS NOT NULL THEN
        NEW.korean_text_norm = normalize_text(NEW.korean_text);
    END IF;
    
    -- Normalize English text
    IF NEW.english_text IS NOT NULL THEN
        NEW.english_text_norm = normalize_text(NEW.english_text);
    ELSE
        NEW.english_text_norm = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER normalize_language_resources_text
    BEFORE INSERT OR UPDATE ON language_resources
    FOR EACH ROW
    EXECUTE FUNCTION normalize_text_fields();

-- RPC function for trigram search with fallback
CREATE OR REPLACE FUNCTION lr_search_trgm(
    search_query TEXT,
    product_filter TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    search_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
    id INTEGER,
    knox BOOLEAN,
    brity BOOLEAN,
    is_common BOOLEAN,
    feature_category TEXT,
    component TEXT,
    artboard TEXT,
    korean_text TEXT,
    english_text TEXT,
    status TEXT,
    author TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    notes TEXT,
    similarity_score REAL
) AS $$
DECLARE
    normalized_query TEXT;
BEGIN
    -- Normalize the search query
    normalized_query := normalize_text(search_query);
    
    -- Return empty if no query
    IF normalized_query = '' OR normalized_query IS NULL THEN
        RETURN;
    END IF;
    
    -- Use trigram similarity search
    RETURN QUERY
    SELECT 
        lr.id,
        lr.knox,
        lr.brity,
        lr.is_common,
        lr.feature_category,
        lr.component,
        lr.artboard,
        lr.korean_text,
        lr.english_text,
        lr.status,
        lr.author,
        lr.created_at,
        lr.updated_at,
        lr.notes,
        GREATEST(
            COALESCE(similarity(lr.korean_text_norm, normalized_query), 0),
            COALESCE(similarity(lr.english_text_norm, normalized_query), 0),
            COALESCE(similarity(normalize_text(lr.feature_category), normalized_query), 0),
            COALESCE(similarity(normalize_text(lr.component), normalized_query), 0),
            COALESCE(similarity(normalize_text(lr.artboard), normalized_query), 0)
        ) as similarity_score
    FROM language_resources lr
    WHERE (
        (product_filter IS NULL) OR 
        (product_filter = 'knox' AND lr.knox = true) OR
        (product_filter = 'brity' AND lr.brity = true)
    )
    AND (
        (category_filter IS NULL) OR
        (lr.feature_category ILIKE '%' || category_filter || '%') OR
        (lr.component ILIKE '%' || category_filter || '%') OR
        (lr.artboard ILIKE '%' || category_filter || '%')
    )
    AND (
        lr.korean_text_norm % normalized_query OR
        lr.english_text_norm % normalized_query OR
        normalize_text(lr.feature_category) % normalized_query OR
        normalize_text(lr.component) % normalized_query OR
        normalize_text(lr.artboard) % normalized_query OR
        lr.korean_text_norm ILIKE '%' || normalized_query || '%' OR
        lr.english_text_norm ILIKE '%' || normalized_query || '%'
    )
    ORDER BY similarity_score DESC, lr.id ASC
    LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;

-- Create a view for easier querying with computed fields
CREATE VIEW language_resources_view AS
SELECT 
  id,
  knox,
  brity,
  is_common,
  feature_category,
  component,
  artboard,
  korean_text,
  korean_text_norm,
  english_text,
  english_text_norm,
  status,
  author,
  created_at,
  updated_at,
  notes,
  -- Helper computed columns
  CASE WHEN knox AND brity AND is_common THEN 'Knox, Brity, 공통'
       WHEN knox AND brity THEN 'Knox, Brity'
       WHEN knox AND is_common THEN 'Knox, 공통'
       WHEN brity AND is_common THEN 'Brity, 공통'
       WHEN knox THEN 'Knox'
       WHEN brity THEN 'Brity'
       WHEN is_common THEN '공통'
       ELSE 'None' END as products_display,
  -- Translation status
  CASE WHEN english_text IS NOT NULL AND english_text != '' 
       THEN TRUE ELSE FALSE END as has_english_translation,
  -- Date formatting
  TO_CHAR(created_at, 'YYYY-MM-DD') as created_date,
  TO_CHAR(updated_at, 'YYYY-MM-DD') as updated_date
FROM language_resources;

-- Insert sample data for testing
INSERT INTO language_resources (
  knox, brity, is_common, feature_category, component, artboard,
  korean_text, english_text, status, author, notes
) VALUES 
(TRUE, FALSE, FALSE, '인증', 'Input', 'Login Screen', '입력 코드', 'Enter the Code', 'approved', 'designer1', '로그인 화면의 코드 입력 필드'),

(TRUE, TRUE, FALSE, '워크스페이스', 'Popup', 'Create Workspace', '나중에 추가하고 닫기', 'Add Later & Close', 'approved', 'designer1', '워크스페이스 생성 팝업'),

(TRUE, TRUE, FALSE, '음성/영상', 'Notification', 'Voice Chat', '(user name)님이 음성 대화를 요청합니다.', '(user name) asks for a voice chat.', 'approved', 'designer2', '음성 채팅 요청 알림'),

(TRUE, FALSE, FALSE, '보안', 'Toast', 'Screen Share', '회사 보안 정책에 따라 화면 공유가 제한됩니다.', 'You cannot view the screen shared due to the company''s security policy.', 'approved', 'designer2', '보안 정책 관련 토스트 메시지'),

(TRUE, TRUE, FALSE, '화면공유', 'Status', 'Screen Share', '화면 공유 중입니다.', 'Now sharing.', 'approved', 'designer1', '화면 공유 상태 표시'),

(TRUE, TRUE, FALSE, '채팅', 'System Message', 'Chat', '그룹 대화로 전환합니다.', 'Switch to group chat.', 'approved', 'designer3', '채팅 모드 전환 시스템 메시지'),

(FALSE, TRUE, FALSE, '네트워크', 'Toast', 'Screen Share Error', '공유자의 네트워크 상태가 불안정하여 화면공유가 종료되었습니다.', 'Screen sharing has ended because the network of the person sharing the screen is unstable.', 'approved', 'designer3', '네트워크 오류로 인한 화면공유 종료'),

(TRUE, TRUE, TRUE, '일반', 'Button', 'Common UI', '확인', 'OK', 'approved', 'designer1', '공통으로 사용되는 확인 버튼'),

(TRUE, FALSE, FALSE, '설정', 'Label', 'Settings', '알림 설정', 'Notification Settings', 'draft', 'designer2', '설정 화면의 알림 관련 라벨'),

(FALSE, TRUE, FALSE, '메시지', 'Input', 'Message Input', '메시지를 입력하세요', 'Enter your message', 'review', 'designer3', '메시지 입력 필드 플레이스홀더');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON language_resources TO authenticated;
-- GRANT ALL ON language_resources_view TO authenticated;
-- GRANT USAGE, SELECT ON SEQUENCE language_resources_id_seq TO authenticated;
