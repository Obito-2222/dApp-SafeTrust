"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, MapPin, Users } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useListings } from "@/hooks/use-listings";
import {
  findHotel,
  hotelAddress,
  hotelDetailsHref,
  hotelImage,
  hotelPrice,
} from "@/lib/hotels/booking";

export default function PublicHotelDetailPage() {
  const params = useParams<{ id: string }>();
  const hotelId = params?.id ?? "";
  const { properties, loading, error, refetch } = useListings({ limit: 100, kind: "hotel" });
  const hotel = findHotel(properties, hotelId);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading hotel…
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">We couldn&apos;t load this hotel</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button type="button" onClick={refetch} className="font-semibold text-orange-700 underline">
          Try again
        </button>
      </main>
    );
  }

  if (!hotel) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Hotel not found</h1>
        <p className="text-sm text-muted-foreground">This hotel is no longer listed.</p>
        <Link href="/rent?kind=hotel" className="font-semibold text-orange-700 underline">
          Browse hotels
        </Link>
      </main>
    );
  }

  const address = hotelAddress(hotel);
  const rooms = hotel.rooms ?? [];
  const cover = hotelImage(hotel);
  const price = hotelPrice(hotel);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="text-xl font-bold">SafeTrust</Link>
          <Link href="/rent?kind=hotel" className="text-sm font-semibold text-orange-700 hover:underline dark:text-orange-300">
            All hotels
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
            {cover ? (
              <Image
                src={cover}
                alt={hotel.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No photo available
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">{hotel.name}</h1>
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              {address || "Location not provided"}
            </p>
            <p className="text-sm text-muted-foreground">
              {hotel.description ?? "This hotel has not provided a description yet."}
            </p>
            {price !== null && (
              <p className="text-xl font-bold text-orange-600">
                ${price.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground"> /night</span>
              </p>
            )}
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> {rooms.filter((room) => room.available).length} rooms available
            </p>
            <Link
              href={hotelDetailsHref({ hotelId: hotel.id })}
              className="inline-flex rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Check dates and book
            </Link>
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-xl font-semibold">Rooms</h2>
          {rooms.length === 0 ? (
            <p className="rounded-2xl border p-6 text-sm text-muted-foreground">
              This hotel has no rooms registered yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={hotelDetailsHref({ hotelId: hotel.id, roomId: room.id })}
                  className="space-y-2 rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">Room {room.number}</p>
                    <p className="font-bold text-orange-600">
                      ${room.price.toLocaleString()}
                      <span className="text-xs font-normal text-muted-foreground"> /night</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sleeps {room.capacity} · {room.available ? "Available" : "Unavailable"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
