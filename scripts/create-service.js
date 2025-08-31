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

    // Generate SEO-optimized service metadata
    const serviceTitle = serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', ' ');
    const serviceDescription = getServiceDescription(serviceName);
    const serviceUrl = `https://al-bur.github.io/${serviceName}/`;
    const currentDate = new Date().toISOString();

    // HTML 템플릿 생성 (SEO 최적화)
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>${serviceTitle} - Free Online Tool | Al-bur Services</title>
    <meta name="title" content="${serviceTitle} - Free Online Tool | Al-bur Services">
    <meta name="description" content="${serviceDescription}">
    <meta name="keywords" content="${serviceName}, online tool, free utility, web app, ${serviceTitle.toLowerCase()}">
    <meta name="author" content="Al-bur">
    <meta name="robots" content="index, follow">
    <meta name="language" content="English">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${serviceUrl}">
    <meta property="og:title" content="${serviceTitle} - Free Online Tool">
    <meta property="og:description" content="${serviceDescription}">
    <meta property="og:image" content="https://al-bur.github.io/assets/${serviceName}-og.jpg">
    <meta property="og:site_name" content="Al-bur Services">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${serviceUrl}">
    <meta property="twitter:title" content="${serviceTitle} - Free Online Tool">
    <meta property="twitter:description" content="${serviceDescription}">
    <meta property="twitter:image" content="https://al-bur.github.io/assets/${serviceName}-twitter.jpg">
    
    <!-- Canonical and Alternate Languages -->
    <link rel="canonical" href="${serviceUrl}">
    <link rel="alternate" hreflang="en" href="${serviceUrl}">
    <link rel="alternate" hreflang="x-default" href="${serviceUrl}">
    
    <!-- Favicon -->
    <link rel="icon" href="/favicon.ico">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    
    <!-- Preconnect for Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Styles -->
    <link rel="stylesheet" href="./style.css">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "${serviceTitle}",
      "description": "${serviceDescription}",
      "url": "${serviceUrl}",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "Any",
      "browserRequirements": "Requires HTML5 support",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Al-bur Services",
        "url": "https://al-bur.github.io/"
      },
      "dateModified": "${currentDate}",
      "inLanguage": "en-US"
    }
    </script>
</head>
<body>
    <!-- Skip to main content for accessibility -->
    <a href="#main-content" class="sr-only">Skip to main content</a>
    
    <nav class="nav" role="navigation">
        <a href="../" class="nav-home" aria-label="Go back to Al-bur Services homepage">← Home</a>
        <h1>${serviceTitle}</h1>
    </nav>
    
    <main id="main-content" class="main" role="main">
        <div class="container">
            <header>
                <h2>Welcome to ${serviceTitle}!</h2>
                <p class="service-intro">${serviceDescription}</p>
            </header>
            
            <section class="features" aria-label="Features">
                <article class="feature-card">
                    <h3>Feature 1</h3>
                    <p>Describe the first main feature of this ${serviceName} tool.</p>
                </article>
                <article class="feature-card">
                    <h3>Feature 2</h3>
                    <p>Describe the second main feature of this ${serviceName} tool.</p>
                </article>
                <article class="feature-card">
                    <h3>Easy to Use</h3>
                    <p>Simple, intuitive interface designed for users worldwide.</p>
                </article>
            </section>
            
            <section class="cta-section">
                <h3>Ready to get started?</h3>
                <p>This ${serviceName} tool is completely free and works on all devices.</p>
                <button class="cta-button" type="button">Start Using Tool</button>
            </section>
        </div>
    </main>

    <footer class="footer" role="contentinfo">
        <p>
            <a href="../" class="footer-link">← Back to All Tools</a> | 
            <span>© 2025 Al-bur Services</span>
        </p>
    </footer>

    <!-- GA4 Analytics (자동 로드) -->
    <script type="module" src="./shared/analytics/ga4-init.js"></script>
    <script type="module" src="./shared/analytics/ga4-helpers.js"></script>
    
    <!-- 서비스별 스크립트 -->
    <script type="module" src="./script.js"></script>
</body>
</html>`;

    // Helper function for service descriptions
    function getServiceDescription(serviceName) {
      const descriptions = {
        'qr-scanner': 'Free online QR code scanner and reader. Scan QR codes using camera or upload image files. Fast, secure, and mobile-friendly.',
        'file-converter': 'Convert files between different formats quickly and securely. Support for images, documents, and media files.',
        'text-tools': 'Essential text utilities including word counter, case converter, and text formatting tools for productivity.',
        'image-optimizer': 'Optimize and compress images without losing quality. Perfect for web developers and content creators.',
        'pdf-tools': 'Comprehensive PDF utilities for merging, splitting, and converting PDF files online.',
        'color-picker': 'Advanced color picker and palette generator for designers and developers.',
        'url-shortener': 'Create short, memorable URLs for your links with detailed analytics.',
        'password-generator': 'Generate strong, secure passwords with customizable options.'
      };
      return descriptions[serviceName] || \`\${serviceName.charAt(0).toUpperCase() + serviceName.slice(1).replace('-', ' ')} - A powerful online utility tool designed for productivity and ease of use.\`;
    }

    // CSS 템플릿 생성 (SEO 최적화 및 접근성)
    const cssTemplate = \`/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #333;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

/* Accessibility - Screen Reader Only */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* Focus Styles for Accessibility */
*:focus {
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
}

/* Navigation */
.nav {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding: 1rem 2rem;
    display: flex;
    align-items: center;
    gap: 2rem;
    position: sticky;
    top: 0;
    z-index: 100;
}

.nav-home {
    color: white;
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
}

.nav-home:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.nav h1 {
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
}

/* Main Content */
.main {
    padding: 2rem;
    min-height: calc(100vh - 140px);
}

.container {
    max-width: 1000px;
    margin: 0 auto;
}

.container header {
    text-align: center;
    margin-bottom: 3rem;
    color: white;
}

.container h2 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    font-weight: 700;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.service-intro {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

/* Features Section */
.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
    margin-bottom: 3rem;
}

.feature-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    color: white;
    cursor: pointer;
}

.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.feature-card h3 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
    font-weight: 600;
}

.feature-card p {
    opacity: 0.9;
    line-height: 1.6;
}

/* Call to Action Section */
.cta-section {
    text-align: center;
    padding: 3rem 2rem;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    margin-bottom: 2rem;
}

.cta-section h3 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    font-weight: 600;
}

.cta-section p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.cta-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
}

/* Footer */
.footer {
    text-align: center;
    padding: 2rem;
    color: white;
    opacity: 0.8;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-link {
    color: white;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
}

.footer-link:hover {
    opacity: 0.8;
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav {
        padding: 1rem;
        flex-direction: column;
        gap: 1rem;
    }
    
    .main {
        padding: 1rem;
    }
    
    .features {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    
    .container h2 {
        font-size: 2rem;
    }
    
    .cta-section {
        padding: 2rem 1rem;
    }
    
    .feature-card {
        padding: 1.5rem;
    }
}\`;

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
