import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

import MaintenanceLayout from "@/components/organisms/MaintenanceLayout";
import CategoryCard from "@/components/molecules/CategoryCard";
import { categoryUnitsService } from "@/services";

export default function MaintenanceUnitPage() {
  const router = useRouter();

  const categoryImages: Record<string, string> = {
    EXCAVATOR: "/units/exavator.png",
    BULLDOZER: "/units/bulldozer.png",
    VIBRO: "/units/vibro.png",
    "MOTOR GRADER": "/units/motor-grader.png",
    TRUCK: "/units/truck.png",
  };

  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    categoryUnitsService.getAll()
      .then((data) => {
        if (data) {
          const formatted = data
            .filter((item: any) => item.name !== "NULL" && item.name !== "equipment_group")
            .map((item: any) => ({
              id: item.id,
              name: item.name,
              count: item.units,
              image: item.image,
            }));
          setCategories(formatted);
        }
      })
      .catch((err) => console.error("Failed to fetch category units:", err));
  }, []);

  return (
    <React.Fragment>
      <MaintenanceLayout
        title="Maintenance Unit"
        subtitle="Kategori unit dan daftar asset perbaikan"
      >
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.name}
              category={category.name}
              count={category.count}
              imageUrl={category.image || categoryImages[category.name]}
              onSelect={() => {
                sessionStorage.removeItem(`unit_filters_${category.name}`);
                router.push(`/maintenance/unit/${encodeURIComponent(category.name)}?id=${category.id}`);
              }}
            />
          ))}
        </section>
      </MaintenanceLayout>
    </React.Fragment>
  );
}
