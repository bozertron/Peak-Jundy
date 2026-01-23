# Peak-Rentals-Frontend-Architecture.md - TODO

## Status Tracking
Status is tracked in `MASTER-TODO-INDEX.md`. Do not check boxes in this file.

## Overview
Implement and verify all frontend components, layouts, and architectural patterns documented.

## Recent Updates
- CheckoutButton now uses inline error messaging and guards invalid rental days; no alert popups.
- Client hooks added for auth + search (`useAuth`, `useSearch`) alongside `useEquipment`.
- Browse page now uses the `useSearch` hook for client-side results; Storefront uses `next/image` for equipment images.
- EquipmentSearch component added at `components/Search/EquipmentSearch.tsx`.

## Tasks

### High Priority
- [ ] **Component Implementation**: Build all 5 documented core components
  - [ ] EquipmentCard - Display equipment listings with images and pricing
  - [ ] SearchBar - Search form with category filtering (needs client-side validation/loading polish)
  - [ ] EquipmentDetail - Full equipment detail page with specs
  - [ ] CheckoutButton - Stripe integration for payments (needs structured error UI and input validation)
  - [ ] AdminDashboard - Analytics dashboard with unfulfilled searches
- [ ] **Component Spec Completion**: Close gaps in documented component behavior
  - [ ] EquipmentDetail: image gallery, owner contact info, owner edit/delete actions
  - [ ] AdminDashboard: filtering + basic visualization for analytics
  - [ ] SearchBar: validation + loading state + empty-query guardrails
- [ ] **Layout Structure**: Implement documented layout hierarchy
  - [ ] Root layout with navbar and footer
  - [ ] Dashboard layout with sidebar (protected)
  - [ ] Auth layout for signin/signup (uses page-level forms, no dedicated layout)
- [ ] **Page Implementations**: Build all documented pages
  - [ ] Home page with hero section and featured equipment
  - [ ] Browse page with search results
  - [ ] Equipment detail page with dynamic routing

### Medium Priority
- [ ] **Custom Hooks**: Implement documented hooks
  - [ ] useEquipment hook for equipment data fetching
  - [ ] useAuth hook for session management
  - [ ] useSearch hook for search functionality
- [ ] **Tailwind Styling**: Implement documented design system
  - [ ] Global styles with custom utilities and theme tokens
  - [ ] Consistent color scheme and typography audit
  - [ ] Responsive design patterns coverage check
- [ ] **Component Organization**: Structure components per documented layout
  - [ ] Equipment/ folder with all equipment components
  - [ ] Search/ folder with search components
  - [ ] Stripe/ folder with payment components
  - [ ] Admin/ folder with admin components

### Low Priority
- [ ] **Performance Optimization**: Implement documented performance patterns
  - [ ] Dynamic imports for heavy components
  - [ ] Image optimization with Next.js Image
  - [ ] Component memoization where appropriate
- [ ] **Accessibility**: Ensure all components follow a11y best practices
  - [ ] Proper ARIA labels
  - [ ] Keyboard navigation support
  - [ ] Screen reader compatibility
- [ ] **Error Boundaries**: Add error handling for component failures

## Detailed Component Implementation

### 1. EquipmentCard Component
```typescript
// Location: components/Equipment/EquipmentCard.tsx
// Must include:
- Image gallery with fallback
- Title, category, price display
- Owner information
- Availability status
- Responsive design
- Link to detail page

### Component Spec Completion Plans (Detailed)

#### A. EquipmentDetail Spec Completion
- [ ] **Note**: Implemented in Sprint 2. Verify in testing plan before marking complete.
- [ ] **Data requirements alignment**
  - Add `image`, `location`, `hourMeter`, `ownerId`, and optional `owner.email` to data queries where the detail page is built.
  - File targets: `app/equipment/[id]/page.tsx`, `components/Equipment/EquipmentDetail.tsx`.
  - Owner contact policy: show email only to authenticated users; show sign-in CTA otherwise.
- [ ] **Image gallery implementation**
  - Use `equipment.image` as the primary image.
  - Support optional additional images via `specs.images` (array of URLs) without schema changes.
  - Build a simple gallery: main image + thumbnail strip, keyboard focus states, and fallback placeholder.
  - File target: `components/Equipment/EquipmentDetail.tsx`.
- [ ] **Owner contact block**
  - Display owner name and location, plus contact action based on policy.
  - If email is exposed: render `mailto:` link only for authenticated users.
  - If email is not exposed: render "Contact owner" CTA linking to a placeholder route or future messaging.
  - File targets: `components/Equipment/EquipmentDetail.tsx`, `app/equipment/[id]/page.tsx`.
- [ ] **Owner edit/delete actions**
  - Add an "Owner Actions" section visible only when `session.user.id === equipment.ownerId`.
  - Add "Edit listing" link to `/owner/edit-listing/[id]`.
  - Add "Delete listing" button that calls `DELETE /api/equipment/[id]` with confirm dialog and redirect to `/dashboard/listings`.
  - Handle error state and disable while deleting.
  - File targets: `components/Equipment/EquipmentDetail.tsx`, `app/equipment/[id]/page.tsx`.
- [ ] **Acceptance criteria**
  - Image gallery renders with 1+ images and graceful fallback.
  - Owner contact block matches policy and is hidden where appropriate.
  - Owner action buttons appear only for the owner and work end-to-end.

#### B. AdminDashboard Analytics Enhancements
- [ ] **Note**: Implemented in Sprint 2. Verify in testing plan before marking complete.
- [ ] **Filter controls**
  - Add filters: date range (last 7/30/90 days), min count threshold, and search query text filter.
  - Wire filters to API query params (e.g., `?days=30&minCount=5&query=telehandler`).
  - File targets: `components/Admin/AdminDashboard.tsx`, `app/api/analytics/unfulfilled-searches/route.ts` (if needed).
- [ ] **Visualization**
  - Add a lightweight bar chart using pure CSS (no new dependency) from the top 10 results.
  - Include a legend for count thresholds (high/medium/low).
  - File target: `components/Admin/AdminDashboard.tsx`.
- [ ] **Sorting & pagination**
  - Allow sort by count desc/asc and alphabetical query.
  - Add simple pagination or "Show more" if > 20 results.
- [ ] **Acceptance criteria**
  - Filters update results without errors and reflect in URL state.
  - Visualization displays correctly on desktop and mobile.

#### C. SearchBar Validation & Loading State
- [ ] **Note**: Implemented in Sprint 1 (query required; loading state added). Verify via testing plan.
- [ ] **Validation**
  - Enforce non-empty query (category-only searches are not allowed).
  - Enforce max length (100 chars) and strip leading/trailing whitespace.
  - Surface validation errors inline and prevent navigation on invalid input.
- [ ] **Loading & UX**
  - Add `useTransition` or local `isSearching` state to disable button on submit.
  - Show "Searching..." label and spinner for the button while route changes.
  - Add keyboard submit + escape to clear (optional).
- [ ] **Acceptance criteria**
  - Empty/oversized query is blocked with clear error messaging.
  - Button shows a deterministic loading state during navigation.
```

