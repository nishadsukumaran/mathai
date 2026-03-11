/**
 * @module app/admin/login/page
 *
 * Admin login redirect — sends the browser to the shared /auth/signin page
 * with a callbackUrl pointing back to the admin dashboard.
 * The middleware handles all real access control.
 */

import { redirect } from "next/navigation";

export default function AdminLoginPage() {
  redirect("/auth/signin?callbackUrl=/admin/dashboard");
}
