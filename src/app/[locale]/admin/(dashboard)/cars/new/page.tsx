import { getTranslations } from "next-intl/server";
import CarForm from "@/components/admin/CarForm";
import { createCar } from "@/lib/cars/actions";

export default async function NewCarPage() {
  const t = await getTranslations("AdminCarForm");
  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{t("addTitle")}</h1>
      <CarForm action={createCar} />
    </div>
  );
}
