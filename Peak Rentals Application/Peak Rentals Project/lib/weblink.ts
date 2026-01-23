// WebLink - Peer-to-peer communications wrapper
// Simplified version that uses API polling for signaling

import { v4 as uuidv4 } from "uuid";

export interface PeakMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  conversationId: string;
  delivered?: boolean;
  read?: boolean;
}

export interface WebLinkConfig {
  userId: string;
  onMessage: (message: PeakMessage) => void;
  onError: (error: Error) => void;
}

export class WebLinkClient {
  private userId: string;
  private config: WebLinkConfig;
  private pollInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  constructor(config: WebLinkConfig) {
    this.config = config;
    this.userId = config.userId;
  }

  // === CONNECTION MANAGEMENT ===

  connect(): void {
    if (this.isConnected) return;
    this.isConnected = true;
    // Start polling for new messages
    this.startPolling();
  }

  disconnect(): void {
    this.isConnected = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private startPolling(): void {
    // Poll every 3 seconds for new messages
    this.pollInterval = setInterval(() => {
      this.pollMessages();
    }, 3000);
  }

  private async pollMessages(): Promise<void> {
    // This would poll a signaling endpoint for new messages
    // For now, messages are fetched directly from conversations
  }

  // === MESSAGING ===

  createMessage(content: string, conversationId: string): PeakMessage {
    return {
      id: uuidv4(),
      senderId: this.userId,
      content,
      timestamp: Date.now(),
      conversationId,
      delivered: false
    };
  }

  // === STATUS ===

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let webLinkInstance: WebLinkClient | null = null;

export function getWebLink(config?: WebLinkConfig): WebLinkClient {
  if (!webLinkInstance && config) {
    webLinkInstance = new WebLinkClient(config);
  }
  if (!webLinkInstance) {
    throw new Error("WebLink not initialized. Call with config first.");
  }
  return webLinkInstance;
}

export function destroyWebLink(): void {
  webLinkInstance?.disconnect();
  webLinkInstance = null;
}

// Generate unique message ID
export function generateMessageId(): string {
  return uuidv4();
}
