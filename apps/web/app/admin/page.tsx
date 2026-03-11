/**
 * @module app/admin/page
 *
 * /admin root — redirect to /admin/dashboard.
 */

import { redirect } from "next/navigation";

export default function AdminPage() {
  redirect("/admin/dashboard");
}