### 2. SearchBar Component  
```typescript
// Location: components/Search/SearchBar.tsx
// Must include:
- Text input for search queries
- Category dropdown filter
- Search button with loading state
- Form validation
- Navigation to results page
```

### 3. EquipmentDetail Component
```typescript
// Location: components/Equipment/EquipmentDetail.tsx
// Must include:
- Image gallery
- Full equipment specifications (parsed JSON)
- Owner contact information
- Rental duration selector
- Pricing calculation
- Checkout integration
- Edit/delete for owners
```

### 4. CheckoutButton Component
```typescript
// Location: components/Stripe/CheckoutButton.tsx
// Must include:
- Stripe Checkout integration
- Session creation
- Loading states
- Error handling
- Redirect handling
```

### 5. AdminDashboard Component
```typescript
// Location: components/Admin/AdminDashboard.tsx
// Must include:
- Unfulfilled searches table
- Market analytics
- Search query visualization
- Opportunity level indicators
- Data filtering and sorting
```

## Layout Implementation

### Root Layout Structure
```typescript
// app/layout.tsx must include:
- HTML lang attribute
- Metadata configuration
- Navbar component
- Main content area
- Footer component
- Global styles
- Session provider
```

### Dashboard Layout Structure  
```typescript
// app/(dashboard)/layout.tsx must include:
- Authentication check
- Sidebar navigation
- User role-based menu
- Protected content area
- Responsive sidebar
```

## Page Structure Verification

### Public Pages
- [ ] `/` - Home page with hero and featured equipment
- [ ] `/browse` - Search results page
- [ ] `/equipment/[id]` - Equipment detail page
- [ ] `/auth/signin` - Sign in page

### Protected Pages
- [ ] `/dashboard` - User dashboard
- [ ] `/dashboard/listings` - My equipment listings
- [ ] `/dashboard/rentals` - My rental history
- [ ] `/dashboard/profile` - User profile settings

### Owner Pages
- [ ] `/owner/onboarding` - Stripe Connect setup
- [ ] `/owner/create-listing` - Create equipment listing
- [ ] `/owner/listings/[id]/edit` - Edit equipment listing

### Admin Pages
- [ ] `/admin/dashboard` - Admin main dashboard
- [ ] `/admin/unfulfilled-searches` - Market intelligence

## Styling Implementation

### Tailwind Configuration
```typescript
// tailwind.config.ts must include:
- Custom color palette
- Responsive breakpoints
- Custom component classes
- Typography scale
- Spacing system
```

### Global Styles
```css
/* styles/globals.css must include:
- Custom component utilities
- Consistent button styles
- Card components
- Form field styles
- Loading states
- Animation utilities
*/
```

## Development Notes Implementation

### Session Management
- [ ] Server-side session checks with `getServerSession()`
- [ ] Client-side session with `useSession()` hook
- [ ] Protected route redirects to `/auth/signin`

### Error Handling
- [ ] Try-catch blocks for all API calls
- [ ] User-friendly error messages
- [ ] Error state components
- [ ] Console logging for debugging

### Performance
- [ ] Dynamic imports for large components
- [ ] Image optimization with Next.js Image component
- [ ] Pagination for long lists
- [ ] Component memoization where appropriate

### Security
- [ ] Ownership verification for edit/delete
- [ ] Admin role checks on protected pages
- [ ] Input sanitization
- [ ] No sensitive key exposure

## Dependencies
- API routes must be implemented first
- Authentication system (NextAuth) configured
- Stripe integration for payment components
- Database schema for data fetching

## Success Criteria
- All documented components exist and function
- Layouts match documented structure
- Pages render correctly on all devices
- Search and filter functionality works
- Checkout process completes successfully
- Admin dashboard shows accurate data
- Code follows documented patterns
- Responsive design works on mobile/tablet/desktop

## Testing Checklist
- [ ] All components render without errors
- [ ] Forms validate correctly
- [ ] Navigation works properly
- [ ] Search returns expected results
- [ ] Checkout flow completes
- [ ] Admin dashboard displays data
- [ ] Mobile responsive design
- [ ] Accessibility standards met
