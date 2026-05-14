/**
 * WebLink - Peer-to-Peer Communications System for Peak
 *
 * Like a well-maintained mountain radio network, WebLink ensures clear communication
 * between members of the Peak community. Built with the same care we'd give to
 * outfitting a lodge's communication center - reliable, warm, and always ready
 * when you need it.
 *
 * Architecture:
 * - WebSocket signaling for connection establishment (the front desk)
 * - Optional WebRTC data channels for direct P2P messaging (private conversation)
 * - Graceful fallback to server-relayed messaging (the concierge path)
 * - Automatic reconnection with exponential backoff (never leave a guest waiting)
 *
 * @module lib/weblink
 */

import { v4 as uuidv4 } from "uuid";

// ============================================================================
// TYPE DEFINITIONS
// Like the guest registry at a fine lodge, we keep careful records
// ============================================================================

/**
 * Connection states - reflecting the journey of establishing communication,
 * much like arriving at a mountain retreat
 */
export type ConnectionState =
  | "disconnected" // Haven't arrived yet
  | "connecting" // Walking through the lobby
  | "connected" // Settled in, fire crackling
  | "reconnecting" // Stepped out, coming back
  | "error"; // Weather delay - temporary setback

/**
 * Message delivery status - tracking correspondence like a thoughtful host
 */
export type MessageStatus =
  | "pending" // Letter written, not yet sent
  | "sent" // Handed to the courier
  | "delivered" // Arrived at destination
  | "read" // Opened and acknowledged
  | "failed"; // Returned to sender

/**
 * Message priority levels - some conversations are more urgent
 */
export type MessagePriority = "low" | "normal" | "high" | "urgent";

/**
 * The fundamental unit of communication in Peak.
 * Each message is like a note passed between neighbors -
 * personal, traceable, and reliably delivered.
 */
export interface PeakMessage {
  /** Unique identifier - like a wax seal on correspondence */
  id: string;
  /** The person sending - always transparent in our community */
  senderId: string;
  /** The message content - clear and direct */
  content: string;
  /** When it was composed - precision matters in the mountains */
  timestamp: number;
  /** The ongoing conversation this belongs to */
  conversationId: string;
  /** Has it reached the recipient? */
  delivered: boolean;
  /** Has the recipient acknowledged it? */
  read: boolean;
  /** Current delivery status */
  status: MessageStatus;
  /** Message priority */
  priority: MessagePriority;
  /** Optional metadata for rich messages */
  metadata?: MessageMetadata;
}

/**
 * Extended message metadata for specialized communication needs
 */
export interface MessageMetadata {
  /** Reference to equipment being discussed */
  equipmentId?: string;
  /** Message type for special handling */
  type?: "text" | "system" | "inquiry" | "offer" | "confirmation";
  /** Optional attachments (references, not data) */
  attachments?: string[];
  /** Reply reference for threaded conversations */
  replyToId?: string;
  /** Edit history tracking */
  editedAt?: number;
}

/**
 * Signaling message types - the protocol for connection establishment
 */
export type SignalingType =
  | "register" // Announcing presence
  | "offer" // Initiating connection
  | "answer" // Responding to connection
  | "ice-candidate" // Network path discovery
  | "user-online" // Peer came online
  | "user-offline" // Peer went offline
  | "message-relay" // Server-relayed message
  | "ack" // Acknowledgment
  | "ping" // Heartbeat
  | "pong"; // Heartbeat response

/**
 * Signaling message structure
 */
export interface SignalingMessage {
  type: SignalingType;
  from?: string;
  to?: string;
  payload?: unknown;
  timestamp?: number;
}

/**
 * Peer connection information
 */
export interface PeerInfo {
  id: string;
  isConnected: boolean;
  lastSeen: number;
  connectionQuality: "excellent" | "good" | "fair" | "poor" | "unknown";
}

/**
 * Configuration for the WebLink client.
 * Like setting up your lodge room preferences - everything tailored to your needs.
 */
