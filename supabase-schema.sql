-- Language Resources Database Schema
-- Based on the provided spreadsheet structure

-- Drop existing table if exists
DROP TABLE IF EXISTS language_resources;

-- Create the main language_resources table
CREATE TABLE language_resources (
  -- Primary key and identification
  id SERIAL PRIMARY KEY,
  resource_key TEXT UNIQUE, -- Optional unique key for API access
  
  -- Product assignment
  knox BOOLEAN DEFAULT FALSE,
  brity BOOLEAN DEFAULT FALSE,
  
  -- Category classification
  is_common BOOLEAN DEFAULT FALSE, -- 공통 사용 여부
  category_1 TEXT, -- 구부1
  category_2 TEXT, -- 구부2
  artboard TEXT, -- 아트보드
  component TEXT, -- 컴포넌트
  classification TEXT, -- 구분
  
  -- Main content (Korean)
  korean_text TEXT NOT NULL, -- 국문 (메인 텍스트)
  
  -- Translations
  english_text TEXT, -- 영문
  chinese_text TEXT, -- 중문
  japanese_text TEXT, -- 일문
  vietnamese_text TEXT, -- 베트남어
  
  -- Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('approved', 'draft', 'review')),
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified_date DATE -- 최종 수정일 (별도 추적)
);

-- Create indexes for better performance
CREATE INDEX idx_language_resources_id ON language_resources(id);
CREATE INDEX idx_language_resources_key ON language_resources(resource_key);
CREATE INDEX idx_language_resources_knox ON language_resources(knox);
CREATE INDEX idx_language_resources_brity ON language_resources(brity);
CREATE INDEX idx_language_resources_common ON language_resources(is_common);
CREATE INDEX idx_language_resources_category1 ON language_resources(category_1);
CREATE INDEX idx_language_resources_category2 ON language_resources(category_2);
CREATE INDEX idx_language_resources_artboard ON language_resources(artboard);
CREATE INDEX idx_language_resources_component ON language_resources(component);
CREATE INDEX idx_language_resources_status ON language_resources(status);
CREATE INDEX idx_language_resources_updated ON language_resources(updated_at);

-- Full-text search indexes
CREATE INDEX idx_language_resources_korean_search ON language_resources USING GIN(to_tsvector('korean', korean_text));
CREATE INDEX idx_language_resources_english_search ON language_resources USING GIN(to_tsvector('english', COALESCE(english_text, '')));
CREATE INDEX idx_language_resources_search_all ON language_resources USING GIN(
  to_tsvector('korean', 
    COALESCE(korean_text, '') || ' ' ||
    COALESCE(english_text, '') || ' ' ||
    COALESCE(chinese_text, '') || ' ' ||
    COALESCE(japanese_text, '') || ' ' ||
    COALESCE(vietnamese_text, '') || ' ' ||
    COALESCE(category_1, '') || ' ' ||
    COALESCE(category_2, '') || ' ' ||
    COALESCE(artboard, '') || ' ' ||
    COALESCE(component, '') || ' ' ||
    COALESCE(classification, '')
  )
);

-- Update trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_modified_date = CURRENT_DATE;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_language_resources_updated_at
    BEFORE UPDATE ON language_resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data based on the image
INSERT INTO language_resources (
  id, knox, brity, is_common, category_1, category_2, artboard, component, classification,
  korean_text, english_text, chinese_text, japanese_text, vietnamese_text,
  status, author, last_modified_date
) VALUES 
(1, FALSE, TRUE, FALSE, NULL, NULL, NULL, NULL, '입력 코드', 'Enter the Code', 'Thêm vào sau & thoát', NULL, NULL, 'approved', 'system', '2023-07-03'),

(2, TRUE, TRUE, FALSE, '4.Workspace', '4.2 Create a', 'Popup', NULL, '나중에 추가하고 닫기', 'Add Later & Close', '稍后添加&关闭', '後で追加して閉じる', NULL, 'approved', 'system', '2023-07-03'),

(3, TRUE, TRUE, FALSE, '음성/영상', '노티픽', NULL, NULL, '(user name)님이 음성 대화를 요청합니다.', 'You are in voice/video chat', '正在进行语音/视频聊天', 'ボイス/ビデオチャット中です。', 'Bạn đang voice/video chat.', 'approved', 'system', '2023-07-03'),

(4, TRUE, TRUE, FALSE, '시스템 메시지', NULL, NULL, NULL, '(user name)님이 음성 대화를 요청합니다.', '(user name) asks for a voice chat.', '(user name)请求语音通话。', '(user name)さんがボイスチャットをリクエストしています。', '(user name) yêu cầu voice chat.', 'approved', 'system', '2023-07-03'),

(5, TRUE, FALSE, FALSE, '가이드 문구', NULL, NULL, NULL, '회사 보안 정책에 따라 화면 공유가 제한됩니다.', 'You cannot view the screen shared due to the company''s security policy.', '根据公司安全政策，无法查看屏幕共享。', '会社のセキュリティポリシーにより画面共有を表示することができません。', 'Việc nhìn chia sẻ màn hình bị hạn chế theo chính sách bảo mật của công ty.', 'approved', 'system', '2018-06-22'),

(6, TRUE, TRUE, FALSE, NULL, NULL, NULL, NULL, '화면 공유 중입니다.', 'Now sharing.', '正在共享。', '共有されています。', 'Đang chia sẻ màn hình.', 'approved', 'system', '2018-02-20'),

(7, TRUE, TRUE, FALSE, '시스템 메시지', NULL, NULL, NULL, '그룹 대화로 전환합니다.', 'Switch to group chat.', '切换至群聊天。', 'グループチャットに切り替えます。', 'Chuyển sang chat nhóm.', 'approved', 'system', '2018-02-20'),

(8, TRUE, TRUE, FALSE, '토스트', NULL, NULL, NULL, '공유자의 네트워크 상태가 불안정하여 화면공유가 종료되었습니다.', 'Screen sharing has ended because the network of the person sharing the screen is unstable.', '因为共享人网络连接不稳定，屏幕共享已结束。', '画面を共有している人のネットワークが不安定なため画面共有を終了しました。', 'Việc chia sẻ màn hình đã kết thúc do mạng của người chia sẻ bị gián đoạn.', 'approved', 'system', '2018-02-20');

-- Create a view for easier querying
CREATE VIEW language_resources_view AS
SELECT 
  id,
  resource_key,
  knox,
  brity,
  is_common,
  category_1,
  category_2,
  artboard,
  component,
  classification,
  korean_text,
  english_text,
  chinese_text,
  japanese_text,
  vietnamese_text,
  status,
  author,
  created_at,
  updated_at,
  last_modified_date,
  -- Helper columns
  CASE WHEN knox AND brity THEN 'Knox, Brity'
       WHEN knox THEN 'Knox'
       WHEN brity THEN 'Brity'
       ELSE 'None' END as products_display,
  -- Translation completeness
  CASE WHEN english_text IS NOT NULL AND chinese_text IS NOT NULL 
            AND japanese_text IS NOT NULL AND vietnamese_text IS NOT NULL 
       THEN TRUE ELSE FALSE END as translations_complete
FROM language_resources;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON language_resources TO authenticated;
-- GRANT ALL ON language_resources_view TO authenticated;
