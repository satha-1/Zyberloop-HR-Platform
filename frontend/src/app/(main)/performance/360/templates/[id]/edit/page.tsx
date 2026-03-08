"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    // Redirect to new page with id param for edit mode
    if (id) {
      router.replace(`/performance/360/templates/new?id=${id}`);
    }
  }, [id, router]);

  return null;
}