export interface WebLinkConfig {
  /** Your unique identifier in the community */
  userId: string;
  /** The signaling server URL - our communication switchboard */
  signalingUrl?: string;
  /** Called when a message arrives - like a gentle knock at the door */
  onMessage: (message: PeakMessage) => void;
  /** Called when a peer joins the conversation */
  onPeerConnected?: (peerId: string, peerInfo: PeerInfo) => void;
  /** Called when a peer steps away */
  onPeerDisconnected?: (peerId: string) => void;
  /** Called when connection state changes */
  onConnectionStateChange?: (state: ConnectionState) => void;
  /** Called when something goes wrong - we handle it gracefully */
  onError?: (error: WebLinkError) => void;
  /** Maximum reconnection attempts before giving up temporarily */
  maxReconnectAttempts?: number;
  /** Base delay for reconnection backoff (in ms) */
  reconnectBaseDelay?: number;
  /** Maximum delay between reconnection attempts (in ms) */
  reconnectMaxDelay?: number;
  /** Heartbeat interval to maintain connection (in ms) */
  heartbeatInterval?: number;
  /** Message queue size limit */
  maxQueueSize?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * WebLink-specific error types for graceful handling
 */
export interface WebLinkError extends Error {
  code: WebLinkErrorCode;
  recoverable: boolean;
  context?: Record<string, unknown>;
}

export type WebLinkErrorCode =
  | "CONNECTION_FAILED"
  | "CONNECTION_LOST"
  | "SIGNALING_ERROR"
  | "PEER_ERROR"
  | "MESSAGE_FAILED"
  | "QUEUE_OVERFLOW"
  | "AUTHENTICATION_FAILED"
  | "TIMEOUT"
  | "UNKNOWN";

// ============================================================================
// WEBLINK CLIENT
// The heart of our communication system - crafted with care
// ============================================================================

/**
 * WebLinkClient - Your personal connection to the Peak community
 *
 * Think of this as your private telephone line to other Peak members.
 * It handles all the complexity of maintaining connections so you can
 * focus on the conversation itself.
 *
 * @example
 * ```typescript
 * const weblink = new WebLinkClient({
 *   userId: session.user.id,
 *   onMessage: (msg) => displayMessage(msg),
 *   onPeerConnected: (id) => showOnlineStatus(id),
 * });
 *
 * weblink.connect();
 * weblink.sendMessage(peerId, "Interested in the equipment!", conversationId);
 * ```
 */
export class WebLinkClient {
  // Core state - the foundation of our lodge
  private userId: string;
  private config: Required<WebLinkConfig>;
  private socket: WebSocket | null = null;
  private connectionState: ConnectionState = "disconnected";

  // Reconnection management - persistence is a virtue
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  // Heartbeat - keeping the fire burning
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private lastPongReceived = 0;

  // Peer management - our guest registry
  private peers: Map<string, PeerInfo> = new Map();

  // Message queuing - no message left behind
  private pendingMessages: Map<string, PeakMessage[]> = new Map();
  private messageCallbacks: Map<string, (success: boolean) => void> = new Map();

  // Polling fallback - the reliable backup path
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private usePollingFallback = false;

