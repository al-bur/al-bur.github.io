#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("node:path");
const { execSync } = require("node:child_process");

async function buildAll() {
  const servicesDir = path.join(process.cwd(), "services");
  const distDir = path.join(process.cwd(), "dist");

  try {
    // dist 디렉토리 정리
    await fs.emptyDir(distDir);
    console.log("🧹 dist 디렉토리를 정리했습니다.");

    // shared 폴더 먼저 빌드
    await buildSharedFolder();
    console.log("✅ 공유 폴더 빌드 완료");

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

    // public 폴더의 파일들 복사 (robots.txt, sitemap.xml, favicon, manifest 등)
    await copyPublicFiles();
    console.log("✅ 공개 파일 복사 완료");

    // 메인 index.html 생성
    await createMainPage(services);
    console.log("✅ 메인 페이지 생성 완료");

    console.log("🎉 모든 서비스 빌드가 완료되었습니다!");
  } catch (error) {
    console.error("빌드 중 오류가 발생했습니다:", error.message);
    process.exit(1);
  }
}

async function buildService(serviceName) {
  const serviceDir = path.join("services", serviceName, "src");
  const outputDir = path.join("dist", serviceName);
  const tsConfigPath = path.join("services", serviceName, "tsconfig.json");
  const viteConfigPath = path.join("services", serviceName, "vite.config.ts");
  const packageJsonPath = path.join("services", serviceName, "package.json");

  // Vite 기반 서비스인지 확인
  if (await fs.pathExists(viteConfigPath)) {
    console.log(`🔄 ${serviceName}: Vite 빌드 중...`);
    try {
      // Vite build command 실행
      execSync("pnpm run build", {
        stdio: "inherit",
        cwd: path.join(process.cwd(), "services", serviceName),
      });
    } catch (error) {
      console.error(`❌ ${serviceName}: Vite 빌드 실패`);
      throw error;
    }
  } else {
    // 기존 방식 (TypeScript + 파일 복사)
    await fs.ensureDir(outputDir);

    if (await fs.pathExists(serviceDir)) {
      // TypeScript 파일이 있는지 확인
      const hasTsFiles = await checkForTsFiles(serviceDir);

      if (hasTsFiles && (await fs.pathExists(tsConfigPath))) {
        console.log(`🔄 ${serviceName}: TypeScript 컴파일 중...`);
        try {
          // TypeScript 컴파일
          execSync(`npx tsc -p services/${serviceName}/tsconfig.json`, {
            stdio: "inherit",
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
    } else {
      console.warn(`⚠️  ${serviceName}의 src 폴더를 찾을 수 없습니다.`);
    }
  }

  // shared 폴더를 각 서비스에 복사 (빌드 완료 후)
  const distSharedDir = path.join(process.cwd(), "dist", "shared");
  if (await fs.pathExists(distSharedDir)) {
    const serviceSharedDir = path.join(outputDir, "shared");
    await fs.copy(distSharedDir, serviceSharedDir);
  }
}

async function checkForTsFiles(dir) {
  const files = await fs.readdir(dir);

  // 바로 하위 파일 확인
  if (files.some((file) => file.endsWith(".ts") || file.endsWith(".tsx"))) {
    return true;
  }

  // 하위 디렉토리에서 TypeScript 파일 찾기
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      if (await checkForTsFiles(filePath)) {
        return true;
      }
    }
  }

  return false;
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
    } else if (!file.endsWith(".ts") && !file.endsWith(".tsx")) {
      await fs.copy(sourcePath, outputPath);
    }
  }
}

async function buildSharedFolder() {
  const sharedDir = path.join(process.cwd(), "shared");
  const sharedOutputDir = path.join(process.cwd(), "dist", "shared");

  if (await fs.pathExists(sharedDir)) {
    await fs.ensureDir(sharedOutputDir);

    const hasSharedTsFiles = await checkForTsFiles(sharedDir);

    if (hasSharedTsFiles) {
      try {
        // shared 폴더의 TypeScript 컴파일 (tsconfig.json에서 outDir이 이미 설정됨)
        execSync("npx tsc -p shared/tsconfig.json", {
          stdio: "inherit",
          cwd: process.cwd(),
        });

        // TypeScript 컴파일 완료
      } catch (error) {
        console.warn("⚠️  shared 폴더 TypeScript 컴파일 실패");
        throw error;
      }
    }
  }
}

async function copySharedFiles(outputDir) {
  const distSharedDir = path.join(process.cwd(), "dist", "shared");
  const serviceSharedDir = path.join(outputDir, "shared");

  // 이미 빌드된 shared 폴더를 각 서비스에 복사
  if (await fs.pathExists(distSharedDir)) {
    await fs.copy(distSharedDir, serviceSharedDir);
  }
}

