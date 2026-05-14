import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-peak-cream flex items-center justify-center p-6">
      <div className="peak-frame bg-white rounded-peak p-10 max-w-lg text-center">
        <div className="text-7xl mb-5" aria-hidden>
          🎿
        </div>
        <p className="font-mono uppercase tracking-[0.25em] text-xs text-peak-slate mb-2">
          Wrong run, wrong trail
        </p>
        <h1 className="font-serif text-3xl font-bold text-peak-charcoal mb-3">
          We took a wrong turn somewhere.
        </h1>
        <p className="text-peak-charcoal/70 mb-6 leading-relaxed">
          That page doesn&rsquo;t exist (or it&rsquo;s out on the slope). Head back to the
          lodge and try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
          >
            Back to Peak
          </Link>
          <Link
            href="/browse"
            className="px-5 py-2.5 rounded-peak border border-peak-charcoal/15 text-peak-charcoal hover:bg-peak-cream transition-colors"
          >
            Browse equipment
          </Link>
        </div>
      </div>
    </div>
  );
}
