import '@testing-library/jest-dom';

// Polyfill Web APIs for API route testing
// These are needed because Next.js API routes use Web APIs (Request, Response, Headers, etc.)
// Node 18+ has native fetch, but jsdom environment may not expose them
import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder/TextDecoder if not present
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

// Expose native Node.js fetch APIs globally for API route testing
// These are available in Node 18+ but may not be exposed in all test environments
const { fetch, Request, Response, Headers } = globalThis;
if (typeof global.fetch === 'undefined' && fetch) {
  global.fetch = fetch;
}
if (typeof global.Request === 'undefined' && Request) {
  global.Request = Request;
}
if (typeof global.Response === 'undefined' && Response) {
  global.Response = Response;
}
if (typeof global.Headers === 'undefined' && Headers) {
  global.Headers = Headers;
}

// Mock next-auth for testing
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock next/navigation for testing
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}));

// Mock prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    equipment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    vouch: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contactCard: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    treasureChest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    peaksTransaction: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    searchLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless debugging
  log: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
