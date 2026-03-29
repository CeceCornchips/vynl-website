// Minimal ambient type declarations for the Square Web Payments SDK.
// The SDK is loaded via a <Script> tag (CDN) and exposes window.Square.
// Full typings: https://developer.squareup.com/reference/sdks/web/payments

export interface SquareCardStyle {
  ".input-container"?: Record<string, string>;
  ".input-container.is-focus"?: Record<string, string>;
  ".input-container.is-error"?: Record<string, string>;
  ".message-text"?: Record<string, string>;
  ".message-icon"?: Record<string, string>;
  input?: Record<string, string>;
  "input::placeholder"?: Record<string, string>;
}

export interface SquareTokenizeResult {
  status: "OK" | "Cancel" | "Error";
  token?: string;
  errors?: Array<{ message: string; field?: string; type?: string }>;
}

export interface SquareCard {
  attach(elementId: string): Promise<void>;
  tokenize(): Promise<SquareTokenizeResult>;
  destroy(): Promise<void>;
}

export interface SquarePayments {
  card(options?: { style?: SquareCardStyle }): Promise<SquareCard>;
}

export interface SquareInstance {
  payments(appId: string, locationId: string): SquarePayments;
}

declare global {
  interface Window {
    Square?: SquareInstance;
  }
}
