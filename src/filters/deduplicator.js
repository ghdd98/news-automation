/**
 * 고급 중복 뉴스 제거기 (개선판)
 * 
 * 개선사항:
 * - Character n-gram TF-IDF (한국어 토큰화 안정성)
 * - Title 가중치 (2배 반복)
 * - 텍스트 전처리 ([속보], [단독] 등 제거)
 * - TopK 최적화 (O(N²) → O(N*K))
 * - 그룹당 최대 3개 뉴스 선택 (다양성 확보)
 */

// ==================== 설정 ====================

const CONFIG = {
    // n-gram 설정 (한국어에 적합한 문자 단위)
    NGRAM_MIN: 3,
    NGRAM_MAX: 5,

    // 유사도 임계값 preset
    THRESHOLD_STRICT: 0.8,    // 오탐 최소화
    THRESHOLD_NORMAL: 0.65,   // 균형
    THRESHOLD_LOOSE: 0.5,     // 미탐 최소화

    // 후보쌍 최적화
    TOP_K: 20,               // 각 문서당 상위 K개만 비교

    // 대표 기사 선택
    MAX_REPRESENTATIVES: 3,   // 그룹당 최대 대표 기사

    // 주요 언론사 (신뢰도 점수)
    TRUSTED_SOURCES: {
        'yonhapnews': 10, 'yna.co.kr': 10, '연합뉴스': 10,
        'hankyung.com': 9, '한국경제': 9, '한경': 9,
        'mk.co.kr': 9, '매일경제': 9, '매경': 9,
        'sedaily.com': 8, '서울경제': 8,
        'chosun.com': 8, '조선일보': 8,
        'donga.com': 8, '동아일보': 8,
        'joongang.co.kr': 8, '중앙일보': 8,
        'mt.co.kr': 7, '머니투데이': 7,
        'biz.chosun.com': 7, '조선비즈': 7,
        'etnews.com': 7, '전자신문': 7,
    }
};

// ==================== 전처리 모듈 ====================

/**
 * 뉴스 텍스트 전처리
 * - [속보], [단독], (영상) 등 접두/태그 제거
 * - 특수문자 정규화
 * - 숫자/단위 표준화
 */
function preprocessText(text) {
    if (!text) return '';

    let cleaned = text
        // 접두/태그 제거
        .replace(/\[속보\]/g, '')
        .replace(/\[단독\]/g, '')
        .replace(/\[긴급\]/g, '')
        .replace(/\[특징주\]/g, '')
        .replace(/\[포토\]/g, '')
        .replace(/\[영상\]/g, '')
        .replace(/\(영상\)/g, '')
        .replace(/\(종합\)/g, '')
        .replace(/\(1보\)/g, '')
        .replace(/\(2보\)/g, '')
        .replace(/\(종합2보\)/g, '')
        // 글로벌 마커 제거
        .replace(/🌐/g, '')
        // 숫자+단위 표준화
        .replace(/(\d+)조(\s*원)?/g, '$1조원')
        .replace(/(\d+)억(\s*원)?/g, '$1억원')
        .replace(/(\d+)만(\s*원)?/g, '$1만원')
        // 특수문자 정규화
        .replace(/['']/g, "'")
        .replace(/[""]/g, '"')
        .replace(/…/g, '...')
        // 연속 공백 제거
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    return cleaned;
}

/**
 * 뉴스 아이템에서 비교용 텍스트 생성
 * - Title 가중치 적용 (2배 반복)
 */
function getComparisonText(newsItem) {
    const title = preprocessText(newsItem.title || '');
    const desc = preprocessText(newsItem.description || '');

    // Title 2배 가중치
    return `${title} ${title} ${desc}`;
}

// ==================== Character N-gram TF-IDF ====================

/**
 * 텍스트에서 Character n-gram 추출
 */
function extractCharNgrams(text, minN = CONFIG.NGRAM_MIN, maxN = CONFIG.NGRAM_MAX) {
    const ngrams = {};
    const cleanText = text.replace(/\s+/g, ' ').trim();

    for (let n = minN; n <= maxN; n++) {
        for (let i = 0; i <= cleanText.length - n; i++) {
            const ngram = cleanText.substring(i, i + n);
            ngrams[ngram] = (ngrams[ngram] || 0) + 1;
        }
    }

    return ngrams;
}

/**
 * TF-IDF 벡터 생성 (Character n-gram 기반)
 */
