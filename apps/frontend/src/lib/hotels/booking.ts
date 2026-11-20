import type { PublicRentalProperty } from "@safetrust/types";

export type HotelRoom = NonNullable<PublicRentalProperty["rooms"]>[number];

export const HOTEL_DETAILS_PATH = "/dashboard/hotel/details";
export const HOTEL_PAYMENT_PATH = "/dashboard/hotel/payment";

export type HotelBookingParams = {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

type SearchParamReader = { get(name: string): string | null };

/** Reads the booking parameters the search → details → payment flow passes along. */
export function readHotelBookingParams(read: SearchParamReader): HotelBookingParams {
  const guests = Number(read.get("guests") ?? "");
  return {
    hotelId: (read.get("hotelId") ?? "").trim(),
    roomId: (read.get("roomId") ?? "").trim(),
    checkIn: (read.get("checkIn") ?? "").trim(),
    checkOut: (read.get("checkOut") ?? "").trim(),
    guests: Number.isInteger(guests) && guests > 0 ? guests : 1,
  };
}

export function hotelBookingQuery(params: Partial<HotelBookingParams>): URLSearchParams {
  const query = new URLSearchParams();
  if (params.hotelId) query.set("hotelId", params.hotelId);
  if (params.roomId) query.set("roomId", params.roomId);
  if (params.checkIn) query.set("checkIn", params.checkIn);
  if (params.checkOut) query.set("checkOut", params.checkOut);
  if (params.guests) query.set("guests", String(params.guests));
  return query;
}

function withQuery(path: string, params: Partial<HotelBookingParams>): string {
  const query = hotelBookingQuery(params).toString();
  return query ? `${path}?${query}` : path;
}

export function hotelDetailsHref(params: Partial<HotelBookingParams>): string {
  return withQuery(HOTEL_DETAILS_PATH, params);
}

export function hotelPaymentHref(params: Partial<HotelBookingParams>): string {
  return withQuery(HOTEL_PAYMENT_PATH, params);
}

/** The saved reservation is the escrow subject for hotel bookings. */
export function hotelEscrowHref(reservationId: string): string {
  return `/dashboard/hotel/booking/${encodeURIComponent(reservationId)}/escrow`;
}

/** Whole nights between two `YYYY-MM-DD` values, or null when the range is invalid. */
export function nightsBetween(checkIn: string, checkOut: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkIn) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOut)) return null;
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 86_400_000);
}

export function hotelListings(listings: PublicRentalProperty[]): PublicRentalProperty[] {
  return listings.filter((listing) => listing.kind === "hotel");
}

export function findHotel(
  listings: PublicRentalProperty[],
  hotelId: string,
): PublicRentalProperty | undefined {
  if (!hotelId) return undefined;
  return listings.find((listing) => listing.kind === "hotel" && listing.id === hotelId);
}

export function findRoom(
  hotel: PublicRentalProperty | undefined,
  roomId: string,
): HotelRoom | undefined {
  if (!hotel || !roomId) return undefined;
  return hotel.rooms?.find((room) => room.id === roomId);
}

/** Cheapest available room, used to open a hotel without an explicit room. */
export function defaultRoom(hotel: PublicRentalProperty): HotelRoom | undefined {
  return (hotel.rooms ?? [])
    .filter((room) => room.available)
    .reduce<HotelRoom | undefined>(
      (cheapest, room) => (!cheapest || room.price < cheapest.price ? room : cheapest),
      undefined,
    );
}

export function hotelAddress(hotel: PublicRentalProperty): string {
  return [hotel.address, hotel.city].filter(Boolean).join(", ");
}

export function hotelImage(hotel: PublicRentalProperty, room?: HotelRoom): string | undefined {
  return room?.images[0] ?? hotel.images[0];
}

export function hotelPrice(hotel: PublicRentalProperty, room?: HotelRoom): number | null {
  return room?.price ?? hotel.price;
}
