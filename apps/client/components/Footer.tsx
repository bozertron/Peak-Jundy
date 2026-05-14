import Link from "next/link";

const COORDS_BWV = "49.7231° N, 118.9367° W";

export default function Footer() {
  return (
    <footer className="border-t border-peak-charcoal/10 bg-peak-snow">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
        <div>
          <p className="font-serif text-lg font-bold text-peak-charcoal mb-1">
            Peak
          </p>
          <p className="text-peak-charcoal/60 leading-relaxed">
            Equipment rental, the way mountain communities already trust each
            other.
          </p>
        </div>
        <div>
          <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate mb-3">
            Around the lodge
          </p>
          <ul className="space-y-1.5 text-peak-charcoal/70">
            <li>
              <Link href="/browse" className="hover:text-peak-charcoal transition-colors">
                Browse equipment
              </Link>
            </li>
            <li>
              <Link href="/map" className="hover:text-peak-charcoal transition-colors">
                Map
              </Link>
            </li>
            <li>
              <Link href="/network" className="hover:text-peak-charcoal transition-colors">
                Trust network
              </Link>
            </li>
            <li>
              <Link href="/owner/onboarding" className="hover:text-peak-charcoal transition-colors">
                List your gear
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate mb-3">
            Anchor
          </p>
          <p className="text-peak-charcoal/70">Big White Village</p>
          <p className="font-mono text-[11px] text-peak-charcoal/50 mt-0.5">
            {COORDS_BWV}
          </p>
          <p className="text-peak-charcoal/60 text-xs mt-3 italic">
            Made on the mountain.
          </p>
        </div>
      </div>
      <div className="border-t border-peak-charcoal/5">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-peak-charcoal/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Peak. Built with restraint.</span>
          <span className="font-mono">v0 · mountain time</span>
        </div>
      </div>
    </footer>
  );
}
