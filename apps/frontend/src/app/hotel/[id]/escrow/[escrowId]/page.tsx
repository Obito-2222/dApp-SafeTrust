import { redirect } from "next/navigation";

/** Legacy hotel escrow view — no reservation id, so return to the hotel. */
export default async function LegacyHotelEscrowDetailPage({
  params,
}: {
  params: Promise<{ id: string; escrowId: string }>;
}) {
  const { id } = await params;
  redirect(`/hotel/${encodeURIComponent(id)}`);
}
