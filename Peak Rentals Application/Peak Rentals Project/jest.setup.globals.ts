/**
 * Global setup for Jest that runs BEFORE module imports
 * This sets up Web APIs needed for Next.js API route testing
 */

// TextEncoder/TextDecoder from Node.js util
import { TextEncoder, TextDecoder } from 'util';

// Set up TextEncoder/TextDecoder first
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

// Web APIs are available in Node 18+ via globalThis
// We MUST set these on 'global' IMMEDIATELY for Next.js modules
(global as any).fetch = globalThis.fetch;
(global as any).Request = globalThis.Request;
(global as any).Response = globalThis.Response;
(global as any).Headers = globalThis.Headers;
(global as any).FormData = globalThis.FormData;
(global as any).URL = globalThis.URL;
(global as any).URLSearchParams = globalThis.URLSearchParams;
(global as any).Blob = globalThis.Blob;
(global as any).File = globalThis.File;
(global as any).ReadableStream = globalThis.ReadableStream;
(global as any).WritableStream = globalThis.WritableStream;
(global as any).TransformStream = globalThis.TransformStream;
