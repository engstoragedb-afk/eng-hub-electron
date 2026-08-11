import { useRouter } from "next/router";
import Link from "next/link";
import React from "react";
import { FiHome, FiChevronRight } from "react-icons/fi";

export default function Breadcrumbs() {
  const router = useRouter();

  // Ignore query parameters for the breadcrumb path logic
  const asPathWithoutQuery = router.asPath.split("?")[0];
  const pathSegments = asPathWithoutQuery.split("/").filter((p) => p !== "");

  if (pathSegments.length === 0) {
    return null;
  }

  // Helper to format segment strings
  const formatSegment = (segment: string) => {
    return decodeURIComponent(segment)
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <nav aria-label="Breadcrumb" className="mb-3 inline-flex items-center rounded-full border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/40 px-4 py-1.5 backdrop-blur-md shadow-sm">
      <ol className="flex items-center gap-2 text-sm">
        <li>
          <FiHome className="text-sm" />
        </li>
        {pathSegments.map((segment, index) => {
          const isLast = index === pathSegments.length - 1;
          const href = "/" + pathSegments.slice(0, index + 1).join("/");

          return (
            <React.Fragment key={href}>
              <li>
                <FiChevronRight className="text-slate-400 dark:text-slate-600 text-sm" />
              </li>
              <li>
                {isLast ? (
                  <span className="font-bold text-sky-400 tracking-wide">
                    {formatSegment(segment)}
                  </span>
                ) : (
                  <Link href={href} className="font-medium text-slate-400 dark:text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 transition-colors">
                    {formatSegment(segment)}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