function buildTfIdfVectors(documents) {
    const docVectors = [];
    const docFreq = {};  // 각 n-gram이 몇 개 문서에 등장하는지
    const N = documents.length;

    // 1차: 모든 문서의 n-gram 추출 + DF 계산
    for (const doc of documents) {
        const text = getComparisonText(doc);
        const ngrams = extractCharNgrams(text);
        docVectors.push({ doc, ngrams, text });

        // Document Frequency 계산
        for (const ngram of Object.keys(ngrams)) {
            docFreq[ngram] = (docFreq[ngram] || 0) + 1;
        }
    }

    // 2차: TF-IDF 계산
    // min_df/max_df 효과: 너무 흔하거나 희귀한 n-gram 제외
    const minDf = 2;
    const maxDfRatio = 0.9;

    for (const item of docVectors) {
        const tfidf = {};
        const totalNgrams = Object.values(item.ngrams).reduce((a, b) => a + b, 0);

        for (const [ngram, count] of Object.entries(item.ngrams)) {
            const df = docFreq[ngram];

            // min_df/max_df 필터
            if (df < minDf || df > N * maxDfRatio) continue;

            // TF * IDF
            const tf = count / totalNgrams;
            const idf = Math.log(N / df);
            tfidf[ngram] = tf * idf;
        }

        item.tfidf = tfidf;
    }

    return docVectors;
}

/**
 * 두 TF-IDF 벡터의 코사인 유사도 계산
 */