  /**
   * Create a new WebLink client instance.
   * Like opening the door to your private lodge suite.
   */
  constructor(config: WebLinkConfig) {
    // Set defaults with the care of a seasoned host
    this.config = {
      signalingUrl:
        config.signalingUrl ||
        process.env.NEXT_PUBLIC_SIGNALING_URL ||
        "ws://localhost:8080",
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      reconnectBaseDelay: config.reconnectBaseDelay ?? 1000,
      reconnectMaxDelay: config.reconnectMaxDelay ?? 30000,
      heartbeatInterval: config.heartbeatInterval ?? 25000,
      maxQueueSize: config.maxQueueSize ?? 100,
      debug: config.debug ?? false,
      onPeerConnected: config.onPeerConnected ?? (() => {}),
      onPeerDisconnected: config.onPeerDisconnected ?? (() => {}),
      onConnectionStateChange: config.onConnectionStateChange ?? (() => {}),
      onError: config.onError ?? (() => {}),
      ...config,
    };

    this.userId = config.userId;

    this.log("WebLink client initialized", { userId: this.userId });
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // Opening and maintaining the lines of communication
  // ==========================================================================

  /**
   * Establish connection to the signaling server.
   * Like announcing your arrival at the lodge - letting others know you're here.
   */
  public connect(): void {
    if (
      this.connectionState === "connected" ||
      this.connectionState === "connecting"
    ) {
      this.log("Already connected or connecting, skipping");
      return;
    }

    this.setConnectionState("connecting");
    this.attemptWebSocketConnection();
  }

  /**
   * Gracefully disconnect from the network.
   * Like properly checking out - settling up and saying goodbye.
   */
  public disconnect(): void {
    this.log("Disconnecting gracefully");

    // Clear all timers - no lingering obligations
    this.clearReconnectTimeout();
    this.clearHeartbeat();
    this.clearPolling();

    // Close WebSocket with care
    if (this.socket) {
      this.socket.onclose = null; // Prevent reconnection attempt
      this.socket.close(1000, "Client disconnecting");
      this.socket = null;
    }

    // Clear peer connections
    this.peers.clear();

    this.setConnectionState("disconnected");
    this.reconnectAttempts = 0;
  }

  /**
   * Attempt to establish WebSocket connection
   */
  private attemptWebSocketConnection(): void {
    try {
      this.log("Attempting WebSocket connection", {
        url: this.config.signalingUrl,
      });

      this.socket = new WebSocket(this.config.signalingUrl);

      this.socket.onopen = this.handleSocketOpen.bind(this);
      this.socket.onmessage = this.handleSocketMessage.bind(this);
      this.socket.onclose = this.handleSocketClose.bind(this);
      this.socket.onerror = this.handleSocketError.bind(this);
    } catch (error) {
      this.log("WebSocket connection failed, falling back to polling", {
        error,
      });
      this.enablePollingFallback();
    }
  }

  /**
   * Handle successful WebSocket connection
   */
  private handleSocketOpen(): void {
    this.log("WebSocket connected");
    this.reconnectAttempts = 0;
    this.usePollingFallback = false;
    this.setConnectionState("connected");

    // Register with the signaling server
    this.sendSignaling({
      type: "register",
      from: this.userId,
      timestamp: Date.now(),
    });

    // Start heartbeat to keep connection alive
    this.startHeartbeat();

    // Flush any pending messages
    this.flushAllPendingMessages();
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data) as SignalingMessage;
      this.log("Received signaling message", { type: data.type });

      switch (data.type) {
        case "user-online":
          this.handlePeerOnline(data.from!);
          break;

        case "user-offline":
          this.handlePeerOffline(data.from!);
          break;

        case "message-relay":
          this.handleRelayedMessage(data.payload as PeakMessage);
          break;

        case "ack":
          this.handleMessageAck(data.payload as { messageId: string });
          break;

        case "pong":
          this.lastPongReceived = Date.now();
          break;

        case "offer":
        case "answer":
        case "ice-candidate":
          // WebRTC signaling - for future P2P implementation
          this.log("WebRTC signaling received (reserved for future)", {
            type: data.type,
          });
          break;

        default:
          this.log("Unknown signaling type", { type: data.type });
      }
    } catch (error) {
      this.log("Failed to parse signaling message", { error });
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleSocketClose(event: CloseEvent): void {
    this.log("WebSocket closed", { code: event.code, reason: event.reason });
    this.socket = null;
    this.clearHeartbeat();

    // Don't reconnect if this was intentional
    if (event.code === 1000) {
      this.setConnectionState("disconnected");
      return;
    }

    // Attempt reconnection with exponential backoff
    this.attemptReconnect();
  }

  /**
   * Handle WebSocket errors
   */
  private handleSocketError(event: Event): void {
    this.log("WebSocket error", { event });

    const error = this.createError(
      "CONNECTION_FAILED",
      "WebSocket connection error",
      true
    );
    this.config.onError(error);
  }

  // ==========================================================================
  // RECONNECTION LOGIC
  // Like a mountain guide who always finds another path
  // ==========================================================================

  /**
   * Attempt to reconnect with exponential backoff.
   * We never give up on our guests - we just take a measured approach.
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.log("Max reconnection attempts reached, enabling polling fallback");
      this.enablePollingFallback();
      return;
    }

    this.setConnectionState("reconnecting");
    this.reconnectAttempts++;

    // Calculate backoff delay with jitter - like timing your approach to the slopes
    const baseDelay = this.config.reconnectBaseDelay;
    const exponentialDelay = baseDelay * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    const delay = Math.min(
      exponentialDelay + jitter,
      this.config.reconnectMaxDelay
    );

    this.log("Scheduling reconnection attempt", {
      attempt: this.reconnectAttempts,
      delay: Math.round(delay),
    });

    this.reconnectTimeout = setTimeout(() => {
      this.attemptWebSocketConnection();
    }, delay);
  }

  /**
   * Clear any pending reconnection timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // ==========================================================================
  // HEARTBEAT MANAGEMENT
  // Keeping the connection warm, like stoking a fire
  // ==========================================================================

  /**
   * Start the heartbeat to maintain connection health
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.lastPongReceived = Date.now();

    this.heartbeatInterval = setInterval(() => {
      // Check if we've missed too many heartbeats
      const timeSinceLastPong = Date.now() - this.lastPongReceived;
      if (timeSinceLastPong > this.config.heartbeatInterval * 2) {
        this.log("Heartbeat timeout, connection may be dead");
        this.socket?.close(4000, "Heartbeat timeout");
        return;
      }

      // Send ping
      this.sendSignaling({ type: "ping", from: this.userId });
    }, this.config.heartbeatInterval);
  }

  /**
   * Clear the heartbeat interval
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ==========================================================================
  // POLLING FALLBACK
  // The reliable backup when the mountain path is blocked
  // ==========================================================================

  /**
   * Enable polling-based message retrieval as fallback
   */
  private enablePollingFallback(): void {
    this.usePollingFallback = true;
    this.setConnectionState("connected"); // Polling is a valid connection

    this.log("Enabling polling fallback");

    this.pollInterval = setInterval(() => {
      this.pollForMessages();
    }, 3000);
  }

  /**
   * Poll the server for new messages
   */
  private async pollForMessages(): Promise<void> {
    try {
      const response = await fetch("/api/signaling", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) return;

      const data = await response.json();

      if (data.signals && Array.isArray(data.signals)) {
        for (const signal of data.signals) {
          if (signal.type === "message-relay" && signal.payload) {
            this.handleRelayedMessage(signal.payload as PeakMessage);
          }
        }
      }
    } catch (error) {
      this.log("Polling error", { error });
    }
  }

  /**
   * Clear the polling interval
   */
  private clearPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // ==========================================================================
  // PEER MANAGEMENT
  // Knowing who's in the lodge and ready to chat
  // ==========================================================================

  /**
   * Handle peer coming online
   */
  private handlePeerOnline(peerId: string): void {
    const peerInfo: PeerInfo = {
      id: peerId,
      isConnected: true,
      lastSeen: Date.now(),
      connectionQuality: "unknown",
    };

    this.peers.set(peerId, peerInfo);
    this.config.onPeerConnected(peerId, peerInfo);
    this.log("Peer online", { peerId });

    // Flush pending messages for this peer
    this.flushPendingMessages(peerId);
  }

  /**
   * Handle peer going offline
   */
  private handlePeerOffline(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.isConnected = false;
      peer.lastSeen = Date.now();
    }

    this.config.onPeerDisconnected(peerId);
    this.log("Peer offline", { peerId });
  }