function getServiceDescription(serviceName) {
  const descriptions = {
    "qr-scanner":
      "Free online QR code scanner and reader. Scan QR codes using camera or upload image files. Fast, secure, and mobile-friendly.",
    "file-converter":
      "Convert files between different formats quickly and securely. Support for images, documents, and media files.",
    "text-tools":
      "Essential text utilities including word counter, case converter, and text formatting tools for productivity.",
    "image-optimizer":
      "Optimize and compress images without losing quality. Perfect for web developers and content creators.",
  };
  return (
    descriptions[serviceName] ||
    `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} - A powerful online utility tool for your productivity needs.`
  );
}

function getServiceIcon(serviceName) {
  const icons = {
    "qr-scanner": "📱",
    "file-converter": "🔄",
    "text-tools": "📝",
    "image-optimizer": "🖼️",
    "pdf-tools": "📄",
    "color-picker": "🎨",
    "url-shortener": "🔗",
    "password-generator": "🔐",
  };
  return icons[serviceName] || "🛠️";
}

async function createMainPage(services) {
  const currentDate = new Date().toISOString();
  const servicesList = services.map((service) => ({
    name: service,
    url: `https://al-bur.github.io/${service}/`,
    description: getServiceDescription(service),
  }));

  const mainHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Primary Meta Tags -->
    <title>Al-bur Services - Free Online Tools & Utilities | QR Scanner, Converter Tools</title>
    <meta name="title" content="Al-bur Services - Free Online Tools & Utilities | QR Scanner, Converter Tools">
    <meta name="description" content="Discover powerful free online tools including QR code scanner, file converters, and productivity utilities. Fast, secure, and mobile-friendly web applications for global users.">
    <meta name="keywords" content="QR scanner, QR code reader, online tools, free utilities, web apps, file converter, productivity tools, mobile scanner">
    <meta name="author" content="Al-bur">
    <meta name="robots" content="index, follow">
    <meta name="language" content="English">
    <meta name="revisit-after" content="1 days">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://al-bur.github.io/">
    <meta property="og:title" content="Al-bur Services - Free Online Tools & Utilities">
    <meta property="og:description" content="Discover powerful free online tools including QR code scanner, file converters, and productivity utilities. Fast, secure, and mobile-friendly.">
    <meta property="og:image" content="https://al-bur.github.io/assets/og-image.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Al-bur Services">
    <meta property="og:locale" content="en_US">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://al-bur.github.io/">
    <meta property="twitter:title" content="Al-bur Services - Free Online Tools & Utilities">
    <meta property="twitter:description" content="Discover powerful free online tools including QR code scanner, file converters, and productivity utilities. Fast, secure, and mobile-friendly.">
    <meta property="twitter:image" content="https://al-bur.github.io/assets/twitter-image.jpg">
    <meta name="twitter:image:alt" content="Al-bur Services - Free Online Tools">
    
    <!-- Additional SEO Meta Tags -->
    <meta name="theme-color" content="#ff6b6b">
    <meta name="msapplication-TileColor" content="#ff6b6b">
    <meta name="application-name" content="Al-bur Services">
    <meta name="apple-mobile-web-app-title" content="Al-bur Services">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="format-detection" content="telephone=no">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://al-bur.github.io/">
    
    <!-- Alternative Languages -->
    <link rel="alternate" hreflang="en" href="https://al-bur.github.io/">
    <link rel="alternate" hreflang="ko" href="https://al-bur.github.io/ko/">
    <link rel="alternate" hreflang="ja" href="https://al-bur.github.io/ja/">
    <link rel="alternate" hreflang="zh" href="https://al-bur.github.io/zh/">
    <link rel="alternate" hreflang="es" href="https://al-bur.github.io/es/">
    <link rel="alternate" hreflang="fr" href="https://al-bur.github.io/fr/">
    <link rel="alternate" hreflang="de" href="https://al-bur.github.io/de/">
    <link rel="alternate" hreflang="x-default" href="https://al-bur.github.io/">
    
    <!-- Favicon and Icons -->
    <link rel="icon" href="/favicon.ico">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/manifest.json">
    
    <!-- Preconnect for Performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://www.googletagmanager.com">
    
    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Al-bur Services",
      "description": "Free online tools and utilities including QR code scanner, file converters, and productivity applications",
      "url": "https://al-bur.github.io/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://al-bur.github.io/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Al-bur",
        "url": "https://al-bur.github.io/"
      },
      "dateModified": "${currentDate}",
      "inLanguage": "en-US",
      "mainEntity": [
        ${servicesList
          .map(
            (service) => `{
          "@type": "WebApplication",
          "name": "${service.name.charAt(0).toUpperCase() + service.name.slice(1)} Tool",
          "description": "${service.description}",
          "url": "${service.url}",
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "Any",
          "browserRequirements": "Requires HTML5 support",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }`
          )
          .join(",\n        ")}
      ]
    }
    </script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            background: #ffffff;
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
            color: #333;
            padding: 3rem 0;
            background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 50%, #a8e6cf 100%);
            background: -webkit-linear-gradient(135deg, #ff6b6b, #ffa726, #a8e6cf);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .header h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
        }

        .header p {
            font-size: 1.2rem;
            opacity: 0.8;
            color: #666;
        }

        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }

        .service-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 1.5rem;
            padding: 2rem;
            box-shadow: 0 10px 40px rgba(255, 107, 107, 0.2);
            transition: all 0.3s ease;
            text-decoration: none;
            color: inherit;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
        }
        
        .service-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff6b6b 0%, #ffa726 50%, #a8e6cf 100%);
        }

        .service-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 20px 50px rgba(255, 164, 38, 0.3);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .service-card h3 {
            color: #ff6b6b;
            margin-bottom: 1rem;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .service-card p {
            color: #666;
            margin-bottom: 1rem;
        }

        .service-link {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 2rem;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(255, 164, 38, 0.3);
        }

        .service-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 164, 38, 0.4);
            background: linear-gradient(135deg, #ff5252 0%, #ff9800 100%);
        }

        .footer {
            text-align: center;
            color: #666;
            opacity: 0.8;
            margin-top: 2rem;
        }

        .github-link {
            color: #ff6b6b;
            text-decoration: none;
            font-weight: 500;
        }

        .github-link:hover {
            color: #ff5252;
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
        
        /* Additional SEO-friendly styles */
        .hero-section {
            text-align: center;
            margin-bottom: 4rem;
        }
        
        .hero-section h2 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            font-weight: 400;
            color: #333;
        }
        
        .features-list {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 2rem;
            margin: 2rem 0;
        }
        
        .feature-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #666;
            opacity: 0.9;
        }
        
        .service-icon {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        
        .service-description {
            font-size: 0.95rem;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <!-- Skip to main content for accessibility -->
    <a href="#main-content" class="sr-only">Skip to main content</a>
    
    <div class="container">
        <header class="header">
            <h1>🚀 Al-bur Services</h1>
            <p>Free Online Tools & Utilities for Everyone</p>
        </header>
        
        <section class="hero-section">
            <h2>Powerful Web Applications at Your Fingertips</h2>
            <div class="features-list">
                <div class="feature-item">
                    <span>⚡</span>
                    <span>Fast & Secure</span>
                </div>
                <div class="feature-item">
                    <span>📱</span>
                    <span>Mobile Friendly</span>
                </div>
                <div class="feature-item">
                    <span>🔒</span>
                    <span>Privacy First</span>
                </div>
                <div class="feature-item">
                    <span>🌍</span>
                    <span>Works Globally</span>
                </div>
            </div>
        </section>

        <main id="main-content" class="services-grid" role="main">
            ${servicesList
              .map(
                (service) => `
            <article class="service-card" itemscope itemtype="https://schema.org/WebApplication">
                <div class="service-icon">${getServiceIcon(service.name)}</div>
                <h3 itemprop="name">${service.name.charAt(0).toUpperCase() + service.name.slice(1).replace("-", " ")}</h3>
                <p class="service-description" itemprop="description">${service.description}</p>
                <a href="./${service.name}/" class="service-link" itemprop="url" aria-label="Open ${service.name} tool">
                    Launch Tool →
                </a>
            </article>
            `
              )
              .join("")}
            
            ${
              services.length === 0
                ? `
            <article class="service-card">
                <div class="service-icon">🔧</div>
                <h3>Services Coming Soon</h3>
                <p class="service-description">We're preparing amazing tools for you. Check back soon for new utilities and applications!</p>
                <button class="service-link" disabled>Coming Soon</button>
            </article>
            `
                : ""
            }
        </main>

        <footer class="footer" role="contentinfo">
            <p>
                <span>© 2025 Al-bur Services</span> | 
                <a href="https://pages.github.com/" class="github-link" rel="noopener">GitHub Pages</a> | 
                <span>Built with ❤️ for global users</span>
            </p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.7;">
                <a href="#" class="github-link">Privacy Policy</a> | 
                <a href="#" class="github-link">Terms of Service</a> |
                <a href="#" class="github-link">Contact Us</a>
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

  await fs.writeFile(path.join("dist", "index.html"), mainHtml);
}

async function copyPublicFiles() {
  const publicDir = path.join(process.cwd(), "public");
  const distDir = path.join(process.cwd(), "dist");

  // public 디렉토리가 존재하는지 확인
  if (!(await fs.pathExists(publicDir))) {
    return;
  }

  try {
    // public 디렉토리의 모든 파일을 dist로 복사
    await fs.copy(publicDir, distDir, {
      overwrite: true,
      filter: (src, dest) => {
        // 숨겨진 파일이나 .DS_Store는 제외
        const filename = path.basename(src);
        return !filename.startsWith(".") && filename !== ".DS_Store";
      },
    });
  } catch (error) {
    console.warn("공개 파일 복사 중 오류:", error.message);
  }
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
