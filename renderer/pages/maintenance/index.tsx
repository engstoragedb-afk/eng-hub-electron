import { useEffect } from "react";
import { useRouter } from "next/router";

export default function MaintenanceIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/maintenance/dashboard");
  }, [router]);

  return null;
}
