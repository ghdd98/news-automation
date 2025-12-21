import { getAllCompanyAliases, EXCLUDE_CONTEXTS } from '../config/companies.js';

const companyAliases = getAllCompanyAliases();

/**
 * 스포츠/연예 컨텍스트 체크
 * 기업명이 있어도 스포츠 관련 키워드가 함께 있으면 제외
 */
function hasSportsContext(text) {
    const lowerText = text.toLowerCase();
    for (const keyword of EXCLUDE_CONTEXTS) {
        if (lowerText.includes(keyword.toLowerCase())) {
            return keyword;
        }
    }
    return null;
}

/**
 * 2단계: 기업명 매칭 필터 (제목+설명만)
 * 스포츠/연예 컨텍스트는 제외
 */
export function findMentionedCompanies(newsItem) {
    const text = `${newsItem.title} ${newsItem.description || ''}`;

    // 스포츠 컨텍스트 체크
    const sportsKeyword = hasSportsContext(text);
    if (sportsKeyword) {
        // 스포츠 관련 기사는 기업 매칭하지 않음
        return [];
    }

    const mentioned = [];
    const seen = new Set();

    for (const company of companyAliases) {
        if (text.includes(company.alias) && !seen.has(company.name)) {
            mentioned.push({
                name: company.name,
                industry: company.industry,
                isMajor: company.isMajor,
                isGlobal: company.isGlobal
            });
            seen.add(company.name);
        }
    }

    return mentioned;
}

export function filterByCompany(newsItems, requireCompany = false) {
    const filtered = [];
    let sportsExcluded = 0;

    for (const item of newsItems) {
        const text = `${item.title} ${item.description || ''}`;

        // 스포츠 컨텍스트 체크 (로깅용)
        if (hasSportsContext(text)) {
            sportsExcluded++;
        }

        const companies = findMentionedCompanies(item);
        if (companies.length > 0 || !requireCompany) {
            filtered.push({
                ...item,
                companies,
                hasMajorCompany: companies.some(c => c.isMajor),
                hasGlobalCompany: companies.some(c => c.isGlobal)
            });
        }
    }

    console.log(`🏢 [2단계 기업명] ${newsItems.length}개 → ${filtered.length}개 통과`);
    if (sportsExcluded > 0) {
        console.log(`   └─ 스포츠/연예 컨텍스트 제외: ${sportsExcluded}개`);
    }
    return filtered;
}

export function getCompanyEmoji(companies) {
    if (!companies || companies.length === 0) return '';
    const hasMajor = companies.some(c => c.isMajor && !c.isGlobal);
    const hasGlobal = companies.some(c => c.isGlobal);
    if (hasGlobal) return '🌍';
    if (hasMajor) return '⭐';
    return '';
}

export default { filterByCompany, findMentionedCompanies, getCompanyEmoji };
