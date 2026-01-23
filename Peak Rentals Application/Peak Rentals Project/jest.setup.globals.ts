/**
 * Global setup for Jest that runs BEFORE module imports
 * This sets up Web APIs needed for Next.js API route testing
 */

// Web APIs are available in Node 18+ via globalThis but need to be on 'global' for Jest
const webAPIs = ['fetch', 'Request', 'Response', 'Headers', 'FormData', 'URL', 'URLSearchParams'];

webAPIs.forEach((api) => {
  if ((globalThis as any)[api] && typeof (global as any)[api] === 'undefined') {
    (global as any)[api] = (globalThis as any)[api];
  }
});

// TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}
