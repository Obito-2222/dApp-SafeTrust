import { redirect } from "next/navigation";

/**
 * Legacy hotel escrow entry point.
 *
 * A hotel escrow requires a saved reservation, which this URL does not carry.
 * Send the guest back to the hotel so they can pick a room and dates.
 */
export default async function LegacyHotelEscrowCreatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/hotel/${encodeURIComponent(id)}`);
}
