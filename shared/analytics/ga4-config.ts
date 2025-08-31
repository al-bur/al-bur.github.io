// GA4 Configuration
export interface GA4Config {
  measurementId: string;
  enabled: boolean;
  debugMode: boolean;
  serviceName?: string;
}

export const GA4_CONFIG: GA4Config = {
  measurementId: 'G-SMD74FQLV1',
  enabled: typeof window !== 'undefined' && 
           window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1' &&
           !window.location.hostname.includes('github.dev'),
  debugMode: typeof window !== 'undefined' && 
             (window.location.hostname === 'localhost' || 
              window.location.search.includes('debug=true')),
};

// Custom dimensions for service tracking
export const GA4_CUSTOM_DIMENSIONS = {
  SERVICE_NAME: 'service_name',
  PAGE_TYPE: 'page_type',
  USER_ENGAGEMENT: 'user_engagement',
} as const;

// Event names for consistent tracking
export const GA4_EVENTS = {
  PAGE_VIEW: 'page_view',
  SERVICE_ENTER: 'service_enter',
  SERVICE_EXIT: 'service_exit',
  FEATURE_CLICK: 'feature_click',
  NAVIGATION_CLICK: 'navigation_click',
  ERROR_OCCURRED: 'error_occurred',
} as const;