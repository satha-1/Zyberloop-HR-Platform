"use client";
import { redirect } from "next/navigation";

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  // Redirect to new page with id param for edit mode
  redirect(`/performance/360/templates/new?id=${params.id}`);
}