  // ==========================================================================
  // MESSAGING
  // The art of communication - clear, reliable, and considerate
  // ==========================================================================

  /**
   * Send a message to another Peak member.
   * Like writing a note and handing it to the concierge - we ensure delivery.
   *
   * @param peerId - The recipient's identifier
   * @param content - The message content
   * @param conversationId - The conversation context
   * @param options - Additional message options
   * @returns The created message object
   */
  public sendMessage(
    peerId: string,
    content: string,
    conversationId: string,
    options: Partial<{
      priority: MessagePriority;
      metadata: MessageMetadata;
      onDelivery: (success: boolean) => void;
    }> = {}
  ): PeakMessage {
    const message: PeakMessage = {
      id: uuidv4(),
      senderId: this.userId,
      content,
      timestamp: Date.now(),
      conversationId,
      delivered: false,
      read: false,
      status: "pending",
      priority: options.priority ?? "normal",
      ...(options.metadata ? { metadata: options.metadata } : {}),
    };

    // Register delivery callback if provided
    if (options.onDelivery) {
      this.messageCallbacks.set(message.id, options.onDelivery);
    }

    // Attempt immediate delivery
    if (this.canSendDirectly()) {
      this.sendViaSignaling(peerId, message);
    } else {
      // Queue for later delivery
      this.queueMessage(peerId, message);
    }

    return message;
  }

  /**
   * Create a message without sending (for preview or composition)
   */
  public createMessage(content: string, conversationId: string): PeakMessage {
    return {
      id: uuidv4(),
      senderId: this.userId,
      content,
      timestamp: Date.now(),
      conversationId,
      delivered: false,
      read: false,
      status: "pending",
      priority: "normal",
    };
  }

  /**
   * Check if we can send messages directly
   */
  private canSendDirectly(): boolean {
    if (this.usePollingFallback) return true;
    return (
      this.socket !== null && this.socket.readyState === WebSocket.OPEN
    );
  }

  /**
   * Send message via WebSocket signaling
   */
  private sendViaSignaling(peerId: string, message: PeakMessage): void {
    if (this.usePollingFallback) {
      this.sendViaPolling(peerId, message);
      return;
    }

    this.sendSignaling({
      type: "message-relay",
      from: this.userId,
      to: peerId,
      payload: message,
      timestamp: Date.now(),
    });

    message.status = "sent";
  }

