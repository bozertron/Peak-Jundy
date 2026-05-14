import '@testing-library/jest-dom';

// Note: Web API polyfills (fetch, Request, Response, etc.) are set up in jest.setup.globals.ts
// which runs BEFORE module imports to ensure Next.js API routes can be tested

// Mock next-auth for testing
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock @/lib/auth to avoid loading nodemailer and other auth dependencies
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock next/server's NextResponse for API route testing
// This avoids issues with Response not being defined in the test environment
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: unknown, init?: ResponseInit) => {
        const response = new Response(JSON.stringify(body), {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
          },
        });
        return response;
      },
      redirect: (url: string | URL, status?: number) => {
        return new Response(null, {
          status: status || 307,
          headers: { Location: typeof url === 'string' ? url : url.toString() },
        });
      },
      next: () => new Response(null),
      rewrite: (url: string | URL) => {
        return new Response(null, {
          headers: {
            'x-middleware-rewrite': typeof url === 'string' ? url : url.toString(),
          },
        });
      },
    },
  };
});

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
