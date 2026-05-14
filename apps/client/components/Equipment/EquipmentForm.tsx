"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EQUIPMENT_CATEGORIES } from "@/lib/categories";
import { safeJsonParse } from "@/lib/utils";
import type { EquipmentFormData } from "@/lib/types";

type Mode = "create" | "edit";
type EquipmentFormInitial = Partial<EquipmentFormData> & {
  id?: string;
  specs?: string | null;
};

const DEFAULT_SPECS = '{\n  "model": "",\n  "year": 2020\n}';

const inputClass =
  "w-full px-4 py-2.5 rounded-peak bg-peak-snow border border-peak-stone text-peak-charcoal placeholder:text-peak-slate focus:outline-none focus:ring-2 focus:ring-peak-forest-500 focus:ring-offset-1 transition-all";

const labelClass =
  "block text-sm font-medium text-peak-charcoal mb-1.5";

export default function EquipmentForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial?: EquipmentFormInitial;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(
    initial?.category ?? EQUIPMENT_CATEGORIES[0]
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image ?? "");
  const [dailyRateDollars, setDailyRateDollars] = useState(
    initial?.dailyRate ? String(Number(initial.dailyRate) / 100) : ""
  );
  const [specsText, setSpecsText] = useState(
    initial?.specs
      ? JSON.stringify(safeJsonParse(initial.specs, {}), null, 2)
      : DEFAULT_SPECS
  );
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [hourMeter, setHourMeter] = useState(
    initial?.hourMeter ? String(initial.hourMeter) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const totalSteps = 2;

  const goNext = () => {
    const dailyRateNumber = Number(dailyRateDollars);
    if (!title.trim() || !category.trim()) {
      setError("Title and category are required.");
      return;
    }
    if (!Number.isFinite(dailyRateNumber) || dailyRateNumber <= 0) {
      setError("Daily rate needs a positive number.");
      return;
    }
    setError(null);
    setStep(2);
  };

  const goBack = () => {
    setError(null);
    setStep(1);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      goNext();
      return;
    }

    setError(null);

    // Validate JSON
    let specsObj: Record<string, unknown> = {};
    try {
      specsObj = JSON.parse(specsText);
    } catch {
      setError("Specs need to be valid JSON.");
      return;
    }

    const dailyRate = Number(dailyRateDollars);
    if (
      !title ||
      !description ||
      !category ||
      !Number.isFinite(dailyRate) ||
      dailyRate <= 0
    ) {
      setError("Fill in title, description, category, and a positive daily rate.");
      return;
    }

    const equipmentId = initial?.id;
    if (mode === "edit" && !equipmentId) {
      setError("Couldn't find this listing to edit.");
      return;
    }

    setSaving(true);
    try {
      const payload: EquipmentFormData = {
        title,
        description,
        category,
        specs: JSON.stringify(specsObj),
        dailyRate: Math.round(dailyRate * 100), // store in cents
        available,
        hourMeter: hourMeter ? Number(hourMeter) : null,
        location: location.trim() || null,
        image: imageUrl.trim() || null,
      };

      const res = await fetch(
        mode === "create" ? "/api/equipment" : `/api/equipment/${equipmentId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Validation errors from the API
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0] as
            | string
            | undefined;
          throw new Error(firstError ?? "Validation failed.");
        }
        throw new Error(data?.error || "Couldn't save the listing.");
      }

      router.push(
        mode === "create" ? "/dashboard/listings" : `/equipment/${equipmentId}`
      );
      router.refresh();
    } catch (err: unknown) {
      console.error("[equipment-form]", err);
      setError(err instanceof Error ? err.message : "Couldn't save listing.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="peak-frame bg-white rounded-peak p-6 space-y-6"
    >
      <div className="flex items-center justify-between font-mono uppercase tracking-[0.2em] text-[10px] text-peak-slate">
        <span>
          Step {step} of {totalSteps}
        </span>
        <span>{mode === "create" ? "New listing" : "Edit listing"}</span>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className={labelClass} htmlFor="title">
              Title *
            </label>
            <input
              id="title"
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="1998 JLG 10054 Telehandler"
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="category">
              Category *
            </label>
            <select
              id="category"
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {EQUIPMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="dailyRate">
              Daily rate (USD) *
            </label>
            <input
              id="dailyRate"
              className={inputClass}
              inputMode="decimal"
              placeholder="e.g. 450"
              value={dailyRateDollars}
              onChange={(e) => setDailyRateDollars(e.target.value)}
            />
            <p className="text-xs text-peak-charcoal/60 mt-1">
              Stored in cents under the hood. Whole dollars are fine.
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="location">
              Location
            </label>
            <input
              id="location"
              className={inputClass}
              placeholder="Big White Village, BC"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="image">
              Image URL
            </label>
            <input
              id="image"
              className={inputClass}
              placeholder="https://… (Unsplash, your CDN, whatever)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="flex items-center gap-2 text-sm text-peak-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="w-4 h-4 rounded border-peak-stone text-peak-forest focus:ring-peak-forest-500"
              />
              Available for rent
            </label>

            <div>
              <label className={labelClass} htmlFor="hourMeter">
                Hour meter
              </label>
              <input
                id="hourMeter"
                className={inputClass}
                inputMode="decimal"
                placeholder="e.g. 4500"
                value={hourMeter}
                onChange={(e) => setHourMeter(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="description">
              Description *
            </label>
            <textarea
              id="description"
              className={`${inputClass} min-h-[120px]`}
              placeholder="What's it good for? Honest take on condition. Pickup/delivery options."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="specs">
              Specs (JSON) *
            </label>
            <textarea
              id="specs"
              className={`${inputClass} font-mono text-sm min-h-[220px]`}
              value={specsText}
              onChange={(e) => setSpecsText(e.target.value)}
            />
            <p className="text-xs text-peak-charcoal/60 mt-1">
              Model, year, capacity, fuel — anything that helps the renter
              decide. Free-form keys.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-peak bg-peak-burgundy/5 border border-peak-burgundy/30 text-peak-burgundy p-3 text-sm"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-peak-charcoal/10">
        {step === 2 ? (
          <button
            type="button"
            onClick={goBack}
            className="px-4 py-2 rounded-peak border border-peak-charcoal/15 text-sm font-medium text-peak-charcoal hover:bg-peak-cream transition-colors"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}

        {step === 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-peak bg-peak-forest text-white font-medium hover:bg-peak-forest/90 disabled:opacity-50 transition-colors"
          >
            {saving
              ? "Saving…"
              : mode === "create"
                ? "Create listing"
                : "Save changes"}
          </button>
        )}
      </div>
    </form>
  );
}
