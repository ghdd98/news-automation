/**
 * Notion 데이터베이스 초기 설정 스크립트
 * '뉴스_anti' 페이지에 데이터베이스를 생성합니다.
 */

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function findPageByTitle(title) {
    try {
        const response = await notion.search({
            query: title,
            filter: { property: 'object', value: 'page' }
        });

        for (const page of response.results) {
            const pageTitle = page.properties?.title?.title?.[0]?.text?.content ||
                page.properties?.Name?.title?.[0]?.text?.content ||
                '';
            if (pageTitle.includes(title)) {
                return page.id;
            }
        }
        return null;
    } catch (error) {
        console.error('페이지 검색 오류:', error.message);
        return null;
    }
}

async function createDatabase(parentId) {
    try {
        const response = await notion.databases.create({
            parent: { type: 'page_id', page_id: parentId },
            title: [{ type: 'text', text: { content: '📰 뉴스 브리핑' } }],
            properties: {
                '제목': { title: {} },
                '기업': { rich_text: {} },
                '산업': {
                    select: {
                        options: [
                            { name: '자동차', color: 'red' },
                            { name: '조선', color: 'blue' },
                            { name: '방산', color: 'green' },
                            { name: '가전', color: 'purple' },
                            { name: '반도체', color: 'yellow' },
                            { name: 'IT/AI', color: 'orange' }
                        ]
                    }
                },
                '요약': { rich_text: {} },
                '관련성': { number: {} },
                'URL': { url: {} },
                '날짜': { date: {} },
                '분류': {
                    select: {
                        options: [
                            { name: '핵심', color: 'red' },
                            { name: '참고', color: 'gray' }
                        ]
                    }
                }
            }
        });

        return response.id;
    } catch (error) {
        console.error('데이터베이스 생성 오류:', error.message);
        throw error;
    }
}

async function setup() {
    console.log('🔧 Notion 데이터베이스 설정 시작...\n');

    // 1. '뉴스_anti' 페이지 찾기
    console.log('📄 "뉴스_anti" 페이지 검색 중...');
    const pageId = await findPageByTitle('뉴스_anti');

    if (!pageId) {
        console.error('❌ "뉴스_anti" 페이지를 찾을 수 없습니다.');
        console.log('   Notion에서 페이지를 만들고 antigravity Integration을 연결해주세요.');
        process.exit(1);
    }

    console.log(`✅ 페이지 발견: ${pageId}\n`);

    // 2. 데이터베이스 생성
    console.log('📊 데이터베이스 생성 중...');
    const databaseId = await createDatabase(pageId);
    console.log(`✅ 데이터베이스 생성 완료: ${databaseId}\n`);

    // 3. .env 파일 업데이트
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf-8');
    envContent = envContent.replace(
        /NOTION_DATABASE_ID=.*/,
        `NOTION_DATABASE_ID=${databaseId}`
    );
    fs.writeFileSync(envPath, envContent);

    console.log('✅ .env 파일 업데이트 완료\n');
    console.log('========================================');
    console.log('🎉 설정 완료! 이제 npm start로 실행하세요.');
    console.log('========================================');
}

setup();
