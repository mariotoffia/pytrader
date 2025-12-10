import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock WebSocket globally with EventTarget support
class MockWebSocket extends EventTarget {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  private _closeTimeout: any;

  constructor(url: string) {
    super();
    this.url = url;
    // Simulate async connection
    this._closeTimeout = setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      const openEvent = new Event('open');
      if (this.onopen) {
        this.onopen(openEvent);
      }
      this.dispatchEvent(openEvent);
    }, 0);
  }

  send(_data: string): void {
    // Mock send
  }

  close(): void {
    clearTimeout(this._closeTimeout);
    this.readyState = MockWebSocket.CLOSED;
    const closeEvent = new CloseEvent('close');
    if (this.onclose) {
      this.onclose(closeEvent);
    }
    this.dispatchEvent(closeEvent);
  }
}

global.WebSocket = MockWebSocket as any;

// Mock fetch globally
global.fetch = vi.fn();
