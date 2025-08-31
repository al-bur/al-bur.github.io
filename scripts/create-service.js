#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("node:path");

async function createService() {
  const serviceName = process.argv[2];

  if (!serviceName) {
    console.error("서비스 이름을 입력해주세요.");
    console.log("사용법: pnpm create-service <service-name>");
    process.exit(1);
  }

  const serviceDir = path.join("services", serviceName);
  const distDir = path.join("dist", serviceName);

  // 서비스 디렉토리가 이미 존재하는지 확인
  if (await fs.pathExists(serviceDir)) {
    console.error(`서비스 '${serviceName}'이 이미 존재합니다.`);
    process.exit(1);
  }

  try {
    // 서비스 디렉토리 생성
    await fs.ensureDir(serviceDir);
    await fs.ensureDir(path.join(serviceDir, "src"));
    await fs.ensureDir(path.join(serviceDir, "public"));

    // package.json 생성
    const packageJson = {
      name: `@al-bur/${serviceName}`,
      version: "1.0.0",
      private: true,
      scripts: {
        dev: "node ../scripts/dev-server.js",
        build: "node ../scripts/build-service.js",
        serve: `http-server ../../dist/${serviceName} -p 8080 -o`,
        lint: "biome lint ./src",
        "lint:fix": "biome lint --write ./src",
        format: "biome format ./src",
        "format:write": "biome format --write ./src",
        "type-check": "tsc --noEmit",
      },
      devDependencies: {
        "http-server": "^14.1.1",
      },
    };

    await fs.writeJson(path.join(serviceDir, "package.json"), packageJson, {
      spaces: 2,
    });

    // tsconfig.json 생성 (루트 설정을 확장)
    const tsConfig = {
      extends: "../../tsconfig.base.json",
      compilerOptions: {
        outDir: `../../dist/${serviceName}`,
        rootDir: "./src",
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };

    await fs.writeJson(path.join(serviceDir, "tsconfig.json"), tsConfig, {
      spaces: 2,
    });

    // HTML 템플릿 생성
    const htmlTemplate = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${serviceName} - Al-bur Services</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <nav class="nav">
        <a href="../" class="nav-home">← Home</a>
        <h1>${serviceName}</h1>
    </nav>
    
    <main class="main">
        <div class="container">
            <h2>환영합니다!</h2>
            <p>${serviceName} 서비스입니다.</p>
            <div class="features">
                <div class="feature-card">
                    <h3>기능 1</h3>
                    <p>첫 번째 기능 설명</p>
                </div>
                <div class="feature-card">
                    <h3>기능 2</h3>
                    <p>두 번째 기능 설명</p>
                </div>
            </div>
        </div>
    </main>

    <!-- GA4 Analytics (자동 로드) -->
    <script type="module" src="./shared/analytics/ga4-init.js"></script>
    <script type="module" src="./shared/analytics/ga4-helpers.js"></script>
    
    <!-- 서비스별 스크립트 -->
    <script type="module" src="./script.js"></script>
</body>
</html>`;

    // CSS 템플릿 생성
    const cssTemplate = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f8fafc;
}

.nav {
    background: #fff;
    padding: 1rem 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    gap: 2rem;
}

.nav-home {
    color: #6366f1;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: background-color 0.2s;
}

.nav-home:hover {
    background: #f1f5f9;
}

.nav h1 {
    color: #1e293b;
    font-size: 1.5rem;
}

.main {
    padding: 2rem;
}

.container {
    max-width: 800px;
    margin: 0 auto;
}

.container h2 {
    color: #1e293b;
    margin-bottom: 1rem;
    font-size: 2rem;
}

.container > p {
    color: #64748b;
    font-size: 1.1rem;
    margin-bottom: 2rem;
}

.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 2rem;
}

.feature-card {
    background: #fff;
    padding: 2rem;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
}

.feature-card h3 {
    color: #1e293b;
    margin-bottom: 0.5rem;
}

.feature-card p {
    color: #64748b;
}

@media (max-width: 768px) {
    .nav {
        padding: 1rem;
    }
    
    .main {
        padding: 1rem;
    }
    
    .features {
        grid-template-columns: 1fr;
    }
}`;

    // TypeScript 템플릿 생성
    const tsTemplate = `console.log('${serviceName} 서비스가 로드되었습니다.');

// 서비스별 기능을 여기에 구현
document.addEventListener('DOMContentLoaded', function(): void {
    console.log('DOM이 로드되었습니다.');
    
    // 예제: 기능 카드 클릭 이벤트
    const featureCards = document.querySelectorAll<HTMLElement>('.feature-card');
    
    featureCards.forEach((card: HTMLElement, index: number) => {
        card.addEventListener('click', function(): void {
            alert(\`기능 \${index + 1}을 클릭했습니다!\`);
        });
        
        card.style.cursor = 'pointer';
    });
});`;

    // 파일들 생성
    await fs.writeFile(path.join(serviceDir, "src", "index.html"), htmlTemplate);
    await fs.writeFile(path.join(serviceDir, "src", "style.css"), cssTemplate);
    await fs.writeFile(path.join(serviceDir, "src", "script.ts"), tsTemplate);

    console.log(`✅ 서비스 '${serviceName}'이 성공적으로 생성되었습니다!`);
    console.log(`📁 위치: ${serviceDir}`);
    console.log("");
    console.log("다음 명령어로 개발을 시작할 수 있습니다:");
    console.log(`  pnpm --filter @al-bur/${serviceName} dev`);
    console.log(`  pnpm --filter @al-bur/${serviceName} build`);
  } catch (error) {
    console.error("서비스 생성 중 오류가 발생했습니다:", error.message);
    process.exit(1);
  }
}

createService();
