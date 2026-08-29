"use server";

import { redirect } from "next/navigation";
import { logout } from "@/modules/core/auth/server";

export async function logoutAction() {
  await logout();
  redirect("/login");
}
