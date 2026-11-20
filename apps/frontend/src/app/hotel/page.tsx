import { redirect } from "next/navigation";

export default function HotelIndexPage() {
  // Legacy public URL kept for bookmarks and shared links — hotels only.
  redirect("/rent?kind=hotel");
}
