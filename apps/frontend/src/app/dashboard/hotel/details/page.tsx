"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import Header from "@/components/layouts/Header";
import { SideBar } from "@/components/layouts/SideBar";
import Gallery from "@/components/hotels/details/Gallery";
import Information from "@/components/hotels/details/Information";
import Details from "@/components/hotels/details/Details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListings } from "@/hooks/use-listings";
import {
  findHotel,
  findRoom,
  hotelAddress,
  hotelDetailsHref,
  hotelPaymentHref,
  hotelPrice,
  nightsBetween,
  readHotelBookingParams,
} from "@/lib/hotels/booking";

export default function HotelDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const booking = readHotelBookingParams(searchParams);

  const { properties, loading, error, refetch } = useListings({ limit: 100, kind: "hotel" });
  const hotel = findHotel(properties, booking.hotelId);
  const room = findRoom(hotel, booking.roomId);

  const [checkIn, setCheckIn] = useState(booking.checkIn);
  const [checkOut, setCheckOut] = useState(booking.checkOut);
  const [guests, setGuests] = useState(booking.guests);

  const nights = nightsBetween(checkIn, checkOut);
  const total = room && nights ? Math.round(room.price * nights * 100) / 100 : null;
  const dateMessage = room && !room.available
    ? "This room is currently unavailable."
    : !checkIn || !checkOut
      ? "Choose your dates to continue."
      : nights === null
        ? "Check-out must be after check-in."
        : guests > (room?.capacity ?? guests)
          ? `This room sleeps up to ${room?.capacity} guests.`
          : null;
  const canContinue = Boolean(room?.available && nights && !dateMessage);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading hotel…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">We couldn&apos;t load this hotel</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={refetch}>Try again</Button>
          <Button asChild>
            <Link href="/dashboard/hotel/search">Back to search</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!booking.hotelId || !hotel) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">Choose a hotel first</h1>
        <p className="text-sm text-muted-foreground">
          {booking.hotelId
            ? "This hotel is no longer listed."
            : "Open the search page to pick a hotel and room."}
        </p>
        <Button asChild>
          <Link href="/dashboard/hotel/search">Find a hotel</Link>
        </Button>
      </div>
    );
  }

  const images = Array.from(new Set([...(room?.images ?? []), ...hotel.images]));
  const price = hotelPrice(hotel, room);
  const roomOptions = hotel.rooms ?? [];

  return (
    <div className="min-h-screen bg-gray-100 text-sm text-black dark:bg-dark-background dark:text-white">
      <Header />
      <div className="mt-8 flex flex-col lg:flex-row">
        <SideBar className="hidden md:block" notificationCount={2} />
        <div className="flex flex-grow flex-col items-center gap-6 p-4">
          <div className="w-full md:w-2/3">
            <Gallery images={images} />
          </div>

          <div className="flex w-full flex-wrap md:w-2/3">
            <div className="w-full md:w-3/4 lg:w-3/4">
              <Information
                name={room ? `${hotel.name} · Room ${room.number}` : hotel.name}
                location={hotelAddress(hotel) || "Location not provided"}
                price={price === null ? "Rate unavailable" : `$${price.toLocaleString()}`}
              />
            </div>
            <div className="hidden md:block md:w-1/4 lg:w-1/4"></div>
          </div>

          <div className="flex w-full flex-wrap gap-4 md:w-2/3">
            <div className="flex w-full gap-4 md:w-3/4 lg:w-3/4">
              <div className="w-full min-h-[200px] md:w-1/2">
                <Details
                  capacity={room?.capacity}
                  description={
                    hotel.description ??
                    "This hotel has not provided a description yet."
                  }
                />
              </div>

              <div className="w-full md:w-1/2">
                <div className="space-y-4 rounded-xl border bg-card p-5">
                  <h2 className="font-semibold">Book this stay</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium" htmlFor="details-check-in">
                        Check-in
                      </label>
                      <Input
                        id="details-check-in"
                        type="date"
                        value={checkIn}
                        onChange={(event) => setCheckIn(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium" htmlFor="details-check-out">
                        Check-out
                      </label>
                      <Input
                        id="details-check-out"
                        type="date"
                        min={checkIn || undefined}
                        value={checkOut}
                        onChange={(event) => setCheckOut(event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium" htmlFor="details-guests">
                        Guests
                      </label>
                      <Input
                        id="details-guests"
                        type="number"
                        min={1}
                        max={room?.capacity}
                        value={guests}
                        onChange={(event) =>
                          setGuests(Math.max(1, Number(event.target.value) || 1))
                        }
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs font-medium">Nights</span>
                      <p className="rounded-md border bg-muted px-3 py-2 text-sm">
                        {nights ?? "—"}
                      </p>
                    </div>
                  </div>

                  {room ? (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users size={14} /> Room {room.number} sleeps {room.capacity}
                      {nights && total !== null ? ` · ${nights} nights · $${total.toLocaleString()}` : ""}
                    </p>
                  ) : (
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      Pick a room below to continue.
                    </p>
                  )}

                  {dateMessage && room && (
                    <p className="text-xs text-muted-foreground">{dateMessage}</p>
                  )}

                  <Button
                    className="w-full"
                    disabled={!canContinue}
                    onClick={() =>
                      router.push(
                        hotelPaymentHref({
                          hotelId: hotel.id,
                          roomId: room?.id,
                          checkIn,
                          checkOut,
                          guests,
                        }),
                      )
                    }
                  >
                    Continue to payment
                  </Button>
                </div>
              </div>
            </div>
            <div className="hidden md:block md:w-1/4 lg:w-1/4"></div>
          </div>

          <div className="w-full md:w-2/3">
            <h2 className="mb-3 text-lg font-semibold">Rooms</h2>
            {roomOptions.length === 0 ? (
              <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                This hotel has no rooms registered yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {roomOptions.map((option) => {
                  const selected = option.id === room?.id;
                  return (
                    <Link
                      key={option.id}
                      href={hotelDetailsHref({
                        hotelId: hotel.id,
                        roomId: option.id,
                        checkIn,
                        checkOut,
                        guests,
                      })}
                      className={`rounded-xl border bg-card p-4 transition hover:shadow-md ${
                        selected ? "border-orange-400 ring-1 ring-orange-300" : ""
                      }`}
                      aria-current={selected ? "true" : undefined}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">Room {option.number}</p>
                        <p className="font-bold text-orange-600">
                          ${option.price.toLocaleString()}
                          <span className="text-xs font-normal text-muted-foreground"> /night</span>
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Sleeps {option.capacity} · {option.available ? "Available" : "Unavailable"}
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
