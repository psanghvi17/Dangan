import React from 'react';

// Utility to handle ResizeObserver errors gracefully
// This addresses the common "ResizeObserver loop completed with undelivered notifications" error

export const suppressResizeObserverErrors = () => {
  // Override console.error to filter out ResizeObserver errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  // Handle global error events
  window.addEventListener('error', (event) => {
    if (
      event.message &&
      event.message.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      event.preventDefault();
      return false;
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason &&
      typeof event.reason === 'string' &&
      event.reason.includes('ResizeObserver loop completed with undelivered notifications')
    ) {
      event.preventDefault();
    }
  });
};

// Safe ResizeObserver wrapper that handles errors gracefully
export class SafeResizeObserver {
  private observer: ResizeObserver | null = null;
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    this.createObserver();
  }

  private createObserver() {
    try {
      this.observer = new ResizeObserver((entries, observer) => {
        try {
          this.callback(entries, observer);
        } catch (error) {
          // Silently handle ResizeObserver errors
          if (
            error instanceof Error &&
            error.message.includes('ResizeObserver loop completed with undelivered notifications')
          ) {
            return;
          }
          throw error;
        }
      });
    } catch (error) {
      console.warn('ResizeObserver not supported or failed to create:', error);
    }
  }

  observe(target: Element, options?: ResizeObserverOptions) {
    if (this.observer) {
      try {
        this.observer.observe(target, options);
      } catch (error) {
        console.warn('Failed to observe element:', error);
      }
    }
  }

  unobserve(target: Element) {
    if (this.observer) {
      try {
        this.observer.unobserve(target);
      } catch (error) {
        console.warn('Failed to unobserve element:', error);
      }
    }
  }

  disconnect() {
    if (this.observer) {
      try {
        this.observer.disconnect();
      } catch (error) {
        console.warn('Failed to disconnect observer:', error);
      }
    }
  }
}

// Hook for React components to use safe ResizeObserver
export const useSafeResizeObserver = (callback: ResizeObserverCallback) => {
  const observerRef = React.useRef<SafeResizeObserver | null>(null);

  React.useEffect(() => {
    observerRef.current = new SafeResizeObserver(callback);
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback]);

  return observerRef.current;
};
