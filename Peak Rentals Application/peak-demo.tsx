// Peak Rentals - Interactive UI Demo
// This file demonstrates the complete aesthetic system in action
// Save as: components/demo/PeakDemo.tsx

"use client";

import { useState } from "react";

// ============================================
// COLOR PALETTE REFERENCE
// ============================================
const colors = {
  cream: "#FAF7F2",
  charcoal: "#2C3E50",
  woodLight: "#D4A574",
  wood: "#8B6914",
  woodDark: "#5D4037",
  forest: "#2D5A47",
  burgundy: "#722F37",
  navy: "#1E3A5F",
  brass: "#B8860B",
  copper: "#B87333",
  snow: "#FFFFFF",
  slate: "#64748B",
  stone: "#E7E5E4",
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
      className="group cursor-pointer"
      onClick={onClick}
      style={{
        background: colors.snow,
        borderRadius: "10px",
        boxShadow: `0 0 0 1px ${colors.wood}15, 0 2px 8px -2px ${colors.charcoal}15`,
        overflow: "hidden",
        transition: "all 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 16px -4px ${colors.charcoal}20`;
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.wood}15, 0 2px 8px -2px ${colors.charcoal}15`;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {image && (
        <div style={{ aspectRatio: "4/3", position: "relative", overflow: "hidden" }}>
          <img 
            src={image} 
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.5s ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          />
          <div style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, ${colors.charcoal}30, transparent)`
          }} />
        </div>
      )}
      
      <div style={{ padding: "16px" }}>
        {/* Wood accent bar */}
        <div style={{
          width: "48px",
          height: "3px",
          borderRadius: "2px",
          background: `linear-gradient(90deg, ${colors.woodLight}, ${colors.wood}, ${colors.woodDark})`,
          marginBottom: "12px"
        }} />
        
        <h3 style={{
          fontFamily: "'Libre Baskerville', Georgia, serif",
          fontSize: "18px",
          color: colors.charcoal,
          margin: "0 0 8px 0",
          lineHeight: 1.3
        }}>
          {title}
        </h3>
        
        {description && (
          <p style={{
            fontSize: "14px",
            color: colors.slate,
            margin: "0 0 12px 0",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {description}
          </p>
        )}
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {category && (
            <span style={{
              fontSize: "11px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: colors.slate
            }}>
              {category}
            </span>
          )}
          {dailyRate !== undefined && (
            <span style={{ fontWeight: 600, color: colors.forest }}>
              ${(dailyRate / 100).toFixed(0)}
              <span style={{ fontWeight: 400, color: colors.slate, fontSize: "14px" }}>/day</span>
            </span>
          )}
        </div>
        
        {owner && (
          <div style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: `1px solid ${colors.stone}`,
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "6px",
              background: `${colors.forest}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontFamily: "'Libre Baskerville', serif",
              color: colors.forest
            }}>
              {owner.name.charAt(0)}
            </div>
            <div>
              <div style={{ fontSize: "13px", color: colors.charcoal }}>{owner.name}</div>
              {owner.flavor && (
                <div style={{ fontSize: "11px", color: colors.slate }}>{owner.flavor}</div>
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
      style={{
        background: colors.snow,
        borderRadius: "10px",
        boxShadow: `0 0 0 1px ${colors.wood}15, 0 2px 8px -2px ${colors.charcoal}15`,
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.25s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 16px -4px ${colors.charcoal}20`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 1px ${colors.wood}15, 0 2px 8px -2px ${colors.charcoal}15`;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        {/* Avatar */}
        <div style={{ position: "relative" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "8px",
            border: `2px solid ${colors.woodLight}50`,
            background: `${colors.forest}10`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{
              fontSize: "24px",
              fontFamily: "'Libre Baskerville', serif",
              color: colors.forest
            }}>
              {name.charAt(0)}
            </span>
          </div>
          
          {foundingMember && (
            <div style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: colors.brass,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
            }} title="Founding Member">
              <span style={{ color: "white", fontSize: "10px" }}>★</span>
            </div>
          )}
        </div>
        
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4 style={{
            fontFamily: "'Libre Baskerville', serif",
            fontSize: "16px",
            color: colors.charcoal,
            margin: 0
          }}>
            {name}
          </h4>
          
          {flavor && (
            <span style={{
              display: "inline-block",
              marginTop: "6px",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              background: `${colors.forest}15`,
              color: colors.forest
            }}>
              {flavor}
            </span>
          )}
          
          <div style={{
            marginTop: "8px",
            display: "flex",
            gap: "12px",
            fontSize: "12px",
            color: colors.slate
          }}>
            {itemCount !== undefined && <span>{itemCount} items</span>}
            {memberSince && <span>Since {new Date(memberSince).getFullYear()}</span>}
          </div>
          
          {degree && degree > 1 && introducedBy && (
            <p style={{
              marginTop: "8px",
              fontSize: "11px",
              color: `${colors.slate}99`
            }}>
              via {introducedBy}
            </p>
          )}
        </div>
        
        {/* Degree indicator */}
        {degree && (
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: degree === 1 ? colors.forest : colors.stone,
            color: degree === 1 ? "white" : colors.slate,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 500
          }}>
            {degree}°
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// BUTTON COMPONENT
// ============================================
function PeakButton({ 
  variant = "primary", 
  size = "md",
  children,
  onClick
}: {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    borderRadius: "10px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "none",
    fontFamily: "'Inter', system-ui, sans-serif",
  };
  
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: colors.forest, color: "white" },
    secondary: { background: colors.burgundy, color: "white" },
    outline: { background: "transparent", color: colors.charcoal, border: `1px solid ${colors.wood}50` },
    ghost: { background: "transparent", color: colors.charcoal },
  };
  
  const sizes: Record<string, React.CSSProperties> = {
    sm: { fontSize: "13px", padding: "6px 12px" },
    md: { fontSize: "14px", padding: "10px 16px" },
    lg: { fontSize: "16px", padding: "12px 24px" },
  };
  
  return (
    <button 
      style={{ ...baseStyle, ...variants[variant], ...sizes[size] }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (variant === "primary") e.currentTarget.style.background = `${colors.forest}ee`;
        if (variant === "secondary") e.currentTarget.style.background = `${colors.burgundy}ee`;
        if (variant === "outline") e.currentTarget.style.background = `${colors.wood}10`;
        if (variant === "ghost") e.currentTarget.style.background = `${colors.stone}80`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = variants[variant].background as string;
      }}
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
    <div style={{
      minHeight: "100vh",
      background: colors.cream,
      fontFamily: "'Inter', system-ui, sans-serif",
      color: colors.charcoal
    }}>
      {/* Header */}
      <header style={{
        background: `${colors.snow}cc`,
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${colors.stone}`,
        position: "sticky",
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: colors.forest,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px"
            }}>
              ⛰️
            </div>
            <span style={{
              fontFamily: "'Libre Baskerville', serif",
              fontSize: "22px",
              color: colors.charcoal
            }}>
              Peak
            </span>
          </div>
          
          {/* Nav */}
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { key: "equipment", label: "Equipment" },
              { key: "network", label: "Network" },
              { key: "components", label: "Components" }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  background: activeTab === tab.key ? `${colors.forest}15` : "transparent",
                  color: activeTab === tab.key ? colors.forest : colors.charcoal,
                  transition: "all 0.2s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: `${colors.brass}15`,
              borderRadius: "8px"
            }}>
              <span style={{ fontSize: "14px" }}>⛰️</span>
              <span style={{ fontSize: "14px", fontWeight: 600, color: colors.brass }}>
                245 Peaks
              </span>
            </div>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: `${colors.forest}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Libre Baskerville', serif",
              color: colors.forest,
              cursor: "pointer"
            }}>
              B
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Equipment Tab */}
        {activeTab === "equipment" && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: "32px",
                fontWeight: 700,
                margin: "0 0 8px 0"
              }}>
                Discover Equipment
              </h1>
              <p style={{ color: colors.slate, fontSize: "16px", margin: 0 }}>
                Browse items from your trusted network
              </p>
            </div>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "24px"
            }}>
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
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: "32px",
                fontWeight: 700,
                margin: "0 0 8px 0"
              }}>
                Your Network
              </h1>
              <p style={{ color: colors.slate, fontSize: "16px", margin: 0 }}>
                People you can trade with through trusted connections
              </p>
            </div>
            
            {/* Stats */}
            <div style={{
              display: "flex",
              gap: "24px",
              marginBottom: "32px"
            }}>
              {[
                { label: "Direct", value: 2, color: colors.forest },
                { label: "Extended", value: 1, color: colors.slate },
                { label: "Total", value: 3, color: colors.charcoal }
              ].map(stat => (
                <div key={stat.label} style={{
                  background: colors.snow,
                  borderRadius: "10px",
                  padding: "16px 24px",
                  boxShadow: `0 0 0 1px ${colors.wood}15`
                }}>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: "13px", color: colors.slate, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {demoContacts.map(contact => (
                <ContactCard key={contact.id} {...contact} />
              ))}
            </div>
          </div>
        )}
        
        {/* Components Tab */}
        {activeTab === "components" && (
          <div>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: "32px",
                fontWeight: 700,
                margin: "0 0 8px 0"
              }}>
                Component Library
              </h1>
              <p style={{ color: colors.slate, fontSize: "16px", margin: 0 }}>
                The building blocks of Peak Rentals
              </p>
            </div>
            
            {/* Color Palette */}
            <section style={{ marginBottom: "48px" }}>
              <h2 style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: "20px",
                marginBottom: "16px"
              }}>
                Color Palette
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {Object.entries(colors).map(([name, value]) => (
                  <div key={name} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: colors.snow,
                    padding: "8px 12px",
                    borderRadius: "8px",
                    boxShadow: `0 0 0 1px ${colors.stone}`
                  }}>
                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "4px",
                      background: value,
                      border: `1px solid ${colors.stone}`
                    }} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 500 }}>{name}</div>
                      <div style={{ fontSize: "11px", color: colors.slate, fontFamily: "monospace" }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Buttons */}
            <section style={{ marginBottom: "48px" }}>
              <h2 style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: "20px",
                marginBottom: "16px"
              }}>
                Buttons
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                <PeakButton variant="primary">Primary Action</PeakButton>
                <PeakButton variant="secondary">Secondary</PeakButton>
                <PeakButton variant="outline">Outline</PeakButton>
                <PeakButton variant="ghost">Ghost</PeakButton>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", marginTop: "16px" }}>
                <PeakButton size="sm">Small</PeakButton>
                <PeakButton size="md">Medium</PeakButton>
                <PeakButton size="lg">Large</PeakButton>
              </div>
            </section>
            
            {/* Typography */}
            <section style={{ marginBottom: "48px" }}>
              <h2 style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: "20px",
                marginBottom: "16px"
              }}>
                Typography
              </h2>
              <div style={{
                background: colors.snow,
                borderRadius: "10px",
                padding: "24px",
                boxShadow: `0 0 0 1px ${colors.wood}15`
              }}>
                <div style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: "40px",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  marginBottom: "16px"
                }}>
                  Heading 1 — Libre Baskerville
                </div>
                <div style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: "30px",
                  fontWeight: 700,
                  lineHeight: 1.3,
                  marginBottom: "16px"
                }}>
                  Heading 2 — Sophisticated
                </div>
                <div style={{
                  fontFamily: "'Libre Baskerville', serif",
                  fontSize: "24px",
                  lineHeight: 1.4,
                  marginBottom: "16px"
                }}>
                  Heading 3 — Elegant
                </div>
                <p style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: colors.charcoal,
                  marginBottom: "12px"
                }}>
                  Body text uses Inter — clean, readable, and modern. This is the primary font for all content, descriptions, and interface elements. It pairs beautifully with Libre Baskerville for headings.
                </p>
                <p style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  color: colors.slate
                }}>
                  Smaller body text for secondary information, meta details, and supporting content.
                </p>
                <div style={{
                  marginTop: "16px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  color: colors.slate,
                  background: `${colors.stone}50`,
                  padding: "12px",
                  borderRadius: "6px"
                }}>
                  Monospace for specs: capacity_lbs: 10000, lift_height_ft: 53.17
                </div>
              </div>
            </section>
            
            {/* Wood Accent */}
            <section>
              <h2 style={{
                fontFamily: "'Libre Baskerville', serif",
                fontSize: "20px",
                marginBottom: "16px"
              }}>
                Wood Accent Bar
              </h2>
              <div style={{
                background: colors.snow,
                borderRadius: "10px",
                padding: "24px",
                boxShadow: `0 0 0 1px ${colors.wood}15`
              }}>
                <div style={{
                  height: "4px",
                  borderRadius: "2px",
                  background: `linear-gradient(90deg, ${colors.woodLight}, ${colors.wood}, ${colors.woodDark})`,
                  marginBottom: "16px"
                }} />
                <p style={{ fontSize: "14px", color: colors.slate, margin: 0 }}>
                  The wood accent bar is a signature element — a subtle gradient that adds warmth and grounds the design in the ski chalet aesthetic.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
