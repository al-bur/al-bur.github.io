# CLAUDE.md - AI Agent Instructions

이 문서는 AI agent가 al-bur.github.io 모노레포를 효과적으로 이해하고 작업할 수 있도록 작성된 가이드입니다.

## 📋 프로젝트 개요

**프로젝트 이름**: al-bur.github.io  
**타입**: GitHub Pages 모노레포  
**목적**: 여러 웹 서비스를 단일 도메인에서 호스팅하는 정적 사이트 모음  
**기술 스택**: TypeScript, Biome, pnpm, GitHub Actions, GitHub Pages

## 🏗️ 아키텍처

### 디렉토리 구조
```
al-bur.github.io/
├── services/              # 모든 서비스 소스 코드
│   ├── portfolio/         # 포트폴리오 서비스
│   │   ├── src/          # TypeScript/HTML/CSS 소스
│   │   ├── package.json  # 서비스별 설정
│   │   └── tsconfig.json # 서비스별 TypeScript 설정
│   └── todo-app/         # 할일 관리 서비스
├── dist/                 # 빌드된 정적 파일 (GitHub Pages 배포용)
├── scripts/              # 유틸리티 스크립트
│   ├── create-service.js # 새 서비스 생성 스크립트
│   ├── build.js         # 빌드 스크립트
│   └── dev.js           # 개발 서버 스크립트
├── .github/workflows/    # GitHub Actions 워크플로우
├── biome.json           # Biome 설정 (린트/포맷)
├── tsconfig.json        # 루트 TypeScript 설정
├── tsconfig.base.json   # 공통 TypeScript 설정
├── pnpm-workspace.yaml  # pnpm 워크스페이스 설정
├── package.json         # 루트 패키지 설정
└── CLAUDE.md           # 이 파일
```

### URL 구조
- 메인 페이지: `https://al-bur.github.io/`
- 개별 서비스: `https://al-bur.github.io/{service-name}/`
- 로컬 개발: `http://localhost:3000/` (메인), `http://localhost:3000/{service-name}/`

## 🚀 주요 명령어

### 개발 명령어
```bash
# 의존성 설치
pnpm install

# 새 서비스 생성
pnpm create-service <service-name>

# 개발 서버 실행
pnpm dev <service-name>     # 특정 서비스
pnpm dev:all               # 모든 서비스

# 빌드
pnpm build                 # 모든 서비스 빌드
pnpm build:service <name>  # 특정 서비스만 빌드

# 미리보기
pnpm preview              # 빌드 후 로컬 서버 실행
```

### 코드 품질 명령어
```bash
# TypeScript 타입 체크
pnpm type-check

# Biome 린트
pnpm lint                 # 검사만
pnpm lint:fix            # 자동 수정

# Biome 포맷
pnpm format              # 검사만
pnpm format:write        # 자동 포맷팅

# 모든 것 한번에
pnpm check:fix           # 린트 + 포맷 + 자동 수정
```

## 🛠️ 워크플로우

### 1. 새 서비스 추가
```bash
# 1. 새 서비스 생성
pnpm create-service my-service

# 2. 생성된 구조 확인
services/my-service/
├── src/
│   ├── index.html      # 메인 페이지
│   ├── style.css       # 스타일
│   └── script.ts       # TypeScript 코드
├── package.json        # 서비스 설정
└── tsconfig.json       # TS 설정 (base 확장)

# 3. 개발 시작
pnpm dev my-service

# 4. 빌드 테스트
pnpm build
```

### 2. 코드 수정 워크플로우
```bash
# 1. 개발 모드로 시작
pnpm dev:all

# 2. 코드 수정 후 품질 검사
pnpm type-check
pnpm check:fix

# 3. 빌드 테스트
pnpm build

# 4. 배포 (main 브랜치 푸시)
git add . && git commit -m "feat: ..." && git push
```

## 🔧 기술적 세부사항

### TypeScript 설정
- **루트 설정**: `tsconfig.json` - 전체 프로젝트 타입 체크용
- **공통 설정**: `tsconfig.base.json` - 모든 서비스가 확장하는 기본 설정
- **서비스별 설정**: `services/{name}/tsconfig.json` - 개별 서비스 컴파일 설정

