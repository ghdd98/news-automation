import { getAllCompanyAliases } from '../config/companies.js';

const companyAliases = getAllCompanyAliases();

/**
 * 2단계: 기업명 매칭 필터 (제목+설명만)
 */
export function findMentionedCompanies(newsItem) {
    const text = `${newsItem.title} ${newsItem.description}`;
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

    for (const item of newsItems) {
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
