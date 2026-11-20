"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin, Users } from "lucide-react";
import Header from "@/components/layouts/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { useListings } from "@/hooks/use-listings";
import {
  defaultRoom,
  hotelAddress,
  hotelDetailsHref,
  hotelImage,
  hotelListings,
  hotelPrice,
  type HotelBookingParams,
} from "@/lib/hotels/booking";

export default function HotelSearch() {
  const { properties, loading, error, refetch } = useListings({ limit: 100, kind: "hotel" });

  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const hotels = useMemo(() => hotelListings(properties), [properties]);
  const searchedLocation = location.trim().toLocaleLowerCase();
  const visibleHotels = useMemo(
    () =>
      hotels.filter((hotel) =>
        `${hotel.name} ${hotel.address} ${hotel.city}`
          .toLocaleLowerCase()
          .includes(searchedLocation),
      ),
    [hotels, searchedLocation],
  );

  const dateError =
    checkIn && checkOut && checkOut <= checkIn
      ? "Check-out must be after check-in."
      : null;

  const bookingParams: Partial<HotelBookingParams> = { checkIn, checkOut, guests };

  return (
    <div className="mt-[20px] px-4 pb-12 sm:px-6 lg:px-8">
      <Header />
      <div className="mx-auto mt-6 max-w-6xl">
        <h1 className="text-2xl font-bold">Find a hotel to stay</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a hotel, compare its rooms, and hold a reservation with escrow.
        </p>

        <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div>
              <label className="mb-3 block" htmlFor="hotel-check-in">
                Check-in
              </label>
              <Input
                id="hotel-check-in"
                type="date"
                className="w-full sm:w-44"
                value={checkIn}
                onChange={(event) => setCheckIn(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-3 block" htmlFor="hotel-check-out">
                Check-out
              </label>
              <Input
                id="hotel-check-out"
                type="date"
                className="w-full sm:w-44"
                value={checkOut}
                min={checkIn || undefined}
                onChange={(event) => setCheckOut(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-3 block" htmlFor="hotel-guests">
                Guests
              </label>
              <Input
                id="hotel-guests"
                type="number"
                min={1}
                className="w-full sm:w-24"
                value={guests}
                onChange={(event) => setGuests(Math.max(1, Number(event.target.value) || 1))}
              />
            </div>
            <div>
              <label className="mb-3 block" htmlFor="hotel-location">
                Where to
              </label>
              <Input
                id="hotel-location"
                placeholder="San José, San Pedro"
                className="w-full sm:w-64"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </div>
          </div>
          <Button type="button" onClick={refetch} disabled={loading}>
            {loading ? "Searching…" : "Refresh"}
          </Button>
        </div>
        {dateError && <p className="mt-2 text-sm text-destructive">{dateError}</p>}

        {loading && (
          <div role="status" aria-label="Loading hotels" className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-xl border">
                <div className="h-48 bg-muted" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-1/2 rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="mt-8 rounded-xl border border-destructive/30 p-8 text-center">
            <p className="font-semibold">We couldn&apos;t load hotels.</p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" className="mt-4" onClick={refetch}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && visibleHotels.length === 0 && (
          <div className="mt-8 rounded-xl border p-8 text-center text-muted-foreground">
            {hotels.length === 0
              ? "No hotel has been registered yet. Ask a hotel manager to add one."
              : "No hotel matches this search."}
          </div>
        )}

        {!loading && !error && visibleHotels.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {visibleHotels.map((hotel) => {
              const room = defaultRoom(hotel);
              const image = hotelImage(hotel, room);
              const price = hotelPrice(hotel, room);
              const availableRooms = (hotel.rooms ?? []).filter((candidate) => candidate.available);
              return (
                <Card key={hotel.id} className="overflow-hidden transition hover:shadow-lg">
                  <Link
                    href={hotelDetailsHref({ ...bookingParams, hotelId: hotel.id, roomId: room?.id })}
                    aria-label={`View ${hotel.name}`}
                  >
                    <div className="relative h-48 w-full bg-muted">
                      {image ? (
                        <Image
                          src={image}
                          alt={hotel.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          className="rounded-t-md object-cover"
                        />
                      ) : (
                        <div className="grid h-full place-items-center text-sm text-muted-foreground">
                          No photo available
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="flex justify-between py-2 text-lg font-semibold">
                        {hotel.name}
                      </h3>
                      <p className="flex gap-[5px] text-sm text-gray-600 dark:text-gray-300">
                        <MapPin className="shrink-0 text-sky-700" size={20} />
                        {hotelAddress(hotel) || "Location not provided"}
                      </p>
                      <p className="mt-2 flex items-center gap-1 py-2 text-primary">
                        {price === null ? (
                          <span className="text-sm font-medium">Rate unavailable</span>
                        ) : (
                          <>
                            <span className="font-bold">${price.toLocaleString()}</span>
                            <span className="text-xs italic text-gray-400">/night</span>
                          </>
                        )}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users size={14} />
                        {availableRooms.length} of {(hotel.rooms ?? []).length} rooms available
                        {room ? ` · Room ${room.number}` : ""}
                      </p>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
