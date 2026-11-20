import { describe, expect, it } from "vitest";
import type { PublicRentalProperty } from "@safetrust/types";
import {
  defaultRoom,
  findHotel,
  findRoom,
  hotelDetailsHref,
  hotelPaymentHref,
  nightsBetween,
  readHotelBookingParams,
} from "./booking";

const hotel: PublicRentalProperty = {
  id: "hotel-1",
  kind: "hotel",
  name: "Shikara Hotel",
  description: null,
  address: "329 Calle Santos",
  city: "San José",
  price: 80,
  images: [],
  rooms: [
    { id: "room-suite", number: "301", price: 150, capacity: 4, available: true, images: [] },
    { id: "room-standard", number: "201", price: 90, capacity: 2, available: true, images: [] },
    { id: "room-closed", number: "101", price: 60, capacity: 2, available: false, images: [] },
  ],
};

describe("hotel booking helpers", () => {
  it("reads and defaults the booking query", () => {
    const params = readHotelBookingParams(
      new URLSearchParams({
        hotelId: "hotel-1",
        roomId: "room-standard",
        checkIn: "2026-12-01",
        checkOut: "2026-12-03",
        guests: "2",
      }),
    );

    expect(params).toEqual({
      hotelId: "hotel-1",
      roomId: "room-standard",
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guests: 2,
    });
    expect(readHotelBookingParams(new URLSearchParams()).guests).toBe(1);
  });

  it("builds details and payment URLs that keep the booking context", () => {
    expect(hotelDetailsHref({ hotelId: "hotel-1", roomId: "room-standard", guests: 2 })).toBe(
      "/dashboard/hotel/details?hotelId=hotel-1&roomId=room-standard&guests=2",
    );
    expect(hotelPaymentHref({ hotelId: "hotel-1", checkIn: "2026-12-01" })).toBe(
      "/dashboard/hotel/payment?hotelId=hotel-1&checkIn=2026-12-01",
    );
  });

  it("computes nights only for a valid date range", () => {
    expect(nightsBetween("2026-12-01", "2026-12-03")).toBe(2);
    expect(nightsBetween("2026-12-03", "2026-12-01")).toBeNull();
    expect(nightsBetween("2026-12-01", "2026-12-01")).toBeNull();
    expect(nightsBetween("", "2026-12-01")).toBeNull();
    expect(nightsBetween("not-a-date", "2026-12-01")).toBeNull();
  });

  it("finds the listing, the selected room, and the cheapest available room", () => {
    expect(findHotel([hotel], "hotel-1")).toBe(hotel);
    expect(findHotel([hotel], "missing")).toBeUndefined();
    expect(findRoom(hotel, "room-standard")?.price).toBe(90);
    expect(defaultRoom(hotel)?.id).toBe("room-standard");
  });
});
