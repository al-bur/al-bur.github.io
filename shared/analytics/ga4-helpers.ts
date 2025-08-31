// GA4 Helper Functions - Universal for all services
import GA4Analytics from './ga4-init.js';
import { GA4_EVENTS } from './ga4-config.js';

// 자동 기능 추적을 위한 헬퍼
export class GA4Helpers {
  private static analytics = GA4Analytics.getInstance();

  // 자동 클릭 추적 설정 (모든 서비스에서 사용 가능)
  public static setupAutoTracking(): void {
    // 기능 카드 자동 추적
    this.trackFeatureCards();
    
    // 네비게이션 링크 자동 추적
    this.trackNavigationLinks();
    
    // 버튼 클릭 자동 추적
    this.trackButtons();
    
    // 폼 제출 자동 추적
    this.trackForms();
  }

  private static trackFeatureCards(): void {
    const featureCards = document.querySelectorAll<HTMLElement>('.feature-card, [data-feature]');
    
    featureCards.forEach((card: HTMLElement, index: number) => {
      card.addEventListener('click', (): void => {
        const featureName = card.dataset.feature || 
                           card.querySelector('h3')?.textContent || 
                           `feature-${index + 1}`;
        
        this.analytics.trackFeatureClick(featureName, {
          position: index + 1,
          card_type: 'feature-card',
        });
      });
    });
  }

  private static trackNavigationLinks(): void {
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('nav a, .nav a, [data-nav]');
    
    navLinks.forEach((link: HTMLAnchorElement) => {
      link.addEventListener('click', (): void => {
        const destination = link.href;
        const linkText = link.textContent?.trim() || 'unknown';
        
        this.analytics.trackNavigation(destination, 'click');
        
        // 외부 링크 추적
        if (destination.startsWith('http') && !destination.includes(window.location.hostname)) {
          this.analytics.trackEvent('external_link_click', {
            destination,
            link_text: linkText,
          });
        }
      });
    });
  }

  private static trackButtons(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>('button, [role="button"], .btn');
    
    buttons.forEach((button: HTMLElement) => {
      button.addEventListener('click', (): void => {
        const buttonText = button.textContent?.trim() || 'unknown';
        const buttonId = button.id || undefined;
        const buttonClass = button.className || undefined;
        
        this.analytics.trackEvent('button_click', {
          button_text: buttonText,
          button_id: buttonId,
          button_class: buttonClass,
        });
      });
    });
  }

  private static trackForms(): void {
    const forms = document.querySelectorAll<HTMLFormElement>('form');
    
    forms.forEach((form: HTMLFormElement) => {
      form.addEventListener('submit', (event: SubmitEvent): void => {
        const formId = form.id || 'unnamed-form';
        const formAction = form.action || window.location.href;
        
        this.analytics.trackEvent('form_submit', {
          form_id: formId,
          form_action: formAction,
        });
      });
    });
  }

  // 수동 이벤트 추적 헬퍼들
  public static trackCustomEvent(eventName: string, parameters?: Record<string, any>): void {
    this.analytics.trackEvent(eventName, parameters);
  }

  public static trackFeature(featureName: string, action: string = 'click'): void {
    this.analytics.trackFeatureClick(featureName, { action });
  }

  public static trackSearch(query: string, results?: number): void {
    this.analytics.trackEvent('search', {
      search_term: query,
      search_results: results,
    });
  }

  public static trackDownload(fileName: string, fileType?: string): void {
    this.analytics.trackEvent('file_download', {
      file_name: fileName,
      file_type: fileType || fileName.split('.').pop(),
    });
  }

  public static trackShare(method: string, content?: string): void {
    this.analytics.trackEvent('share', {
      method,
      content_type: content || 'page',
    });
  }

  public static trackError(error: Error | string, context?: string): void {
    this.analytics.trackError(error, context);
  }

  // 성능 측정
  public static trackPerformance(): void {
    if (!window.performance) return;

    window.addEventListener('load', (): void => {
      // 페이지 로드 시간 측정
      const navigationTiming = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigationTiming) {
        this.analytics.trackEvent('page_performance', {
          load_time: Math.round(navigationTiming.loadEventEnd - navigationTiming.fetchStart),
          dom_content_loaded: Math.round(navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart),
          first_byte: Math.round(navigationTiming.responseStart - navigationTiming.fetchStart),
        });
      }
    });
  }
}

// 자동 추적 설정 (모든 서비스에서 자동 실행)
document.addEventListener('DOMContentLoaded', (): void => {
  // 약간의 지연을 두어 다른 스크립트들이 DOM을 조작할 시간을 줌
  setTimeout(() => {
    GA4Helpers.setupAutoTracking();
    GA4Helpers.trackPerformance();
  }, 100);
});

// 전역 접근을 위한 export
export default GA4Helpers;