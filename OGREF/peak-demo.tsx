// Peak Rentals - Interactive UI Demo
// This file demonstrates the complete PEAK AESTHETIC system in action
// Save as: components/demo/PeakDemo.tsx

"use client";

import { useState } from "react";

// ============================================
// PEAK AESTHETIC COLOR PALETTE REFERENCE
// ============================================
// These colors are now available as Tailwind classes:
// - bg-peak-forest-{100-900}, text-peak-forest-{100-900}
// - bg-peak-brass-{100-900}, text-peak-brass-{100-900}
// - bg-peak-burgundy-{100-900}, text-peak-burgundy-{100-900}
// - bg-peak-navy-{100-900}, text-peak-navy-{100-900}
// - bg-peak-cream, bg-peak-snow
// - text-peak-charcoal, text-peak-slate

const peakColors = {
  // Primary - Forest Green (Trust, Nature, Stability)
  forest: {
    name: "Forest Green",
    role: "Primary",
    hex: "#2D5A47",
    usage: "Primary buttons, key actions, badges",
    tailwind: "bg-peak-forest-500"
  },
  // Accent - Brass (Warmth, Premium, Heritage)
  brass: {
    name: "Brass",
    role: "Accent",
    hex: "#B8860B",
    usage: "CTA buttons, highlights, founding badges",
    tailwind: "bg-peak-brass-500"
  },
  // Secondary - Burgundy (Sophistication, Warmth)
  burgundy: {
    name: "Burgundy",
    role: "Secondary",
    hex: "#722F37",
    usage: "Secondary buttons, alerts, accents",
    tailwind: "bg-peak-burgundy-500"
  },
  // Tertiary - Navy (Depth, Professionalism)
  navy: {
    name: "Navy",
    role: "Tertiary",
    hex: "#1E3A5F",
    usage: "Headers, navigation, dark accents",
    tailwind: "bg-peak-navy-500"
  },
  // Background - Cream (Warmth, Comfort)
  cream: {
    name: "Cream",
    role: "Background",
    hex: "#FAF7F2",
    usage: "Main background, warm base",
    tailwind: "bg-peak-cream"
  },
  // Card Background - Snow
  snow: {
    name: "Snow",
    role: "Card Background",
    hex: "#FFFFFF",
    usage: "Cards, modals, elevated surfaces",
    tailwind: "bg-peak-snow"
  },
  // Text - Charcoal
  charcoal: {
    name: "Charcoal",
    role: "Text Primary",
    hex: "#2C3E50",
    usage: "Main text, headings",
    tailwind: "text-peak-charcoal"
  },
  // Text Muted - Slate
  slate: {
    name: "Slate",
    role: "Text Secondary",
    hex: "#64748B",
    usage: "Muted text, descriptions",
    tailwind: "text-peak-slate"
  },
};

// ============================================
// DEMO DATA
// ============================================
const demoEquipment = [
  {
    id: "1",
    title: "1998 JLG 10054 Telehandler",
    description: "Well-maintained with recent service. 4500 hours.",
    category: "Heavy Equipment",
    dailyRate: 35000,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format",
    owner: { name: "Dave Mitchell", flavor: "Heavy Equipment", avatar: null }
  },
  {
    id: "2",
    title: "1979 60ft JLG Boom Lift",
    description: "Classic boom lift, perfect for high-reach projects.",
    category: "Aerial Lift",
    dailyRate: 28000,
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format",
    owner: { name: "Sarah Chen", flavor: "Outdoor Adventure", avatar: null }
  },
  {
    id: "3",
    title: "2015 Ski-Doo Summit X",
    description: "Two-seater, excellent condition. Champagne powder ready.",
    category: "Recreation",
    dailyRate: 15000,
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&auto=format",
    owner: { name: "Marcus Wolf", flavor: "Winter Sports", avatar: null }
  }
];

const demoContacts = [
  { id: "1", name: "Dave Mitchell", flavor: "Heavy Equipment", memberSince: "2024-01-15", foundingMember: true, itemCount: 8, degree: 1 },
  { id: "2", name: "Sarah Chen", flavor: "Outdoor Adventure", memberSince: "2024-03-20", foundingMember: false, itemCount: 5, degree: 1 },
  { id: "3", name: "Marcus Wolf", flavor: "Winter Sports", memberSince: "2024-06-01", foundingMember: false, itemCount: 3, degree: 2, introducedBy: "Dave Mitchell" },
];

