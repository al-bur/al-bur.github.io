#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function buildAll() {
  const servicesDir = path.join(process.cwd(), 'services');
  const distDir = path.join(process.cwd(), 'dist');

  try {
    // dist 디렉토리 정리
    await fs.emptyDir(distDir);
    console.log('🧹 dist 디렉토리를 정리했습니다.');

    // shared 폴더 먼저 빌드
    await buildSharedFolder();
    console.log('✅ 공유 폴더 빌드 완료');

    // services 디렉토리에서 모든 서비스 찾기
    const services = await fs.readdir(servicesDir);

    console.log(`📦 ${services.length}개의 서비스를 빌드합니다...`);

    for (const service of services) {
      const servicePath = path.join(servicesDir, service);
      const stat = await fs.stat(servicePath);

      if (stat.isDirectory()) {
        console.log(`🔧 ${service} 빌드 중...`);
        await buildService(service);
        console.log(`✅ ${service} 빌드 완료`);
      }
    }
    
    // 메인 index.html 생성
    await createMainPage(services);
    console.log('✅ 메인 페이지 생성 완료');

    console.log('🎉 모든 서비스 빌드가 완료되었습니다!');
  } catch (error) {
    console.error('빌드 중 오류가 발생했습니다:', error.message);
    process.exit(1);
  }
}

async function buildService(serviceName) {
  const serviceDir = path.join('services', serviceName, 'src');
  const outputDir = path.join('dist', serviceName);
  const tsConfigPath = path.join('services', serviceName, 'tsconfig.json');

  // 출력 디렉토리 생성
  await fs.ensureDir(outputDir);

  if (await fs.pathExists(serviceDir)) {
    // TypeScript 파일이 있는지 확인
    const hasTsFiles = await checkForTsFiles(serviceDir);

    if (hasTsFiles && (await fs.pathExists(tsConfigPath))) {
      console.log(`🔄 ${serviceName}: TypeScript 컴파일 중...`);
      try {
        // TypeScript 컴파일
        execSync(`npx tsc -p services/${serviceName}/tsconfig.json`, {
          stdio: 'inherit',
          cwd: process.cwd(),
        });

        // HTML과 CSS 파일은 별도로 복사
        await copyNonTsFiles(serviceDir, outputDir);
      } catch (error) {
        console.error(`❌ ${serviceName}: TypeScript 컴파일 실패`);
        throw error;
      }
    } else {
      // TypeScript가 없으면 기존 방식으로 복사
      await fs.copy(serviceDir, outputDir);
    }
    
    // shared 폴더를 각 서비스에 복사 (빌드 완료 후)
    const distSharedDir = path.join(process.cwd(), 'dist', 'shared');
    if (await fs.pathExists(distSharedDir)) {
      const serviceSharedDir = path.join(outputDir, 'shared');
      await fs.copy(distSharedDir, serviceSharedDir);
    }
  } else {
    console.warn(`⚠️  ${serviceName}의 src 폴더를 찾을 수 없습니다.`);
  }
}

async function checkForTsFiles(dir) {
  const files = await fs.readdir(dir);
  return files.some((file) => file.endsWith('.ts') || file.endsWith('.tsx'));
}

async function copyNonTsFiles(sourceDir, outputDir) {
  const files = await fs.readdir(sourceDir);

  for (const file of files) {
    const sourcePath = path.join(sourceDir, file);
    const outputPath = path.join(outputDir, file);
    const stat = await fs.stat(sourcePath);

    if (stat.isDirectory()) {
      await fs.ensureDir(outputPath);
      await copyNonTsFiles(sourcePath, outputPath);
    } else if (!file.endsWith('.ts') && !file.endsWith('.tsx')) {
      await fs.copy(sourcePath, outputPath);
    }
  }
}

