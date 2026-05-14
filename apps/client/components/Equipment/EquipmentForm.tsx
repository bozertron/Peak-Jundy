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
  const [category, setCategory] = useState(initial?.category ?? EQUIPMENT_CATEGORIES[0]);
  const [location, setLocation] = useState(initial?.location ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image ?? "");
  const [dailyRateDollars, setDailyRateDollars] = useState(
    initial?.dailyRate ? String(Number(initial.dailyRate) / 100) : ""
  );
  const [specsText, setSpecsText] = useState(
    initial?.specs ? JSON.stringify(safeJsonParse(initial.specs, {}), null, 2) : "{\n  \"model\": \"\",\n  \"year\": 2020\n}"
  );
  const [available, setAvailable] = useState(initial?.available ?? true);
  const [hourMeter, setHourMeter] = useState(initial?.hourMeter ? String(initial.hourMeter) : "");
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
      setError("Enter a valid daily rate.");
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
      setError("Specs must be valid JSON.");
      return;
    }

    const dailyRate = Number(dailyRateDollars);
    if (!title || !description || !category || !dailyRate || dailyRate < 0) {
      setError("Please fill all required fields and ensure daily rate is valid.");
      return;
    }

    const equipmentId = initial?.id;
    if (mode === "edit" && !equipmentId) {
      setError("Missing equipment id for edit.");
      return;
    }

    setSaving(true);
    try {
      const payload: EquipmentFormData = {
        title,
        description,
        category,
        specs: JSON.stringify(specsObj),
        dailyRate,
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

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save listing.");

      router.push(mode === "create" ? "/dashboard/listings" : `/equipment/${equipmentId}`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error saving listing.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-lg border p-6 space-y-6">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Step {step} of {totalSteps}</span>
        <span>{mode === "create" ? "New listing" : "Edit listing"}</span>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input className="input-field w-full" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select className="input-field w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
              {EQUIPMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Daily Rate (USD) *</label>
            <input
              className="input-field w-full"
              inputMode="decimal"
              placeholder="e.g. 450"
              value={dailyRateDollars}
              onChange={(e) => setDailyRateDollars(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Stored in cents on the backend.</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location (optional)</label>
            <input
              className="input-field w-full"
              placeholder="City, state or jobsite"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URL (optional)</label>
            <input
              className="input-field w-full"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
              Available
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">Hour Meter (optional)</label>
              <input className="input-field w-full" value={hourMeter} onChange={(e) => setHourMeter(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <textarea className="input-field w-full min-h-[120px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Specs (JSON) *</label>
            <textarea className="input-field w-full font-mono text-sm min-h-[220px]" value={specsText} onChange={(e) => setSpecsText(e.target.value)} />
          </div>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="flex items-center justify-between">
        {step === 2 ? (
          <button type="button" className="btn-secondary" onClick={goBack}>
            Back
          </button>
        ) : (
          <span />
        )}

        {step === 1 ? (
          <button type="button" className="btn-primary" onClick={goNext}>
            Next
          </button>
        ) : (
          <button disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? "Saving..." : mode === "create" ? "Create Listing" : "Update Listing"}
          </button>
        )}
      </div>
    </form>
  );
}
