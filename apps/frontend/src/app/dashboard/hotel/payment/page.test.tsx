// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";

const hotelApi = vi.hoisted(() => {
  class HotelApiError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HotelApiError";
    }
  }
  return { createReservation: vi.fn(), HotelApiError };
});
const { createReservation } = hotelApi;
const handleConnect = vi.hoisted(() => vi.fn());
const wallet = vi.hoisted(() => ({ address: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV" as string | null }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () =>
    new URLSearchParams({
      hotelId: "hotel-1",
      roomId: "room-1",
      checkIn: "2026-12-01",
      checkOut: "2026-12-03",
      guests: "2",
    }),
}));
vi.mock("next/link", () => ({
  default: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props} />
  ),
}));
vi.mock("@/components/ui/image", () => ({
  Image: ({ alt }: { alt: string }) => <img alt={alt} />,
}));
vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    asChild: _asChild,
    ...props
  }: {
    children?: ReactNode;
    asChild?: boolean;
    disabled?: boolean;
    className?: string;
    onClick?: () => void;
    type?: "button" | "submit";
  }) => <button {...props}>{children}</button>,
}));
vi.mock("@/hooks/use-listings", () => ({
  useListings: () => ({
    properties: [
      {
        id: "hotel-1",
        kind: "hotel",
        name: "Shikara Hotel",
        description: "Harbour view rooms",
        address: "329 Calle Santos",
        city: "San José",
        price: 120,
        images: [],
        rooms: [
          {
            id: "room-1",
            number: "201",
            price: 120,
            capacity: 3,
            available: true,
            images: [],
          },
        ],
      },
    ],
    loading: false,
    error: "",
    refetch: vi.fn(),
  }),
}));
vi.mock("@/hooks/use-active-wallet", () => ({
  useActiveWallet: () => ({
    address: wallet.address,
    walletType: "freighter",
    isReady: Boolean(wallet.address),
    signAndSubmit: vi.fn(),
  }),
}));
vi.mock("@/components/auth/wallet/hooks/multi-wallet.hook", () => ({
  useMultiWallet: () => ({
    handleConnect,
    isMainModalOpen: false,
    isStellarModalOpen: false,
    closeMainModal: vi.fn(),
    closeStellarModal: vi.fn(),
    handleWalletTypeSelected: vi.fn(),
    handleStellarWalletSelected: vi.fn(),
    error: null,
  }),
}));
vi.mock("@/components/auth/wallet/components/MainWalletSelectionModal", () => ({
  MainWalletSelectionModal: () => null,
}));
vi.mock("@/components/auth/wallet/components/WalletSelectionModal", () => ({
  WalletSelectionModal: () => null,
}));
vi.mock("@/lib/api/hotels", () => ({
  createReservation: hotelApi.createReservation,
  HotelApiError: hotelApi.HotelApiError,
}));

import HotelPaymentPage from "./page";

beforeEach(() => {
  wallet.address = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV";
  createReservation.mockReset();
  handleConnect.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("hotel booking payment", () => {
  it("creates the reservation and links the guest to the escrow flow", async () => {
    createReservation.mockResolvedValue({
      reservationId: "reservation-1",
      total: 240,
      holdExpiresAt: "2026-12-01T12:30:00.000Z",
    });

    render(<HotelPaymentPage />);

    fireEvent.click(screen.getByRole("button", { name: /Confirm booking/ }));

    await waitFor(() =>
      expect(createReservation).toHaveBeenCalledWith({
        roomId: "room-1",
        checkIn: "2026-12-01",
        checkOut: "2026-12-03",
        guests: 2,
        walletAddress: wallet.address,
      }),
    );

    expect(await screen.findByText(/Room held for you/)).toBeTruthy();
    expect(screen.getByText(/reservation-1/)).toBeTruthy();
    expect(screen.getByText(/Hold expires/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Continue to secure escrow/ }).getAttribute("href"),
    ).toBe("/dashboard/hotel/booking/reservation-1/escrow");
  });

  it("asks for a wallet before creating the reservation", () => {
    wallet.address = null;

    render(<HotelPaymentPage />);
    fireEvent.click(screen.getByRole("button", { name: /Connect wallet to confirm/ }));

    expect(handleConnect).toHaveBeenCalledTimes(1);
    expect(createReservation).not.toHaveBeenCalled();
  });

  it("shows the API error when the room is unavailable", async () => {
    createReservation.mockRejectedValue(
      new hotelApi.HotelApiError("Room is unavailable for the selected dates"),
    );

    render(<HotelPaymentPage />);
    fireEvent.click(screen.getByRole("button", { name: /Confirm booking/ }));

    expect(
      await screen.findByText("Room is unavailable for the selected dates"),
    ).toBeTruthy();
  });
});