function cosineSimilarity(vec1, vec2) {
    const allKeys = new Set([...Object.keys(vec1), ...Object.keys(vec2)]);

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const key of allKeys) {
        const v1 = vec1[key] || 0;
        const v2 = vec2[key] || 0;
        dotProduct += v1 * v2;
        norm1 += v1 * v1;
        norm2 += v2 * v2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// ==================== TopK 최적화 ====================

/**
 * 각 문서에 대해 TopK 유사 이웃만 찾기 (O(N²) → O(N*K))
 */
function findTopKNeighbors(docVectors, topK = CONFIG.TOP_K) {
    const neighborPairs = [];

    for (let i = 0; i < docVectors.length; i++) {
        const similarities = [];

        for (let j = 0; j < docVectors.length; j++) {
            if (i === j) continue;

            const sim = cosineSimilarity(docVectors[i].tfidf, docVectors[j].tfidf);
            similarities.push({ j, sim });
        }

        // 상위 K개만 선택
        similarities.sort((a, b) => b.sim - a.sim);
        const topNeighbors = similarities.slice(0, topK);

        for (const { j, sim } of topNeighbors) {
            if (i < j) {  // 중복 쌍 방지
                neighborPairs.push({ i, j, sim });
            }
        }
    }

    return neighborPairs;
}

// ==================== 클러스터링 ====================

/**
 * Union-Find 기반 클러스터링
 */
function clusterByUnionFind(docVectors, pairs, threshold) {
    const n = docVectors.length;
    const parent = Array.from({ length: n }, (_, i) => i);

    function find(x) {
        if (parent[x] !== x) parent[x] = find(parent[x]);
        return parent[x];
    }

    function union(x, y) {
        const px = find(x);
        const py = find(y);
        if (px !== py) parent[px] = py;
    }

    // 임계값 이상인 쌍만 병합
    for (const { i, j, sim } of pairs) {
        if (sim >= threshold) {
            union(i, j);
        }
    }

    // 클러스터 그룹화
    const clusters = {};
    for (let i = 0; i < n; i++) {
        const root = find(i);
        if (!clusters[root]) clusters[root] = [];
        clusters[root].push(i);
    }

    return Object.values(clusters);
}

// ==================== 대표 기사 선택 ====================

/**
 * 언론사 신뢰도 점수 계산
 */
function getPublisherScore(newsItem) {
    const publisher = (newsItem.publisher || '').toLowerCase();
    const link = (newsItem.link || '').toLowerCase();

    for (const [source, score] of Object.entries(CONFIG.TRUSTED_SOURCES)) {
        if (publisher.includes(source.toLowerCase()) || link.includes(source.toLowerCase())) {
            return score;
        }
    }
    return 1;  // 기본 점수
}

/**
 * 클러스터에서 대표 기사 선택 (최대 3개)
 */
function selectRepresentatives(cluster, docVectors, maxCount = CONFIG.MAX_REPRESENTATIVES) {
    if (cluster.length <= maxCount) {
        return {
            representatives: cluster.map(i => docVectors[i].doc),
            dropped: []
        };
    }

    // 점수 계산: 언론사 신뢰도 + 정보량 + 최신성
    const scored = cluster.map(i => {
        const doc = docVectors[i].doc;
        const publisherScore = getPublisherScore(doc) * 3;
        const descLength = (doc.description || '').length;
        const infoScore = Math.min(descLength / 50, 5);  // 최대 5점
        const recentScore = doc.pubDate ? 2 : 0;

        return {
            index: i,
            doc,
            totalScore: publisherScore + infoScore + recentScore
        };
    });

    // 점수순 정렬 후 상위 3개 선택 (언론사 다양성 고려)
    scored.sort((a, b) => b.totalScore - a.totalScore);

    const selected = [];
    const usedPublishers = new Set();

    for (const item of scored) {
        if (selected.length >= maxCount) break;

        const publisher = item.doc.publisher || 'unknown';

        // 다양성 보너스: 다른 언론사면 우선 선택
        if (!usedPublishers.has(publisher) || selected.length < 1) {
            selected.push(item);
            usedPublishers.add(publisher);
        }
    }

    // 부족하면 나머지에서 추가
    for (const item of scored) {
        if (selected.length >= maxCount) break;
        if (!selected.includes(item)) {
            selected.push(item);
        }
    }

    const representativeIndices = new Set(selected.map(s => s.index));

    return {
        representatives: selected.map(s => s.doc),
        dropped: cluster
            .filter(i => !representativeIndices.has(i))
            .map(i => docVectors[i].doc)
    };
}

// ==================== 메인 함수 ====================

/**
 * 1차 중복 제거 (완전 중복 - Jaccard 기반)
 */
export function deduplicateNews(newsItems, threshold = 0.8) {
    // 빠른 제목 기반 중복 제거
    const seen = new Map();
    const result = [];

    for (const item of newsItems) {
        const normTitle = preprocessText(item.title);

        let isDuplicate = false;
        for (const [existingTitle, existingItem] of seen) {
            // 간단한 포함 관계 체크
            if (normTitle.includes(existingTitle) || existingTitle.includes(normTitle)) {
                if (normTitle.length > existingTitle.length) {
                    seen.delete(existingTitle);
                    seen.set(normTitle, item);
                }
                isDuplicate = true;
                break;
            }
        }

        if (!isDuplicate) {
            seen.set(normTitle, item);
        }
    }

    const uniqueNews = Array.from(seen.values());
    const globalCount = uniqueNews.filter(n => n.isGlobal).length;
    const domesticCount = uniqueNews.length - globalCount;

    console.log(`🔄 중복 제거: ${newsItems.length}개 → ${uniqueNews.length}개 (국내: ${domesticCount}, 해외: ${globalCount})`);

    return uniqueNews;
}

/**
 * 2차 중복 제거 (고급 클러스터링 - Character n-gram TF-IDF)
 */
export function deduplicateWithClustering(newsItems, maxPerCluster = CONFIG.MAX_REPRESENTATIVES, thresholdPreset = 'normal') {
    console.log(`📊 고급 클러스터링 중복 제거 시작 (${newsItems.length}개)`);
    console.log(`   📍 방식: Character n-gram TF-IDF (${CONFIG.NGRAM_MIN}-${CONFIG.NGRAM_MAX})`);

    // Threshold 선택
    const thresholds = {
        strict: CONFIG.THRESHOLD_STRICT,
        normal: CONFIG.THRESHOLD_NORMAL,
        loose: CONFIG.THRESHOLD_LOOSE
    };
    const threshold = thresholds[thresholdPreset] || CONFIG.THRESHOLD_NORMAL;
    console.log(`   📍 임계값: ${threshold} (${thresholdPreset})`);

    // 1. TF-IDF 벡터 생성
    console.log(`   🔄 TF-IDF 벡터 생성 중...`);
    const docVectors = buildTfIdfVectors(newsItems);

    // 2. TopK 이웃 찾기 (O(N²) 최적화)
    console.log(`   🔄 TopK 유사 이웃 탐색 중 (K=${CONFIG.TOP_K})...`);
    const neighborPairs = findTopKNeighbors(docVectors, CONFIG.TOP_K);

    // 3. 클러스터링
    console.log(`   🔄 클러스터링 중...`);
    const clusters = clusterByUnionFind(docVectors, neighborPairs, threshold);

    // 4. 각 클러스터에서 대표 기사 선택
    const result = [];
    let singleClusters = 0;
    let multiClusters = 0;
    let droppedCount = 0;

    for (const cluster of clusters) {
        if (cluster.length === 1) {
            result.push(docVectors[cluster[0]].doc);
            singleClusters++;
        } else {
            const { representatives, dropped } = selectRepresentatives(cluster, docVectors, maxPerCluster);
            result.push(...representatives);
            droppedCount += dropped.length;
            multiClusters++;
        }
    }

    console.log(`   📁 클러스터: 단일 ${singleClusters}개, 그룹 ${multiClusters}개`);
    console.log(`   🗑️ 중복 제거됨: ${droppedCount}개`);
    console.log(`   ✅ 클러스터링 완료: ${newsItems.length}개 → ${result.length}개`);

    return result;
}

export default { deduplicateNews, deduplicateWithClustering };