async function buildSharedFolder() {
  const sharedDir = path.join(process.cwd(), 'shared');
  const sharedOutputDir = path.join(process.cwd(), 'dist', 'shared');
  
  if (await fs.pathExists(sharedDir)) {
    await fs.ensureDir(sharedOutputDir);
    
    const hasSharedTsFiles = await checkForTsFiles(sharedDir);
    
    if (hasSharedTsFiles) {
      try {
        // shared 폴더의 TypeScript 컴파일
        execSync(`npx tsc -p shared/tsconfig.json`, {
          stdio: 'inherit',
          cwd: process.cwd(),
        });
        
        // TypeScript 이외의 파일들 복사
        await copyNonTsFiles(sharedDir, sharedOutputDir);
      } catch (error) {
        console.warn(`⚠️  shared 폴더 TypeScript 컴파일 실패, 원본 복사로 대체`);
        await fs.copy(sharedDir, sharedOutputDir);
      }
    } else {
      await fs.copy(sharedDir, sharedOutputDir);
    }
  }
}

async function copySharedFiles(outputDir) {
  const distSharedDir = path.join(process.cwd(), 'dist', 'shared');
  const serviceSharedDir = path.join(outputDir, 'shared');
  
  // 이미 빌드된 shared 폴더를 각 서비스에 복사
  if (await fs.pathExists(distSharedDir)) {
    await fs.copy(distSharedDir, serviceSharedDir);
  }
}

async function createMainPage(services) {
  const mainHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Al-bur Services</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .header {
            text-align: center;
            margin-bottom: 3rem;
            color: white;
        }

        .header h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }

        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .service-card {
            background: white;
            border-radius: 1rem;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            text-decoration: none;
            color: inherit;
        }

        .service-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .service-card h3 {
            color: #4c51bf;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }

        .service-card p {
            color: #666;
            margin-bottom: 1rem;
        }

        .service-link {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: 500;
            transition: opacity 0.2s;
        }

        .service-link:hover {
            opacity: 0.9;
        }

        .footer {
            text-align: center;
            color: white;
            opacity: 0.8;
            margin-top: 2rem;
        }

        .github-link {
            color: white;
            text-decoration: none;
            font-weight: 500;
        }

        .github-link:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .header h1 {
                font-size: 2rem;
            }
            
            .container {
                padding: 1rem;
            }
            
            .services-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🚀 Al-bur Services</h1>
            <p>다양한 웹 서비스들을 한 곳에서 만나보세요</p>
        </header>

        <main class="services-grid">
            ${services
              .map(
                (service) => `
            <div class="service-card">
                <h3>${service}</h3>
                <p>${service} 서비스에 대한 설명입니다. 클릭하여 접속해보세요.</p>
                <a href="./${service}/" class="service-link">서비스 접속 →</a>
            </div>
            `
              )
              .join('')}
            
            ${
              services.length === 0
                ? `
            <div class="service-card">
                <h3>서비스 준비 중</h3>
                <p>아직 생성된 서비스가 없습니다. 새 서비스를 생성해보세요!</p>
                <code style="background: #f1f5f9; padding: 0.5rem; border-radius: 0.25rem; display: block; margin-top: 1rem;">
                    pnpm create-service my-service
                </code>
            </div>
            `
                : ''
            }
        </main>

        <footer class="footer">
            <p>
                Powered by <a href="https://pages.github.com/" class="github-link">GitHub Pages</a> 
                | Built with ❤️ using pnpm
            </p>
        </footer>
    </div>

    <script>
        console.log('Al-bur Services - 메인 페이지가 로드되었습니다.');
        
        // 서비스 카드 애니메이션
        const cards = document.querySelectorAll('.service-card');
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                }
            });
        }, observerOptions);
        
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    </script>

    <!-- GA4 Analytics (자동 로드) -->
    <script type="module" src="./shared/analytics/ga4-init.js"></script>
    <script type="module" src="./shared/analytics/ga4-helpers.js"></script>
</body>
</html>`;

  await fs.writeFile(path.join('dist', 'index.html'), mainHtml);
}

// 특정 서비스만 빌드하는 경우
if (process.argv[2]) {
  const serviceName = process.argv[2];
  buildService(serviceName)
    .then(() => {
      console.log(`✅ ${serviceName} 서비스 빌드가 완료되었습니다.`);
    })
    .catch((error) => {
      console.error(`${serviceName} 빌드 중 오류:`, error.message);
      process.exit(1);
    });
} else {
  buildAll();
}