// ============================================
// PEAK CARD COMPONENT
// Uses: bg-peak-snow, shadow-peak-card, hover:shadow-peak-lift
// Font: font-serif for titles, font-sans for body
// ============================================
function PeakCard({
  image,
  title,
  description,
  category,
  dailyRate,
  owner,
  onClick
}: {
  image?: string;
  title: string;
  description?: string;
  category?: string;
  dailyRate?: number;
  owner?: { name: string; flavor?: string };
  onClick?: () => void;
}) {
  return (
    <div
      className="group cursor-pointer bg-peak-snow rounded-[10px] shadow-peak-card hover:shadow-peak-lift overflow-hidden transition-all duration-300 hover:-translate-y-1 border-l-4 border-peak-brass-500"
      onClick={onClick}
    >
      {image && (
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-peak-charcoal/30 to-transparent" />
        </div>
      )}

      <div className="p-4">
        {/* Peak wood accent bar */}
        <div className="peak-wood-accent w-12 h-[3px] rounded-sm mb-3" />

        <h3 className="font-serif text-lg text-peak-charcoal mb-2 leading-tight">
          {title}
        </h3>

        {description && (
          <p className="font-sans text-sm text-peak-slate mb-3 leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between">
          {category && (
            <span className="font-sans text-xs tracking-wide uppercase text-peak-slate">
              {category}
            </span>
          )}
          {dailyRate !== undefined && (
            <span className="font-semibold text-peak-forest-600">
              ${(dailyRate / 100).toFixed(0)}
              <span className="font-normal text-peak-slate text-sm">/day</span>
            </span>
          )}
        </div>

        {owner && (
          <div className="mt-3 pt-3 border-t border-stone-200 flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-peak-forest-100 flex items-center justify-center font-serif text-xs text-peak-forest-600">
              {owner.name.charAt(0)}
            </div>
            <div>
              <div className="font-sans text-[13px] text-peak-charcoal">{owner.name}</div>
              {owner.flavor && (
                <div className="font-sans text-[11px] text-peak-slate">{owner.flavor}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// CONTACT CARD COMPONENT
// Uses: bg-peak-snow, shadow-peak-card, bg-peak-forest for badges
// ============================================
function ContactCard({
  name,
  flavor,
  memberSince,
  foundingMember,
  itemCount,
  degree,
  introducedBy,
  onClick
}: {
  name: string;
  flavor?: string;
  memberSince?: string;
  foundingMember?: boolean;
  itemCount?: number;
  degree?: number;
  introducedBy?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="bg-peak-snow rounded-[10px] shadow-peak-card p-4 cursor-pointer transition-all duration-300 hover:shadow-peak-lift hover:-translate-y-0.5"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-lg border-2 border-peak-brass-200 bg-peak-forest-50 flex items-center justify-center">
            <span className="font-serif text-2xl text-peak-forest-600">
              {name.charAt(0)}
            </span>
          </div>

          {foundingMember && (
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-peak-brass-500 flex items-center justify-center shadow-md"
              title="Founding Member"
            >
              <span className="text-white text-[10px]">★</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-serif text-base text-peak-charcoal m-0">
            {name}
          </h4>

          {flavor && (
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-xl text-[11px] bg-peak-forest-100 text-peak-forest-600">
              {flavor}
            </span>
          )}

          <div className="mt-2 flex gap-3 font-sans text-xs text-peak-slate">
            {itemCount !== undefined && <span>{itemCount} items</span>}
            {memberSince && <span>Since {new Date(memberSince).getFullYear()}</span>}
          </div>

          {degree && degree > 1 && introducedBy && (
            <p className="mt-2 font-sans text-[11px] text-peak-slate/60">
              via {introducedBy}
            </p>
          )}
        </div>

        {/* Degree indicator */}
        {degree && (
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-medium ${
            degree === 1
              ? 'bg-peak-forest-500 text-white'
              : 'bg-stone-200 text-peak-slate'
          }`}>
            {degree}°
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PEAK BUTTON COMPONENT
// Variants: primary (forest), secondary (burgundy), accent (brass), outline (forest border)
// ============================================
function PeakButton({
  variant = "primary",
  size = "md",
  children,
  onClick
}: {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 font-sans border-none";

  const variantClasses = {
    primary: "bg-peak-forest-500 hover:bg-peak-forest-600 text-white shadow-peak-card hover:shadow-peak-lift",
    secondary: "bg-peak-burgundy-500 hover:bg-peak-burgundy-600 text-white shadow-peak-card hover:shadow-peak-lift",
    accent: "bg-peak-brass-500 hover:bg-peak-brass-600 text-white shadow-peak-card hover:shadow-peak-lift",
    outline: "bg-transparent border border-peak-forest-500 text-peak-forest-600 hover:bg-peak-forest-50",
    ghost: "bg-transparent text-peak-charcoal hover:bg-stone-100",
  };

  const sizeClasses = {
    sm: "text-[13px] px-3 py-1.5",
    md: "text-sm px-4 py-2.5",
    lg: "text-base px-6 py-3",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ============================================
// MAIN DEMO COMPONENT
// ============================================
export default function PeakDemo() {
  const [activeTab, setActiveTab] = useState<"equipment" | "network" | "components">("equipment");

  return (
    <div className="min-h-screen bg-peak-cream font-sans text-peak-charcoal">
      {/* Header */}
      <header className="bg-peak-snow/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-peak-forest-500 flex items-center justify-center text-xl text-white">
              P
            </div>
            <span className="font-serif text-[22px] text-peak-charcoal">
              Peak
            </span>
          </div>

          {/* Nav */}
          <div className="flex gap-2">
            {[
              { key: "equipment", label: "Equipment" },
              { key: "network", label: "Network" },
              { key: "components", label: "Components" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "equipment" | "network" | "components")}
                className={`px-4 py-2 rounded-lg border-none cursor-pointer text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-peak-forest-100 text-peak-forest-600'
                    : 'bg-transparent text-peak-charcoal hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-peak-brass-100 rounded-lg">
              <span className="text-sm">P</span>
              <span className="text-sm font-semibold text-peak-brass-600">
                245 Peaks
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-peak-forest-100 flex items-center justify-center font-serif text-peak-forest-600 cursor-pointer hover:bg-peak-forest-200 transition-colors">
              B
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Equipment Tab */}
        {activeTab === "equipment" && (
          <div>
            <div className="mb-8">
              <h1 className="font-serif text-[32px] font-bold m-0 mb-2 text-peak-charcoal">
                Discover Equipment
              </h1>
              <p className="text-peak-slate text-base m-0 font-sans">
                Browse items from your trusted network
              </p>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
              {demoEquipment.map(item => (
                <PeakCard
                  key={item.id}
                  image={item.image}
                  title={item.title}
                  description={item.description}
                  category={item.category}
                  dailyRate={item.dailyRate}
                  owner={item.owner}
                />
              ))}
            </div>
          </div>
        )}

        {/* Network Tab */}
        {activeTab === "network" && (
          <div>
            <div className="mb-8">
              <h1 className="font-serif text-[32px] font-bold m-0 mb-2 text-peak-charcoal">
                Your Network
              </h1>
              <p className="text-peak-slate text-base m-0 font-sans">
                People you can trade with through trusted connections
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mb-8">
              {[
                { label: "Direct", value: 2, colorClass: "text-peak-forest-500" },
                { label: "Extended", value: 1, colorClass: "text-peak-slate" },
                { label: "Total", value: 3, colorClass: "text-peak-charcoal" }
              ].map(stat => (
                <div key={stat.label} className="bg-peak-snow rounded-[10px] px-6 py-4 shadow-peak-card">
                  <div className={`text-[32px] font-bold ${stat.colorClass}`}>
                    {stat.value}
                  </div>
                  <div className="font-sans text-[13px] text-peak-slate uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {demoContacts.map(contact => (
                <ContactCard key={contact.id} {...contact} />
              ))}
            </div>
          </div>
        )}

        {/* Components Tab */}
        {activeTab === "components" && (
          <div>
            <div className="mb-8">
              <h1 className="font-serif text-[32px] font-bold m-0 mb-2 text-peak-charcoal">
                PEAK AESTHETIC Component Library
              </h1>
              <p className="text-peak-slate text-base m-0 font-sans">
                The building blocks of Peak Rentals - refined mountain lodge aesthetic
              </p>
            </div>

            {/* Color Palette */}
            <section className="mb-12">
              <h2 className="font-serif text-xl mb-4 text-peak-charcoal">
                PEAK Color Palette
              </h2>
              <p className="font-sans text-sm text-peak-slate mb-4">
                All colors available as Tailwind classes: <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">bg-peak-[color]-[shade]</code>
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {Object.entries(peakColors).map(([key, color]) => (
                  <div key={key} className="bg-peak-snow rounded-lg p-4 shadow-peak-card">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-16 h-16 rounded-lg border border-stone-200 shadow-inner flex-shrink-0"
                        style={{ background: color.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-serif font-medium text-peak-charcoal">{color.name}</div>
                        <div className="font-sans text-xs text-peak-brass-600 font-medium uppercase tracking-wide">{color.role}</div>
                        <div className="font-mono text-xs text-peak-slate mt-1">{color.hex}</div>
                        <code className="inline-block mt-1 text-[10px] bg-peak-forest-50 text-peak-forest-600 px-1.5 py-0.5 rounded">
                          {color.tailwind}
                        </code>
                      </div>
                    </div>
                    <p className="font-sans text-xs text-peak-slate mt-2 mb-0">
                      {color.usage}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Buttons */}
            <section className="mb-12">
              <h2 className="font-serif text-xl mb-4 text-peak-charcoal">
                Buttons
              </h2>
              <p className="font-sans text-sm text-peak-slate mb-4">
                Use CSS classes <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">.btn-primary</code>, <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">.btn-secondary</code>, or Tailwind equivalents
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <PeakButton variant="primary">Primary (Forest)</PeakButton>
                <PeakButton variant="secondary">Secondary (Burgundy)</PeakButton>
                <PeakButton variant="accent">Accent (Brass)</PeakButton>
                <PeakButton variant="outline">Outline</PeakButton>
                <PeakButton variant="ghost">Ghost</PeakButton>
              </div>
              <div className="flex flex-wrap gap-4 items-center mt-4">
                <PeakButton size="sm">Small</PeakButton>
                <PeakButton size="md">Medium</PeakButton>
                <PeakButton size="lg">Large</PeakButton>
              </div>
            </section>

            {/* Typography */}
            <section className="mb-12">
              <h2 className="font-serif text-xl mb-4 text-peak-charcoal">
                Typography
              </h2>
              <p className="font-sans text-sm text-peak-slate mb-4">
                Use <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">font-serif</code> for headings (Libre Baskerville), <code className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">font-sans</code> for body (Inter)
              </p>
              <div className="bg-peak-snow rounded-[10px] p-6 shadow-peak-card">
                <div className="font-serif text-[40px] font-bold leading-tight mb-4 text-peak-charcoal">
                  Heading 1 — Libre Baskerville
                </div>
                <div className="font-serif text-[30px] font-bold leading-snug mb-4 text-peak-charcoal">
                  Heading 2 — Sophisticated
                </div>
                <div className="font-serif text-2xl leading-normal mb-4 text-peak-charcoal">
                  Heading 3 — Elegant
                </div>
                <p className="font-sans text-base leading-relaxed text-peak-charcoal mb-3">
                  Body text uses Inter — clean, readable, and modern. This is the primary font for all content, descriptions, and interface elements. It pairs beautifully with Libre Baskerville for headings.
                </p>
                <p className="font-sans text-sm leading-relaxed text-peak-slate">
                  Smaller body text for secondary information, meta details, and supporting content.
                </p>
                <div className="mt-4 font-mono text-[13px] text-peak-slate bg-stone-100 p-3 rounded-md">
                  Monospace for specs: capacity_lbs: 10000, lift_height_ft: 53.17
                </div>
              </div>
            </section>

            {/* Shadows */}
            <section className="mb-12">
              <h2 className="font-serif text-xl mb-4 text-peak-charcoal">
                Shadow Classes
              </h2>
              <p className="font-sans text-sm text-peak-slate mb-4">
                Custom shadow utilities for depth and elevation
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-peak-snow rounded-lg p-6 shadow-peak-card">
                  <div className="font-serif text-lg mb-2">shadow-peak-card</div>
                  <code className="font-mono text-xs text-peak-slate">Subtle card elevation</code>
                </div>
                <div className="bg-peak-snow rounded-lg p-6 shadow-peak-frame">
                  <div className="font-serif text-lg mb-2">shadow-peak-frame</div>
                  <code className="font-mono text-xs text-peak-slate">Framed object look</code>
                </div>
                <div className="bg-peak-snow rounded-lg p-6 shadow-peak-lift">
                  <div className="font-serif text-lg mb-2">shadow-peak-lift</div>
                  <code className="font-mono text-xs text-peak-slate">Hover/lifted state</code>
                </div>
              </div>
            </section>

            {/* Utility Classes */}
            <section className="mb-12">
              <h2 className="font-serif text-xl mb-4 text-peak-charcoal">
                PEAK Utility Classes
              </h2>
              <p className="font-sans text-sm text-peak-slate mb-4">
                Specialized utilities for the mountain lodge aesthetic
              </p>
              <div className="grid grid-cols-2 gap-6">
                {/* Peak Frame */}
                <div className="bg-peak-snow rounded-lg p-6 shadow-peak-card">
                  <h3 className="font-serif text-lg mb-3 text-peak-charcoal">.peak-frame</h3>
                  <div className="peak-frame p-4 bg-peak-cream">
                    <p className="font-sans text-sm text-peak-charcoal m-0">
                      Framed content with decorative border treatment, like art in a ski lodge.
                    </p>
                  </div>
                  <code className="inline-block mt-3 font-mono text-xs text-peak-slate bg-stone-100 px-2 py-1 rounded">
                    class="peak-frame"
                  </code>
                </div>

                {/* Peak Wood Accent */}
                <div className="bg-peak-snow rounded-lg p-6 shadow-peak-card">
                  <h3 className="font-serif text-lg mb-3 text-peak-charcoal">.peak-wood-accent</h3>
                  <div className="peak-wood-accent h-1 w-24 rounded mb-3" />
                  <p className="font-sans text-sm text-peak-slate mb-3">
                    The signature wood grain gradient bar - adds warmth and grounds the design.
                  </p>
                  <code className="inline-block font-mono text-xs text-peak-slate bg-stone-100 px-2 py-1 rounded">
                    class="peak-wood-accent"
                  </code>
                </div>

                {/* Hover Lift */}
                <div className="bg-peak-snow rounded-lg p-6 shadow-peak-card">
                  <h3 className="font-serif text-lg mb-3 text-peak-charcoal">.hover-lift</h3>
                  <div className="hover-lift bg-peak-forest-100 text-peak-forest-600 p-4 rounded-lg cursor-pointer transition-all">
                    <p className="font-sans text-sm m-0">Hover over me to see the lift effect</p>
                  </div>
                  <code className="inline-block mt-3 font-mono text-xs text-peak-slate bg-stone-100 px-2 py-1 rounded">
                    class="hover-lift"
                  </code>
                </div>

                {/* Card Equipment */}
                <div className="bg-peak-snow rounded-lg p-6 shadow-peak-card">
                  <h3 className="font-serif text-lg mb-3 text-peak-charcoal">.card-equipment</h3>
                  <div className="card-equipment bg-peak-snow p-4">
                    <div className="font-serif text-base text-peak-charcoal">Equipment Card</div>
                    <p className="font-sans text-sm text-peak-slate mt-1 mb-0">
                      With brass left border accent
                    </p>
                  </div>
                  <code className="inline-block mt-3 font-mono text-xs text-peak-slate bg-stone-100 px-2 py-1 rounded">
                    class="card-equipment"
                  </code>
                </div>
              </div>
            </section>

            {/* Wood Accent - Legacy */}
            <section>
              <h2 className="font-serif text-xl mb-4 text-peak-charcoal">
                Decorative Elements
              </h2>
              <div className="bg-peak-snow rounded-[10px] p-6 shadow-peak-card">
                <div className="peak-wood-accent h-1 rounded mb-4" />
                <p className="font-sans text-sm text-peak-slate m-0">
                  The wood accent bar is a signature element — a subtle gradient from light wood through brass to dark wood that adds warmth and grounds the design in the ski chalet aesthetic.
                </p>
                <div className="mt-4 p-4 bg-peak-cream rounded-lg border-l-4 border-peak-brass-500">
                  <p className="font-sans text-sm text-peak-charcoal m-0">
                    <strong>Tip:</strong> Use the brass left border (<code className="text-xs bg-white px-1 py-0.5 rounded">border-l-4 border-peak-brass-500</code>) on cards to add the signature PEAK accent.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
