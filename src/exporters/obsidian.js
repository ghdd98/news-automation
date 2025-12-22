import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { getDailyQuote } from '../config/quotes.js';
import { getCompanyEmoji } from '../filters/companyFilter.js';

dotenv.config();

// GitHub Actions 환경에서는 프로젝트 루트의 'daily_news' 폴더에 저장 후 Git Push
const NEWS_FOLDER_NAME = 'daily_news';

/**
 * 날짜별 마크다운 파일 생성
 */
export async function saveToObsidian(criticalNews, referenceNews) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const koreanDate = today.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });

    // 프로젝트 루트 기준 'daily_news' 폴더 사용 (상대 경로)
    const folderPath = path.join(process.cwd(), NEWS_FOLDER_NAME);

    // 폴더 생성
    await fs.mkdir(folderPath, { recursive: true });

    // 파일 경로
    const filePath = path.join(folderPath, `${dateStr}.md`);

    // 국내/해외 뉴스 분리
    const domesticCritical = criticalNews.filter(n => !n.isGlobal);
    const globalCritical = criticalNews.filter(n => n.isGlobal);
    const domesticRef = referenceNews.filter(n => !n.isGlobal);
    const globalRef = referenceNews.filter(n => n.isGlobal);

    // 마크다운 생성
    const content = generateMarkdown(koreanDate, domesticCritical, globalCritical, domesticRef, globalRef);

    // 파일 저장
    await fs.writeFile(filePath, content, 'utf-8');

    console.log(`✅ Obsidian 저장 완료: ${filePath}`);
    return filePath;
}

/**
 * 마크다운 콘텐츠 생성
 */
function generateMarkdown(date, domesticCritical, globalCritical, domesticRef, globalRef) {
    const quote = getDailyQuote();

    let md = `# 📰 ${date} 뉴스 브리핑

---

`;

    // 🔥 핵심 뉴스 - 국내
    md += `## 🔥 핵심 뉴스 - 국내 (${domesticCritical.length}건)

| 제목 | 기업 | 키워드 | URL |
|------|------|--------|-----|
`;

    for (const item of domesticCritical) {
        const emoji = getCompanyEmoji(item.companies);
        const companies = item.companies?.map(c => c.name).join(', ') || '-';
        const title = item.title.replace(/\|/g, '\\|');
        const keywords = (item.keywords || []).join(', ').replace(/\|/g, '\\|');
        md += `| **🔥 ${emoji} ${title}** | ${companies} | ${keywords} | [링크](${item.link}) |\n`;
    }
    if (domesticCritical.length === 0) md += `| - | - | - | - |\n`;

    md += `
---

`;

    // 🌐 핵심 뉴스 - 해외
    if (globalCritical.length > 0) {
        md += `## 🌐 핵심 뉴스 - 해외 (${globalCritical.length}건)

| 제목 | 산업 | 키워드 | URL |
|------|------|--------|-----|
`;

        for (const item of globalCritical) {
            const title = item.title.replace(/\|/g, '\\|');
            const keywords = (item.keywords || []).join(', ').replace(/\|/g, '\\|');
            const industry = item.originalIndustry || item.industry || '-';
            md += `| **${title}** | ${industry} | ${keywords} | [링크](${item.link}) |\n`;
        }

        md += `
---

`;
    }

    // 📎 참고 뉴스 - 국내
    md += `## 📎 참고 뉴스 - 국내 (${domesticRef.length}건)

| 제목 | 키워드 | URL |
|------|--------|-----|
`;

    for (const item of domesticRef.slice(0, 25)) {
        const title = item.title.replace(/\|/g, '\\|');
        const keywords = (item.keywords || []).join(', ').replace(/\|/g, '\\|');
        md += `| ${title} | ${keywords} | [링크](${item.link}) |\n`;
    }
    if (domesticRef.length === 0) md += `| - | - | - |\n`;

    md += `
---

`;

    // 🌐 참고 뉴스 - 해외
    if (globalRef.length > 0) {
        md += `## 🌐 참고 뉴스 - 해외 (${globalRef.length}건)

| 제목 | 산업 | URL |
|------|------|-----|
`;

        for (const item of globalRef.slice(0, 15)) {
            const title = item.title.replace(/\|/g, '\\|');
            const industry = item.originalIndustry || item.industry || '-';
            md += `| ${title} | ${industry} | [링크](${item.link}) |\n`;
        }

        md += `
---

`;
    }

    // 오늘의 글귀
    md += `## 💬 오늘의 한마디

> "${quote.text}"
> 
> — *${quote.author}*

---
*자동 생성됨 | News Automation System*
`;

    return md;
}

export default { saveToObsidian };
