import { redirect } from "next/navigation";

export default function EditListingRedirect({ params }: { params: { id: string } }) {
  redirect(`/owner/listings/${params.id}/edit`);
}
