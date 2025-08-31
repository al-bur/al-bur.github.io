# Al-bur GitHub Pages Monorepo

GitHub Pages를 활용한 멀티 서비스 모노레포입니다. `pnpm` 워크스페이스를 사용하여 여러 정적 웹 서비스를 효율적으로 관리하고 배포합니다.

## 🏗️ 프로젝트 구조

```
al-bur.github.io/
├── services/          # 모든 서비스 소스 코드
│   ├── portfolio/     # 포트폴리오 서비스
│   └── todo-app/      # 할일 관리 서비스
├── dist/             # 빌드된 정적 파일 (GitHub Pages가 서빙)
├── scripts/          # 유틸리티 스크립트
├── .github/          # GitHub Actions 워크플로우
├── package.json      # 루트 패키지 설정
└── pnpm-workspace.yaml # pnpm 워크스페이스 설정
```

## 🚀 시작하기

### 1. 의존성 설치
```bash
pnpm install
```

### 2. 개발 서버 실행
```bash
# 모든 서비스 개발 서버 실행
pnpm dev:all

# 특정 서비스만 개발 서버 실행
pnpm dev portfolio
pnpm dev todo-app
```

개발 서버가 실행되면 다음 URL로 접속 가능합니다:
- 메인 페이지: http://localhost:3000
- 개별 서비스: http://localhost:3000/portfolio, http://localhost:3000/todo-app

### 3. 프로덕션 빌드
```bash
# 모든 서비스 빌드
pnpm build

# 빌드 결과 미리보기
pnpm preview
```

## 📝 새 서비스 생성

새로운 서비스를 간단하게 생성할 수 있습니다:

```bash
pnpm create-service my-new-service
```

이 명령어는 다음을 자동으로 생성합니다:
- `services/my-new-service/` 디렉토리
- 기본 HTML, CSS, JavaScript 템플릿
- package.json 파일
- 반응형 디자인이 적용된 기본 레이아웃

## 🛠️ 사용 가능한 명령어

### 개발
- `pnpm dev <service>` - 특정 서비스 개발 서버 실행
- `pnpm dev:all` - 모든 서비스 개발 서버 실행

### 빌드
- `pnpm build` - 모든 서비스 빌드
- `pnpm build:service <service>` - 특정 서비스만 빌드

### 유틸리티
- `pnpm create-service <name>` - 새 서비스 생성
- `pnpm serve` - 빌드된 파일을 로컬 서버로 서빙
- `pnpm clean` - 빌드 결과물 정리
- `pnpm preview` - 빌드 후 미리보기

## 🚀 배포

GitHub Pages에 자동 배포되도록 설정되어 있습니다:

1. `main` 브랜치에 코드 푸시
2. GitHub Actions가 자동으로 빌드 및 배포 실행
3. `https://al-bur.github.io`에서 접속 가능

### 배포 URL 구조
- 메인 페이지: `https://al-bur.github.io/`
- 개별 서비스: `https://al-bur.github.io/{service-name}/`

## 🎨 서비스 개발 가이드

### 기본 구조
각 서비스는 다음 구조를 가집니다:

```
services/my-service/
├── src/
│   ├── index.html    # 메인 HTML 파일
│   ├── style.css     # 스타일시트
│   └── script.js     # JavaScript
└── package.json      # 서비스별 설정
```

### 개발 팁
1. **기본 경로**: 모든 서비스는 `/{service-name}/` 경로에서 동작합니다
2. **홈 링크**: `../`를 사용해 메인 페이지로 돌아갈 수 있습니다
3. **반응형**: 기본 템플릿은 모바일 친화적으로 제작되었습니다
4. **라이브 리로드**: 개발 모드에서 파일 변경 시 자동으로 다시 빌드됩니다

## 🔧 기술 스택

- **패키지 매니저**: pnpm (워크스페이스 지원)
- **빌드 도구**: 커스텀 Node.js 스크립트
- **배포**: GitHub Actions + GitHub Pages
- **개발 서버**: 내장 HTTP 서버 (파일 변경 감지 포함)

## 📚 예제 서비스

이 레포지토리에는 다음 예제 서비스가 포함되어 있습니다:

1. **portfolio** - 기본 포트폴리오 템플릿
2. **todo-app** - 할일 관리 앱 템플릿

각 서비스는 독립적으로 개발하고 배포할 수 있으며, 메인 페이지에서 통합된 네비게이션을 제공합니다.

## 🤝 기여하기

1. 새로운 서비스 아이디어가 있으시면 이슈를 생성해 주세요
2. 개선 사항이나 버그 수정은 PR로 제출해 주세요
3. 모든 기여는 환영합니다!

---

**Happy coding!** 🎉
