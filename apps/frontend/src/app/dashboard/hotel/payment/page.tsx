"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import HotelDetails from "@/components/hotels/payment/HotelDetails";
import ReservationSummary from "@/components/hotels/payment/ReservationSummary";
import { Button } from "@/components/ui/button";
import { useListings } from "@/hooks/use-listings";
import { useActiveWallet } from "@/hooks/use-active-wallet";
import { useMultiWallet } from "@/components/auth/wallet/hooks/multi-wallet.hook";
import { MainWalletSelectionModal } from "@/components/auth/wallet/components/MainWalletSelectionModal";
import { WalletSelectionModal } from "@/components/auth/wallet/components/WalletSelectionModal";
import { createReservation, HotelApiError } from "@/lib/api/hotels";
import { truncateStellarAddress } from "@/lib/utils";
import {
  findHotel,
  findRoom,
  hotelAddress,
  hotelDetailsHref,
  hotelEscrowHref,
  hotelImage,
  nightsBetween,
  readHotelBookingParams,
} from "@/lib/hotels/booking";

type ReservationResult = {
  reservationId: string;
  total: number;
  holdExpiresAt: string;
};

const HotelPage = () => {
  const searchParams = useSearchParams();
  const booking = readHotelBookingParams(searchParams);
  const { checkIn, checkOut, guests } = booking;

  const { properties, loading, error, refetch } = useListings({ limit: 100, kind: "hotel" });
  const hotel = findHotel(properties, booking.hotelId);
  const room = findRoom(hotel, booking.roomId);
  const nights = nightsBetween(checkIn, checkOut);

  const { address } = useActiveWallet();
  const {
    handleConnect,
    isMainModalOpen,
    isStellarModalOpen,
    closeMainModal,
    closeStellarModal,
    handleWalletTypeSelected,
    handleStellarWalletSelected,
    error: walletError,
  } = useMultiWallet();

  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [reservation, setReservation] = useState<ReservationResult | null>(null);

  const overCapacity = Boolean(room && guests > room.capacity);
  const canReserve = Boolean(room && hotel && nights && !overCapacity && !submitting && !reservation);

  const handleReserve = async () => {
    if (!room || !hotel || !nights || overCapacity) return;
    if (!address) {
      handleConnect();
      return;
    }
    setFailure(null);
    setSubmitting(true);
    try {
      const created = await createReservation({
        roomId: room.id,
        checkIn,
        checkOut,
        guests,
        walletAddress: address,
      });
      setReservation(created);
    } catch (error) {
      setFailure(
        error instanceof HotelApiError
          ? error.message
          : "We couldn't create your reservation. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading reservation…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">We couldn&apos;t load this reservation</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={refetch}>Try again</Button>
      </div>
    );
  }

  if (!hotel || !room || !nights) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <h1 className="text-xl font-semibold">This booking is incomplete</h1>
        <p className="text-sm text-muted-foreground">
          Pick a hotel, a room and valid dates before paying.
        </p>
        <Button asChild>
          <Link href={hotelDetailsHref(booking)}>Back to details</Link>
        </Button>
      </div>
    );
  }

  const location = hotelAddress(hotel);
  const image = hotelImage(hotel, room);
  const estimatedTotal = Math.round(room.price * nights * 100) / 100;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-dark-background">
      <div className="w-full px-4 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row">
          <div className="flex-grow">
            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-card">
              <HotelDetails
                hotelName={`${hotel.name} · Room ${room.number}`}
                description={hotel.description ?? "Room details"}
                details={`Room ${room.number} sleeps ${room.capacity}. ${hotel.description ?? ""}`.trim()}
                goodToKnow="Your reservation is held for 30 minutes while you deploy the escrow."
                location={location || "Location not provided"}
                pricePerNight={room.price}
                imageUrl={image}
              />
            </div>
          </div>

          <div className="w-full shrink-0 space-y-4 md:w-[400px]">
            {reservation ? (
              <div role="status" className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <CheckCircle2 className="h-5 w-5" /> Room held for you
                </h2>
                <p className="text-sm">
                  Reservation <span className="font-mono text-xs">{reservation.reservationId}</span>
                </p>
                <p className="text-sm">
                  Total: <strong>${reservation.total.toLocaleString()}</strong> USDC
                </p>
                <p className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4" /> Hold expires{" "}
                  {new Date(reservation.holdExpiresAt).toLocaleString()}
                </p>
                <p className="text-xs">
                  The room is released automatically when the hold expires. Deploy the escrow now to
                  keep this booking.
                </p>
                <Button asChild className="w-full">
                  <Link href={hotelEscrowHref(reservation.reservationId)}>
                    Continue to secure escrow
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <ReservationSummary
                  hotelName={hotel.name}
                  description={hotel.description ?? undefined}
                  price={room.price}
                  tax={0}
                  total={estimatedTotal}
                  nights={nights}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                />

                <div className="space-y-3 rounded-2xl border bg-card p-5">
                  {overCapacity && (
                    <p role="alert" className="text-sm text-orange-600">
                      This room sleeps up to {room.capacity} guests.
                    </p>
                  )}
                  {failure && (
                    <p role="alert" className="text-sm text-destructive">
                      {failure}
                    </p>
                  )}
                  {walletError && (
                    <p role="alert" className="text-sm text-destructive">
                      {walletError}
                    </p>
                  )}
                  {address ? (
                    <p className="text-xs text-muted-foreground" title={address}>
                      Paying with {truncateStellarAddress(address)}
                    </p>
                  ) : (
                    <p role="status" className="text-xs text-muted-foreground">
                      Connect your Stellar wallet to confirm this booking.
                    </p>
                  )}

                  <Button
                    className="w-full"
                    disabled={!canReserve}
                    onClick={handleReserve}
                  >
                    {submitting
                      ? "Creating reservation…"
                      : address
                        ? `Confirm booking · $${estimatedTotal.toLocaleString()}`
                        : "Connect wallet to confirm"}
                  </Button>
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    Confirming creates a 30-minute hold. The payment is only taken after you deploy
                    and fund the escrow.
                  </p>
                </div>
              </>
            )}

            <MainWalletSelectionModal
              isOpen={isMainModalOpen}
              onClose={closeMainModal}
              onWalletTypeSelected={handleWalletTypeSelected}
              stellarOnly
            />
            <WalletSelectionModal
              isOpen={isStellarModalOpen}
              onClose={closeStellarModal}
              onWalletSelected={handleStellarWalletSelected}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelPage;
