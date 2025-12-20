import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📅 뉴스 자동화 스케줄러 시작');
console.log('⏰ 매일 오전 6시에 실행됩니다.');
console.log('');

/**
 * 메인 스크립트 실행
 */
function runNewsAutomation() {
    console.log(`\n🚀 뉴스 자동화 실행 시작: ${new Date().toLocaleString('ko-KR')}`);

    const indexPath = path.join(__dirname, 'index.js');
    const child = spawn('node', [indexPath], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    child.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ 실행 완료: ${new Date().toLocaleString('ko-KR')}`);
        } else {
            console.error(`❌ 실행 실패 (코드: ${code})`);
        }
    });
}

// 매일 오전 6시 실행 (크론: 분 시 일 월 요일)
cron.schedule('0 6 * * *', () => {
    runNewsAutomation();
}, {
    timezone: 'Asia/Seoul'
});

console.log('✅ 스케줄러가 백그라운드에서 실행 중입니다.');
console.log('   종료하려면 Ctrl+C를 누르세요.\n');

// 즉시 테스트 실행 옵션
if (process.argv.includes('--run-now')) {
    console.log('🧪 --run-now 옵션 감지, 즉시 실행합니다...\n');
    runNewsAutomation();
}
