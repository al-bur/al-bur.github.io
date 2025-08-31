// Environment Detection Utilities
export const Environment = {
  // 개발 환경 감지
  isDevelopment(): boolean {
    return (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.hostname.includes("github.dev") ||
        window.location.hostname.includes("gitpod.io") ||
        window.location.hostname.includes("codesandbox.io"))
    );
  },

  // 프로덕션 환경 감지
  isProduction(): boolean {
    return !this.isDevelopment();
  },

  // GitHub Pages 환경 감지
  isGitHubPages(): boolean {
    return typeof window !== "undefined" && window.location.hostname.includes("github.io");
  },

  // 디버그 모드 감지
  isDebugMode(): boolean {
    return (
      typeof window !== "undefined" &&
      (window.location.search.includes("debug=true") ||
        localStorage.getItem("debug") === "true" ||
        this.isDevelopment())
    );
  },

  // 현재 서비스명 감지
  getCurrentService(): string {
    if (typeof window === "undefined") return "unknown";

    const path = window.location.pathname;

    // 메인 페이지
    if (path === "/" || path === "/index.html") {
      return "main";
    }

    // 서비스 페이지 (/service-name/ 형태)
    const matches = path.match(/^\/([^\/]+)\/?/);
    return matches ? matches[1] : "unknown";
  },

  // 환경 정보 로깅 (디버그용)
  logEnvironmentInfo(): void {
    if (!this.isDebugMode()) return;

    console.group("[Environment Info]");
    console.log("Development:", this.isDevelopment());
    console.log("Production:", this.isProduction());
    console.log("GitHub Pages:", this.isGitHubPages());
    console.log("Debug Mode:", this.isDebugMode());
    console.log("Current Service:", this.getCurrentService());
    console.log("Hostname:", window.location.hostname);
    console.log("Pathname:", window.location.pathname);
    console.groupEnd();
  },
};

export default Environment;
