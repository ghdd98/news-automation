# News Automation

매일 오전 6시(KST)에 자동으로 뉴스를 수집하고 분석하는 시스템입니다.

## 📋 기능

- 🇰🇷 국내 뉴스 수집 (네이버 API, 언론사 RSS)
- 🌐 해외 뉴스 수집 (Google News RSS)
- 🤖 AI 분석으로 중요도 분류 (Gemini)
- 💾 Notion에 자동 저장

## 🚀 사용법

### 로컬 실행
```bash
npm install
node src/index.js
```

### GitHub Actions (자동 실행)
1. 이 레포를 Fork 또는 Clone
2. Settings → Secrets → Actions에 환경 변수 추가:
   - `GEMINI_API_KEY`
   - `NOTION_API_KEY`
   - `NOTION_DATABASE_ID`
   - `NAVER_CLIENT_ID`
   - `NAVER_CLIENT_SECRET`
3. 매일 오전 6시(KST)에 자동 실행됩니다

## 📁 구조

```
src/
├── collectors/  # 뉴스 수집
├── filters/     # 필터링 & AI 분석
├── exporters/   # Notion 저장
└── config/      # 설정
```

## ⚠️ 주의

`.env` 파일은 절대 GitHub에 올리지 마세요!
