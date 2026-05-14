import { redirect } from "next/navigation";

export default function UnfulfilledSearchesRedirect() {
  redirect("/admin/dashboard/unfulfilled");
}
