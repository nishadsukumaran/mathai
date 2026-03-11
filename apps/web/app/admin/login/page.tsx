/**
 * @module app/admin/login/page
 *
 * Legacy entry point — admin access is now via the sidebar ⚙️ Admin link
 * (visible only when role === "admin"). This page still exists so old
 * bookmarks don't 404; middleware handles auth/role enforcement.
 */

import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect("/admin/dashboard");
}
