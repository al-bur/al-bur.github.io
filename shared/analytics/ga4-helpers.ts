// GA4 Helper Functions - Universal for all services
import GA4Analytics from "./ga4-init.js";
import { GA4_EVENTS } from "./ga4-config.js";

const analytics = GA4Analytics.getInstance();

// 자동 클릭 추적 설정 (모든 서비스에서 사용 가능)
export function setupAutoTracking(): void {
  // 기능 카드 자동 추적
  trackFeatureCards();

  // 네비게이션 링크 자동 추적
  trackNavigationLinks();

  // 버튼 클릭 자동 추적
  trackButtons();

  // 폼 제출 자동 추적
  trackForms();
}

function trackFeatureCards(): void {
  const featureCards = document.querySelectorAll<HTMLElement>(".feature-card, [data-feature]");

  featureCards.forEach((card: HTMLElement, index: number) => {
    card.addEventListener("click", (): void => {
      const featureName =
        card.dataset.feature || card.querySelector("h3")?.textContent || `feature-${index + 1}`;

      analytics.trackFeatureClick(featureName, {
        position: index + 1,
        card_type: "feature-card",
      });
    });
  });
}

function trackNavigationLinks(): void {
  const navLinks = document.querySelectorAll<HTMLAnchorElement>("nav a, .nav a, [data-nav]");

  navLinks.forEach((link: HTMLAnchorElement) => {
    link.addEventListener("click", (): void => {
      const destination = link.href;
      const linkText = link.textContent?.trim() || "unknown";

      analytics.trackNavigation(destination, "click");

      // 외부 링크 추적
      if (destination.startsWith("http") && !destination.includes(window.location.hostname)) {
        analytics.trackEvent("external_link_click", {
          destination,
          link_text: linkText,
        });
      }
    });
  });
}

function trackButtons(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button, [role="button"], .btn');

  buttons.forEach((button: HTMLElement) => {
    button.addEventListener("click", (): void => {
      const buttonText = button.textContent?.trim() || "unknown";
      const buttonId = button.id || undefined;
      const buttonClass = button.className || undefined;

      analytics.trackEvent("button_click", {
        button_text: buttonText,
        button_id: buttonId,
        button_class: buttonClass,
      });
    });
  });
}

function trackForms(): void {
  const forms = document.querySelectorAll<HTMLFormElement>("form");

  forms.forEach((form: HTMLFormElement) => {
    form.addEventListener("submit", (event: SubmitEvent): void => {
      const formId = form.id || "unnamed-form";
      const formAction = form.action || window.location.href;

      analytics.trackEvent("form_submit", {
        form_id: formId,
        form_action: formAction,
      });
    });
  });
}

// 수동 이벤트 추적 헬퍼들
export function trackCustomEvent(eventName: string, parameters?: Record<string, unknown>): void {
  analytics.trackEvent(eventName, parameters);
}

export function trackFeature(featureName: string, action = "click"): void {
  analytics.trackFeatureClick(featureName, { action });
}

export function trackSearch(query: string, results?: number): void {
  analytics.trackEvent("search", {
    search_term: query,
    search_results: results,
  });
}

export function trackDownload(fileName: string, fileType?: string): void {
  analytics.trackEvent("file_download", {
    file_name: fileName,
    file_type: fileType || fileName.split(".").pop(),
  });
}

export function trackShare(method: string, content?: string): void {
  analytics.trackEvent("share", {
    method,
    content_type: content || "page",
  });
}

export function trackError(error: Error | string, context?: string): void {
  analytics.trackError(error, context);
}

// 성능 측정
export function trackPerformance(): void {
  if (!window.performance) return;

  window.addEventListener("load", (): void => {
    // 페이지 로드 시간 측정
    const navigationTiming = window.performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;

    if (navigationTiming) {
      analytics.trackEvent("page_performance", {
        load_time: Math.round(navigationTiming.loadEventEnd - navigationTiming.fetchStart),
        dom_content_loaded: Math.round(
          navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart
        ),
        first_byte: Math.round(navigationTiming.responseStart - navigationTiming.fetchStart),
      });
    }
  });
}

// 자동 추적 설정 (모든 서비스에서 자동 실행)
document.addEventListener("DOMContentLoaded", (): void => {
  // 약간의 지연을 두어 다른 스크립트들이 DOM을 조작할 시간을 줌
  setTimeout(() => {
    setupAutoTracking();
    trackPerformance();
  }, 100);
});

// 레거시 호환성을 위한 기본 export
export const GA4Helpers = {
  setupAutoTracking,
  trackCustomEvent,
  trackFeature,
  trackSearch,
  trackDownload,
  trackShare,
  trackError,
  trackPerformance,
};

export default GA4Helpers;