  /**
   * Send message via polling API
   */
  private async sendViaPolling(
    peerId: string,
    message: PeakMessage
  ): Promise<void> {
    try {
      const response = await fetch("/api/signaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message-relay",
          from: this.userId,
          to: peerId,
          payload: message,
        }),
      });

      if (response.ok) {
        message.status = "sent";
      } else {
        message.status = "failed";
        this.handleMessageFailure(message.id);
      }
    } catch (error) {
      message.status = "failed";
      this.handleMessageFailure(message.id);
    }
  }

  /**
   * Queue a message for later delivery
   */
  private queueMessage(peerId: string, message: PeakMessage): void {
    const queue = this.pendingMessages.get(peerId) || [];

    // Check queue size limit
    if (queue.length >= this.config.maxQueueSize) {
      this.log("Message queue full, removing oldest message", { peerId });
      const oldest = queue.shift();
      if (oldest) {
        this.handleMessageFailure(oldest.id);
      }
    }

    queue.push(message);
    this.pendingMessages.set(peerId, queue);
    this.log("Message queued", { peerId, queueSize: queue.length });
  }

  /**
   * Flush pending messages for a specific peer
   */
  private flushPendingMessages(peerId: string): void {
    const queue = this.pendingMessages.get(peerId);
    if (!queue || queue.length === 0) return;

    this.log("Flushing pending messages", { peerId, count: queue.length });

    for (const message of queue) {
      this.sendViaSignaling(peerId, message);
    }

    this.pendingMessages.delete(peerId);
  }

  /**
   * Flush all pending messages
   */
  private flushAllPendingMessages(): void {
    for (const peerId of this.pendingMessages.keys()) {
      this.flushPendingMessages(peerId);
    }
  }

  /**
   * Handle a relayed message from the server
   */
  private handleRelayedMessage(message: PeakMessage): void {
    this.log("Received message", {
      from: message.senderId,
      conversation: message.conversationId,
    });

    // Send acknowledgment
    this.sendSignaling({
      type: "ack",
      from: this.userId,
      to: message.senderId,
      payload: { messageId: message.id },
    });

    // Notify the application
    this.config.onMessage(message);
  }

  /**
   * Handle message acknowledgment
   */
  private handleMessageAck(payload: { messageId: string }): void {
    const callback = this.messageCallbacks.get(payload.messageId);
    if (callback) {
      callback(true);
      this.messageCallbacks.delete(payload.messageId);
    }
  }

  /**
   * Handle message delivery failure
   */
  private handleMessageFailure(messageId: string): void {
    const callback = this.messageCallbacks.get(messageId);
    if (callback) {
      callback(false);
      this.messageCallbacks.delete(messageId);
    }

    const error = this.createError(
      "MESSAGE_FAILED",
      "Failed to deliver message",
      true,
      { messageId }
    );
    this.config.onError(error);
  }

  // ==========================================================================
  // SIGNALING UTILITIES
  // The infrastructure that keeps communication flowing
  // ==========================================================================

  /**
   * Send a signaling message through the WebSocket
   */
  private sendSignaling(message: SignalingMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.log("Cannot send signaling - socket not ready");
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      this.log("Signaling send error", { error });
      return false;
    }
  }

  // ==========================================================================
  // STATE MANAGEMENT
  // Keeping track of where we stand
  // ==========================================================================

  /**
   * Update connection state and notify listeners
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState === state) return;

    this.log("Connection state change", {
      from: this.connectionState,
      to: state,
    });
    this.connectionState = state;
    this.config.onConnectionStateChange(state);
  }

  // ==========================================================================
  // PUBLIC STATUS QUERIES
  // For checking the state of affairs
  // ==========================================================================

  /**
   * Check if the client is currently connected
   */
  public isConnected(): boolean {
    return this.connectionState === "connected";
  }

  /**
   * Get the current connection state
   */
  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Check if a specific peer is currently online
   */
  public isPeerOnline(peerId: string): boolean {
    const peer = this.peers.get(peerId);
    return peer?.isConnected ?? false;
  }

  /**
   * Get list of currently connected peers
   */
  public getConnectedPeers(): string[] {
    return Array.from(this.peers.entries())
      .filter(([_, info]) => info.isConnected)
      .map(([id]) => id);
  }

  /**
   * Get information about a specific peer
   */
  public getPeerInfo(peerId: string): PeerInfo | undefined {
    return this.peers.get(peerId);
  }

  /**
   * Get count of pending messages for a peer
   */
  public getPendingMessageCount(peerId?: string): number {
    if (peerId) {
      return this.pendingMessages.get(peerId)?.length ?? 0;
    }

    let total = 0;
    for (const queue of this.pendingMessages.values()) {
      total += queue.length;
    }
    return total;
  }

  // ==========================================================================
  // ERROR HANDLING
  // Graceful management of the unexpected
  // ==========================================================================

  /**
   * Create a structured WebLink error
   */
  private createError(
    code: WebLinkErrorCode,
    message: string,
    recoverable: boolean,
    context?: Record<string, unknown>
  ): WebLinkError {
    const error = new Error(message) as WebLinkError;
    error.code = code;
    error.recoverable = recoverable;
    if (context !== undefined) error.context = context;
    return error;
  }

  // ==========================================================================
  // LOGGING
  // Transparent operations, like a well-run lodge
  // ==========================================================================

  /**
   * Log debug information if debugging is enabled
   */
  private log(message: string, data?: Record<string, unknown>): void {
    if (this.config.debug) {
      console.log(`[WebLink] ${message}`, data ?? "");
    }
  }
}

