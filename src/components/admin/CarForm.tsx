"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { CarFormState } from "@/lib/cars/actions";
import type { CarRow } from "@/lib/supabase/types";
import {
  EGYPT_CAR_MAKES,
  EGYPT_CAR_MAKE_NAMES,
  CAR_YEARS,
  EGYPT_LOCATIONS,
  CAR_CATEGORIES,
  withCurrentValue,
} from "@/lib/carCatalog";

type Action = (state: CarFormState, formData: FormData) => Promise<CarFormState>;

export default function CarForm({ action, car }: { action: Action; car?: CarRow }) {
  const t = useTranslations("AdminCarForm");
  const [state, formAction, pending] = useActionState(action, undefined);
  const [listingType, setListingType] = useState<"rent" | "sale">(car?.listing_type ?? "rent");
  const [make, setMake] = useState(car?.make ?? "");

  const makeOptions = withCurrentValue(EGYPT_CAR_MAKE_NAMES, car?.make);
  const modelOptions = withCurrentValue(EGYPT_CAR_MAKES[make] ?? [], car?.make === make ? car?.model : undefined);
  const yearOptions = withCurrentValue(
    CAR_YEARS.map(String),
    car?.year ? String(car.year) : undefined
  );
  const locationOptions = withCurrentValue(EGYPT_LOCATIONS, car?.location);
  const categoryOptions = withCurrentValue(CAR_CATEGORIES, car?.category);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {car && (
        <input type="hidden" name="existing_images" value={JSON.stringify(car.images)} />
      )}

      <Field label={t("listingType")}>
        <select
          name="listing_type"
          defaultValue={car?.listing_type ?? "rent"}
          onChange={(e) => setListingType(e.target.value as "rent" | "sale")}
          className={inputClass}
        >
          <option value="rent">{t("rent")}</option>
          <option value="sale">{t("sale")}</option>
        </select>
      </Field>

      <Field label={t("status")}>
        <select name="status" defaultValue={car?.status ?? "draft"} className={inputClass}>
          <option value="draft">{t("draft")}</option>
          <option value="published">{t("published")}</option>
          <option value="sold">{t("sold")}</option>
          <option value="rented">{t("rented")}</option>
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("make")}>
          <select
            name="make"
            value={make}
            onChange={(e) => setMake(e.target.value)}
            required
            className={inputClass}
          >
            <option value="" disabled>
              {t("selectMake")}
            </option>
            {makeOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("model")}>
          <select
            key={make}
            name="model"
            defaultValue={car?.make === make ? car?.model ?? "" : ""}
            required
            disabled={!make}
            className={inputClass}
          >
            <option value="" disabled>
              {make ? t("selectModel") : t("selectMakeFirst")}
            </option>
            {modelOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t("year")}>
          <select name="year" defaultValue={car?.year ? String(car.year) : ""} required className={inputClass}>
            <option value="" disabled>
              {t("selectYear")}
            </option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("location")}>
          <select name="location" defaultValue={car?.location ?? ""} required className={inputClass}>
            <option value="" disabled>
              {t("selectLocation")}
            </option>
            {locationOptions.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t("title")}>
        <input name="title" defaultValue={car?.title} required className={inputClass} />
      </Field>

      <Field label={t("description")}>
        <textarea
          name="description"
          defaultValue={car?.description ?? ""}
          rows={4}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label={t("category")}>
          <select name="category" defaultValue={car?.category ?? ""} className={inputClass}>
            <option value="">—</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("transmission")}>
          <select name="transmission" defaultValue={car?.transmission ?? ""} className={inputClass}>
            <option value="">—</option>
            <option value="automatic">{t("automatic")}</option>
            <option value="manual">{t("manual")}</option>
          </select>
        </Field>
        <Field label={t("fuelType")}>
          <select name="fuel_type" defaultValue={car?.fuel_type ?? ""} className={inputClass}>
            <option value="">—</option>
            <option value="petrol">{t("petrol")}</option>
            <option value="diesel">{t("diesel")}</option>
            <option value="electric">{t("electric")}</option>
            <option value="hybrid">{t("hybrid")}</option>
          </select>
        </Field>
      </div>

      <Field label={t("mileage")}>
        <input
          name="mileage_km"
          type="number"
          defaultValue={car?.mileage_km ?? ""}
          className={inputClass}
        />
      </Field>

      {listingType === "rent" ? (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-semibold text-brand">{t("rentalPricing")}</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("rentTerm")}>
              <select name="rent_term" defaultValue={car?.rent_term ?? "short_term"} className={inputClass}>
                <option value="short_term">{t("shortTerm")}</option>
                <option value="long_term">{t("longTerm")}</option>
              </select>
            </Field>
            <Field label={t("dailyPrice")}>
              <input name="daily_price" type="number" defaultValue={car?.daily_price ?? ""} className={inputClass} />
            </Field>
          </div>
          <Field label={t("monthlyPrice")}>
            <input name="monthly_price" type="number" defaultValue={car?.monthly_price ?? ""} className={inputClass} />
          </Field>
        </div>
      ) : (
        <div className="rounded-xl border border-border p-4">
          <p className="mb-3 text-sm font-semibold text-brand">{t("salePricing")}</p>
          <Field label={t("salePrice")}>
            <input name="sale_price" type="number" defaultValue={car?.sale_price ?? ""} className={inputClass} />
          </Field>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <Checkbox name="price_negotiable" label={t("negotiable")} defaultChecked={car?.price_negotiable} />
            <Checkbox name="installment_available" label={t("installmentsAvailable")} defaultChecked={car?.installment_available} />
            <Checkbox name="inspected" label={t("inspected")} defaultChecked={car?.inspected} />
          </div>
        </div>
      )}

      <Field label={t("photos")}>
        <input name="images" type="file" accept="image/*" multiple className={inputClass} />
        {car && car.images.length > 0 && (
          <div className="mt-3 flex gap-2">
            {car.images.map((src) => (
              <div key={src} className="relative h-16 w-24 overflow-hidden rounded-md bg-placeholder">
                <Image src={src} alt="" fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </Field>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? t("saving") : t("save")}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}
