#!/usr/bin/env node

const http = require('node:http');
const fs = require('fs-extra');
const path = require('node:path');
const chokidar = require('chokidar');
const { execSync } = require('node:child_process');

const PORT = process.env.PORT || 3000;

async function startDevServer() {
  const serviceName = process.argv[2];

  if (!serviceName) {
    console.error('서비스 이름을 입력해주세요.');
    console.log('사용법: pnpm dev <service-name>');
    console.log('또는: pnpm dev all (모든 서비스)');
    process.exit(1);
  }

  if (serviceName === 'all') {
    return startAllServicesWatcher();
  }

  const serviceDir = path.join('services', serviceName);

  if (!(await fs.pathExists(serviceDir))) {
    console.error(`서비스 '${serviceName}'을 찾을 수 없습니다.`);
    process.exit(1);
  }

  // 초기 빌드
  console.log(`🔨 ${serviceName} 초기 빌드 중...`);
  execSync(`node scripts/build.js ${serviceName}`, { stdio: 'inherit' });

  // 파일 변경 감지
  const watcher = chokidar.watch(path.join(serviceDir, 'src'), {
    ignored: /node_modules/,
    persistent: true,
  });

  watcher.on('change', async (filePath) => {
    console.log(`📝 파일 변경 감지: ${filePath}`);
    console.log(`🔄 ${serviceName} 다시 빌드 중...`);

    try {
      execSync(`node scripts/build.js ${serviceName}`, { stdio: 'inherit' });
      console.log(`✅ ${serviceName} 빌드 완료`);
    } catch (error) {
      console.error('❌ 빌드 오류:', error.message);
    }
  });

  // 개발 서버 시작
  const server = http.createServer(async (req, res) => {
    let filePath = req.url;

    // 기본 경로 처리
    if (filePath === '/') {
      filePath = '/index.html';
    }

    // 서비스별 라우팅
    if (filePath.startsWith(`/${serviceName}`)) {
      filePath = filePath.replace(`/${serviceName}`, '') || '/index.html';
      const fullPath = path.join(process.cwd(), 'dist', serviceName, filePath);
      return serveFile(fullPath, res);
    }

    // 메인 페이지 및 기타 파일
    const fullPath = path.join(process.cwd(), 'dist', filePath);
    serveFile(fullPath, res);
  });

  server.listen(PORT, () => {
    console.log('🚀 개발 서버가 시작되었습니다:');
    console.log(`   메인 페이지: http://localhost:${PORT}`);
    console.log(`   ${serviceName}: http://localhost:${PORT}/${serviceName}`);
    console.log('');
    console.log('파일 변경을 감지하고 있습니다... (Ctrl+C로 종료)');
  });

  // 우아한 종료
  process.on('SIGINT', () => {
    console.log('\\n👋 개발 서버를 종료합니다...');
    watcher.close();
    server.close();
    process.exit(0);
  });
}

async function startAllServicesWatcher() {
  console.log('🔨 모든 서비스 초기 빌드 중...');
  execSync('node scripts/build.js', { stdio: 'inherit' });

  // 모든 서비스 감시
  const watcher = chokidar.watch('services/*/src', {
    ignored: /node_modules/,
    persistent: true,
  });

  watcher.on('change', async (filePath) => {
    const serviceName = filePath.split(path.sep)[1];
    console.log(`📝 ${serviceName}: ${filePath} 변경 감지`);

    try {
      execSync(`node scripts/build.js ${serviceName}`, { stdio: 'inherit' });
      console.log(`✅ ${serviceName} 빌드 완료`);
    } catch (error) {
      console.error(`❌ ${serviceName} 빌드 오류:`, error.message);
    }
  });

  // 개발 서버 시작
  const server = http.createServer(async (req, res) => {
    let filePath = req.url;

    if (filePath === '/') {
      filePath = '/index.html';
    }

    const fullPath = path.join(process.cwd(), 'dist', filePath);
    serveFile(fullPath, res);
  });

  server.listen(PORT, () => {
    console.log('🚀 개발 서버가 시작되었습니다:');
    console.log(`   http://localhost:${PORT}`);
    console.log('');
    console.log('모든 서비스 파일 변경을 감지하고 있습니다... (Ctrl+C로 종료)');
  });

  process.on('SIGINT', () => {
    console.log('\\n👋 개발 서버를 종료합니다...');
    watcher.close();
    server.close();
    process.exit(0);
  });
}

function serveFile(filePath, res) {
  fs.readFile(filePath)
    .then((content) => {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      res.end(content);
    })
    .catch((err) => {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <h1>404 - 파일을 찾을 수 없습니다</h1>
          <p>요청한 파일: ${filePath}</p>
          <a href="/">홈으로 돌아가기</a>
        `);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h1>서버 오류</h1><p>${err.message}</p>`);
      }
    });
}

startDevServer();
