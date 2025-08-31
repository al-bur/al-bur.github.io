// GA4 Auto-Initialization System
import { GA4_CONFIG, GA4_CUSTOM_DIMENSIONS, GA4_EVENTS } from './ga4-config.js';

type GtagArgs = [
  command: 'js' | 'config' | 'event',
  targetId?: string | Date,
  config?: Record<string, unknown>
];

declare global {
  interface Window {
    gtag: (...args: GtagArgs) => void;
    dataLayer: unknown[];
  }
}

export class GA4Analytics {
  private static instance: GA4Analytics;
  private isInitialized = false;
  private serviceName: string;
  
  private constructor() {
    // 현재 경로에서 서비스명 자동 감지
    this.serviceName = this.detectServiceName();
  }

  public static getInstance(): GA4Analytics {
    if (!GA4Analytics.instance) {
      GA4Analytics.instance = new GA4Analytics();
    }
    return GA4Analytics.instance;
  }

  private detectServiceName(): string {
    const path = window.location.pathname;
    
    // 메인 페이지인 경우
    if (path === '/' || path === '/index.html') {
      return 'main';
    }
    
    // 서비스 페이지인 경우 (/service-name/ 형태)
    const matches = path.match(/^\/([^\/]+)\/?/);
    return matches ? matches[1] : 'unknown';
  }

  public async init(): Promise<void> {
    if (this.isInitialized || !GA4_CONFIG.enabled) {
      if (GA4_CONFIG.debugMode) {
        console.log('[GA4] Skipping initialization:', {
          isInitialized: this.isInitialized,
          enabled: GA4_CONFIG.enabled,
          hostname: window.location.hostname,
        });
      }
      return;
    }

    try {
      // Google Tag 스크립트 동적 로드
      await this.loadGoogleTag();
      
      // dataLayer 초기화
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args: GtagArgs): void => {
        window.dataLayer.push(args);
      };

      // GA4 설정
      window.gtag('js', new Date());
      window.gtag('config', GA4_CONFIG.measurementId, {
        debug_mode: GA4_CONFIG.debugMode,
        send_page_view: false, // 수동으로 페이지뷰 관리
        custom_map: {
          [GA4_CUSTOM_DIMENSIONS.SERVICE_NAME]: 'service_name',
          [GA4_CUSTOM_DIMENSIONS.PAGE_TYPE]: 'page_type',
        },
      });

      // 초기 페이지뷰 전송
      this.trackPageView();
      
      // 서비스 진입 이벤트
      this.trackServiceEnter();

      this.isInitialized = true;
      
      if (GA4_CONFIG.debugMode) {
        console.log('[GA4] Initialized successfully for service:', this.serviceName);
      }
    } catch (error) {
      console.error('[GA4] Initialization failed:', error);
    }
  }

  private loadGoogleTag(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 이미 로드된 경우 스킵
      if (document.querySelector(`script[src*="gtag/js"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_CONFIG.measurementId}`;
      
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Tag'));
      
      document.head.appendChild(script);
    });
  }

  public trackPageView(customProps?: Record<string, unknown>): void {
    if (!this.isInitialized || !GA4_CONFIG.enabled) return;

    const pageData = {
      page_title: document.title,
      page_location: window.location.href,
      [GA4_CUSTOM_DIMENSIONS.SERVICE_NAME]: this.serviceName,
      [GA4_CUSTOM_DIMENSIONS.PAGE_TYPE]: this.serviceName === 'main' ? 'home' : 'service',
      ...customProps,
    };

    window.gtag('event', GA4_EVENTS.PAGE_VIEW, pageData);
    
    if (GA4_CONFIG.debugMode) {
      console.log('[GA4] Page view tracked:', pageData);
    }
  }

  public trackServiceEnter(): void {
    if (!this.isInitialized || !GA4_CONFIG.enabled || this.serviceName === 'main') return;

    const eventData = {
      [GA4_CUSTOM_DIMENSIONS.SERVICE_NAME]: this.serviceName,
      value: 1,
    };

    window.gtag('event', GA4_EVENTS.SERVICE_ENTER, eventData);
    
    if (GA4_CONFIG.debugMode) {
      console.log('[GA4] Service enter tracked:', eventData);
    }
  }

  public trackEvent(eventName: string, parameters?: Record<string, unknown>): void {
    if (!this.isInitialized || !GA4_CONFIG.enabled) return;

    const eventData = {
      [GA4_CUSTOM_DIMENSIONS.SERVICE_NAME]: this.serviceName,
      ...parameters,
    };

    window.gtag('event', eventName, eventData);
    
    if (GA4_CONFIG.debugMode) {
      console.log(`[GA4] Event tracked: ${eventName}`, eventData);
    }
  }

  public trackFeatureClick(featureName: string, additionalData?: Record<string, unknown>): void {
    this.trackEvent(GA4_EVENTS.FEATURE_CLICK, {
      feature_name: featureName,
      ...additionalData,
    });
  }

  public trackNavigation(destination: string, method = 'click'): void {
    this.trackEvent(GA4_EVENTS.NAVIGATION_CLICK, {
      destination,
      method,
    });
  }

  public trackError(error: Error | string, context?: string): void {
    const errorData = {
      error_message: typeof error === 'string' ? error : error.message,
      error_context: context || 'unknown',
      error_service: this.serviceName,
    };

    this.trackEvent(GA4_EVENTS.ERROR_OCCURRED, errorData);
  }

  // 현재 서비스명 반환 (다른 스크립트에서 사용 가능)
  public getServiceName(): string {
    return this.serviceName;
  }
}

// 자동 초기화 (DOM 로드 시)
document.addEventListener('DOMContentLoaded', (): void => {
  const analytics = GA4Analytics.getInstance();
  analytics.init().catch((error) => {
    console.error('[GA4] Auto-initialization failed:', error);
  });
});

// 페이지 언로드 시 서비스 종료 추적
window.addEventListener('beforeunload', (): void => {
  const analytics = GA4Analytics.getInstance();
  if (analytics.getServiceName() !== 'main') {
    analytics.trackEvent(GA4_EVENTS.SERVICE_EXIT, {
      [GA4_CUSTOM_DIMENSIONS.SERVICE_NAME]: analytics.getServiceName(),
    });
  }
});

// 전역 접근을 위한 export
export default GA4Analytics;