// ============================================================================
// SINGLETON MANAGEMENT
// A single point of contact for the entire application
// ============================================================================

let webLinkInstance: WebLinkClient | null = null;

/**
 * Get or create the WebLink singleton instance.
 * Like having a dedicated concierge for your stay.
 *
 * @param config - Configuration for new instance (required on first call)
 * @returns The WebLink client instance
 */
export function getWebLink(config?: WebLinkConfig): WebLinkClient {
  if (!webLinkInstance && config) {
    webLinkInstance = new WebLinkClient(config);
  }

  if (!webLinkInstance) {
    throw new Error(
      "WebLink not initialized. Please provide configuration on first call."
    );
  }

  return webLinkInstance;
}

/**
 * Destroy the WebLink singleton instance.
 * Like properly checking out of the lodge.
 */
export function destroyWebLink(): void {
  if (webLinkInstance) {
    webLinkInstance.disconnect();
    webLinkInstance = null;
  }
}

/**
 * Check if WebLink has been initialized
 */
export function isWebLinkInitialized(): boolean {
  return webLinkInstance !== null;
}

// ============================================================================
// UTILITY FUNCTIONS
// Helpful tools for working with WebLink
// ============================================================================

/**
 * Generate a unique message ID.
 * Each message gets its own seal of authenticity.
 */
export function generateMessageId(): string {
  return uuidv4();
}

/**
 * Create a timestamp in the format used by Peak messages
 */
export function createTimestamp(): number {
  return Date.now();
}

/**
 * Format a message timestamp for display
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @param options - Formatting options
 */
export function formatMessageTime(
  timestamp: number,
  options: { relative?: boolean; includeDate?: boolean } = {}
): string {
  const date = new Date(timestamp);

  if (options.relative) {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000)
      return `${Math.floor(diff / 60000)} min${Math.floor(diff / 60000) > 1 ? "s" : ""} ago`;
    if (diff < 86400000)
      return `${Math.floor(diff / 3600000)} hour${Math.floor(diff / 3600000) > 1 ? "s" : ""} ago`;
  }

  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (options.includeDate) {
    const dateStr = date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    });
    return `${dateStr} at ${timeStr}`;
  }

  return timeStr;
}

/**
 * Check if a message is considered "recent" (within threshold)
 *
 * @param timestamp - Message timestamp
 * @param thresholdMs - Threshold in milliseconds (default: 5 minutes)
 */
export function isRecentMessage(
  timestamp: number,
  thresholdMs: number = 5 * 60 * 1000
): boolean {
  return Date.now() - timestamp < thresholdMs;
}

// ============================================================================
// TYPE GUARDS
// Safety checks for our data structures
// ============================================================================

/**
 * Check if an object is a valid PeakMessage
 */
export function isPeakMessage(obj: unknown): obj is PeakMessage {
  if (typeof obj !== "object" || obj === null) return false;

  const message = obj as Record<string, unknown>;

  return (
    typeof message.id === "string" &&
    typeof message.senderId === "string" &&
    typeof message.content === "string" &&
    typeof message.timestamp === "number" &&
    typeof message.conversationId === "string"
  );
}

/**
 * Check if a connection state indicates we can send messages
 */
export function canSendMessages(state: ConnectionState): boolean {
  return state === "connected";
}
