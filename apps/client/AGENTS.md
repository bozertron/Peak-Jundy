# Peak - Agent Guidelines

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run lint` - Run ESLint (run after changes)
- No test framework configured - implement tests if needed
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run db:seed` - Seed database
- `npm run db:push` - Push schema changes (for rapid prototyping)

## Code Style
- TypeScript strict mode - interfaces in `lib/types.ts`
- Import order: React/Next.js → third-party → local components → utils/types
- Absolute imports with `@/` prefix only
- Components: PascalCase files, prop interfaces, "use client" directive
- API routes: try/catch blocks, NextResponse.json({ error: "message" }, { status })
- Database: Prisma only, use transactions for multi-step operations
- Authentication: NextAuth with role-based access (USER/OWNER/ADMIN)
- Styling: Tailwind CSS with responsive design, no inline styles
- Error handling: validate inputs with `lib/validation.ts`, return structured errors