### Biome 설정
- **설정 파일**: `biome.json`
- **적용 범위**: TypeScript, JavaScript, JSON 파일
- **주요 규칙**: 
  - Arrow functions 선호
  - Node.js import protocol 사용
  - Template literal 권장

### 빌드 프로세스
1. **TypeScript 컴파일**: `.ts` 파일을 `.js`로 변환
2. **파일 복사**: HTML, CSS 등 정적 파일 복사
3. **메인 페이지 생성**: 모든 서비스 목록을 포함한 `dist/index.html` 생성
4. **GitHub Pages 배포**: `dist/` 폴더를 `gh-pages` 브랜치에 배포

### 개발 서버
- **파일 감시**: 소스 파일 변경 시 자동 리빌드
- **라이브 리로드**: 브라우저 새로고침으로 변경사항 확인
- **라우팅**: 각 서비스별 경로 처리

## 📝 코딩 가이드라인

### 파일 구조
```typescript
// services/{name}/src/script.ts
console.log('{name} 서비스가 로드되었습니다.');

// 서비스별 기능 구현
document.addEventListener('DOMContentLoaded', (): void => {
  console.log('DOM이 로드되었습니다.');
  
  // 타입 안전한 DOM 조작
  const elements = document.querySelectorAll<HTMLElement>('.selector');
  
  elements.forEach((element: HTMLElement, index: number) => {
    element.addEventListener('click', (): void => {
      // 이벤트 처리
    });
  });
});
```

### CSS 가이드라인
- **반응형 디자인** 필수
- **CSS Grid/Flexbox** 사용 권장
- **모바일 우선** 접근법

### HTML 구조
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{serviceName} - Al-bur Services</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <nav class="nav">
        <a href="../" class="nav-home">← Home</a>
        <h1>{serviceName}</h1>
    </nav>
    
    <main class="main">
        <!-- 서비스 내용 -->
    </main>

    <script src="./script.js"></script>
</body>
</html>
```

## 🚨 중요 사항

### DO
- ✅ 새 서비스는 반드시 `pnpm create-service` 사용
- ✅ TypeScript 사용 권장
- ✅ 코드 커밋 전 `pnpm check:fix` 실행
- ✅ 반응형 디자인 적용
- ✅ 접근성(a11y) 고려

### DON'T
- ❌ `dist/` 폴더 직접 수정 금지 (빌드 결과물)
- ❌ 루트 설정 파일 임의 변경 금지
- ❌ Node.js 빌트인 모듈은 `node:` prefix 필수
- ❌ console.log 프로덕션 코드에 남기지 않기

## 🔄 CI/CD

### GitHub Actions 워크플로우
1. **코드 체크아웃**
2. **Node.js/pnpm 설정**
3. **의존성 설치**
4. **린트 검사** (`pnpm lint`)
5. **타입 체크** (`pnpm type-check`)
6. **포맷 체크** (`pnpm format --write=false`)
7. **빌드** (`pnpm build`)
8. **GitHub Pages 배포**

### 배포 조건
- **트리거**: `main` 브랜치 푸시
- **전제조건**: 모든 검사 통과
- **결과**: `https://al-bur.github.io` 업데이트

## 💡 팁

### 디버깅
- **소스맵 활용**: TypeScript 디버깅 지원
- **개발 도구**: 브라우저 DevTools 사용
- **로그**: 개발 모드에서만 console.log 사용

### 성능
- **번들 크기**: 각 서비스 독립적으로 로드
- **캐싱**: GitHub Pages 자동 캐싱 활용
- **이미지**: 최적화된 이미지 사용 권장

### 확장성
- **서비스 분리**: 각 서비스는 완전히 독립적
- **공통 컴포넌트**: 필요시 공유 라이브러리 고려
- **상태 관리**: 서비스 간 상태 공유 최소화

---

**이 문서는 프로젝트 변경사항에 따라 지속적으로 업데이트됩니다.**  
**마지막 업데이트**: 2025-08-31