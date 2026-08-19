import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/auth/dal";
import CarForm from "@/components/admin/CarForm";
import { updateCar } from "@/lib/cars/actions";
import { getCarById } from "@/lib/cars";

export default async function EditCarPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const [t, car] = await Promise.all([getTranslations("AdminCarForm"), getCarById(id)]);
  if (!car) notFound();

  const action = updateCar.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold">{t("editTitle")}</h1>
      <CarForm action={action} car={car} />
    </div>
  );
}
