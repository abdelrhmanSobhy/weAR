import type React from "react";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerAccountPage } from "@/features/customer/pages/CustomerAccountPage";
import { CustomerAddressesPage } from "@/features/customer/pages/CustomerAddressesPage";
import { CustomerAvatarPage } from "@/features/customer/pages/CustomerAvatarPage";
import { CustomerAvatarManualPage } from "@/features/customer/pages/CustomerAvatarManualPage";
import { CustomerAvatarPhotoPage } from "@/features/customer/pages/CustomerAvatarPhotoPage";
import { getSafeCustomerReturnRoute } from "@/features/customer/utils/customerReturnRoute";

const mutate = vi.fn();
const hooks = vi.hoisted(() => ({
  useCustomerProfile: vi.fn(), useUpdateCustomerProfile: vi.fn(), useChangeCustomerPassword: vi.fn(), useDeleteCustomerAccount: vi.fn(),
  useCustomerAddresses: vi.fn(), useCreateCustomerAddress: vi.fn(), useUpdateCustomerAddress: vi.fn(), useDeleteCustomerAddress: vi.fn(), useSetDefaultCustomerAddress: vi.fn(),
  useCustomerAvatar: vi.fn(), useCustomerAvatarHistory: vi.fn(), useCreateCustomerAvatar: vi.fn(), useUpdateCustomerAvatarMeasurements: vi.fn(), useDeleteCustomerAvatar: vi.fn(), useExtractCustomerAvatarFromImage: vi.fn(), useRepairAvatarSourceImage: vi.fn(),
}));

vi.mock("@/features/customer/queries/profileAvatar.queries", () => hooks);

const renderPage = (ui: React.ReactNode, route = "/customer/account") => render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
const idleMutation = () => ({ mutate, isPending: false, isError: false });

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useCustomerProfile.mockReturnValue({ isLoading: false, isError: false, data: { id: "c1", fullName: "Ada Lovelace", email: "ada@example.com", phoneNumber: "123", age: 29, gender: "Female" } });
  hooks.useUpdateCustomerProfile.mockReturnValue(idleMutation());
  hooks.useChangeCustomerPassword.mockReturnValue(idleMutation());
  hooks.useDeleteCustomerAccount.mockReturnValue(idleMutation());
  hooks.useCustomerAddresses.mockReturnValue({ isLoading: false, isError: false, data: [] });
  hooks.useCreateCustomerAddress.mockReturnValue(idleMutation());
  hooks.useUpdateCustomerAddress.mockReturnValue(idleMutation());
  hooks.useDeleteCustomerAddress.mockReturnValue(idleMutation());
  hooks.useSetDefaultCustomerAddress.mockReturnValue(idleMutation());
  hooks.useCustomerAvatar.mockReturnValue({ isLoading: false, isError: false, data: null });
  hooks.useCustomerAvatarHistory.mockReturnValue({ isLoading: false, data: [] });
  hooks.useCreateCustomerAvatar.mockReturnValue(idleMutation());
  hooks.useUpdateCustomerAvatarMeasurements.mockReturnValue(idleMutation());
  hooks.useDeleteCustomerAvatar.mockReturnValue(idleMutation());
  hooks.useExtractCustomerAvatarFromImage.mockReturnValue(idleMutation());
  hooks.useRepairAvatarSourceImage.mockReturnValue(idleMutation());
});

describe("Command 07 customer pages", () => {
  it("loads and updates account profile", () => {
    renderPage(<CustomerAccountPage />);
    expect(screen.getByRole("heading", { name: "Account" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Ada Byron" } });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ fullName: "Ada Byron" }), expect.any(Object));
  });

  it("submits change-password and delete-account confirmation", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(<CustomerAccountPage />);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "old" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "new" } });
    fireEvent.click(screen.getByRole("button", { name: "Change password" }));
    fireEvent.change(screen.getByLabelText("Delete account password"), { target: { value: "old" } });
    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ currentPassword: "old", newPassword: "new" }), expect.any(Object));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ password: "old" }), expect.any(Object));
  });

  it("renders address empty state and create/edit/delete/default actions", () => {
    hooks.useCustomerAddresses.mockReturnValue({ isLoading: false, isError: false, data: [{ id: "a1", fullName: "Ada", phoneNumber: "123", line1: "1 Main", city: "Cairo", postalCode: "12345", country: "EG", isDefault: false }] });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderPage(<CustomerAddressesPage />, "/customer/account/addresses");
    fireEvent.click(screen.getByRole("button", { name: "Add address" }));
    expect(screen.getByRole("heading", { name: "Addresses" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit address" }));
    fireEvent.click(screen.getByRole("button", { name: "Set as default" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(mutate).toHaveBeenCalledWith("a1");
  });

  it("renders avatar no-avatar and measurement/null formatting states", () => {
    renderPage(<CustomerAvatarPage />, "/customer/avatar");
    expect(screen.getByText("No avatar yet")).toBeInTheDocument();
    hooks.useCustomerAvatar.mockReturnValue({ isLoading: false, isError: false, data: { id: "av1", customerId: "c1", avatar3dModelUrl: null, measurements: { heightCm: 170, chestCm: null } } });
    renderPage(<CustomerAvatarPage />, "/customer/avatar");
    expect(screen.getByText("3D unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("uses create versus update behavior on manual measurements", () => {
    renderPage(<CustomerAvatarManualPage />, "/customer/avatar/manual");
    fireEvent.change(screen.getByLabelText(/Height/), { target: { value: "180" } });
    fireEvent.change(screen.getByLabelText(/Weight/), { target: { value: "75" } });
    fireEvent.click(screen.getByRole("button", { name: "Create avatar" }));
    expect(mutate).toHaveBeenCalledWith(expect.objectContaining({ heightCm: 180, weightKg: 75 }), expect.any(Object));
    hooks.useCustomerAvatar.mockReturnValue({ isLoading: false, isError: false, data: { id: "av1", customerId: "c1", avatar3dModelUrl: null, measurements: { heightCm: 170, weightKg: 70 } } });
    renderPage(<CustomerAvatarManualPage />, "/customer/avatar/manual");
    expect(screen.getByRole("button", { name: "Update measurements" })).toBeInTheDocument();
  });

  it("validates photo type, requires front image and height, and surfaces null-model extraction", async () => {
    const calls: unknown[] = [];
    hooks.useExtractCustomerAvatarFromImage.mockReturnValue({ mutate: (payload: unknown, opts: { onSuccess: (data: unknown) => void }) => { calls.push(payload); opts.onSuccess({ id: "av1", customerId: "c1", avatar3dModelUrl: null, measurements: { heightCm: 177 } }); }, isPending: false, isError: false });
    renderPage(<CustomerAvatarPhotoPage />, "/customer/avatar/photo");
    fireEvent.change(screen.getByLabelText("Front full-body image"), { target: { files: [new File(["x"], "bad.webp", { type: "image/webp" })] } });
    expect(screen.getByRole("alert")).toHaveTextContent(/JPEG or PNG/);
    fireEvent.change(screen.getByLabelText("Front full-body image"), { target: { files: [new File(["x"], "front.png", { type: "image/png" })] } });
    fireEvent.change(screen.getByLabelText("Height in centimeters"), { target: { value: "177" } });
    expect(screen.getByRole("button", { name: "Extract measurements" })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Extract measurements" }));
    expect(calls[0]).toMatchObject({ frontImageFile: expect.any(File), heightCm: 177 });
    expect((calls[0] as Record<string, unknown>).sideImageFile).toBeUndefined();
    await waitFor(() => expect(screen.getByText(/no 3D avatar model was returned/)).toBeInTheDocument());
  });

  it("displays backend FrontImageFile validation errors", () => {
    const axiosError = { isAxiosError: true, response: { status: 400, data: { errors: { FrontImageFile: ["The FrontImageFile field is required."] } } } };
    hooks.useExtractCustomerAvatarFromImage.mockReturnValue({ mutate: (_payload: unknown, opts: { onError: (e: unknown) => void }) => opts.onError(axiosError), isPending: false, isError: true });
    renderPage(<CustomerAvatarPhotoPage />, "/customer/avatar/photo");
    fireEvent.change(screen.getByLabelText("Front full-body image"), { target: { files: [new File(["x"], "front.png", { type: "image/png" })] } });
    fireEvent.change(screen.getByLabelText("Height in centimeters"), { target: { value: "177" } });
    fireEvent.click(screen.getByRole("button", { name: "Extract measurements" }));
    expect(screen.getByText(/The FrontImageFile field is required/)).toBeInTheDocument();
  });

  it("shows the photo-avatar info note on the manual page for 3D try-on", () => {
    renderPage(<CustomerAvatarManualPage />, "/customer/avatar/manual?returnTo=%2Fcustomer%2Ftry-on");
    expect(screen.getByText(/3D try-on requires a photo-generated avatar/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create photo avatar instead/ })).toBeInTheDocument();
  });

  it("shows a backend error code message when AI extraction fails", () => {
    const axiosError = { isAxiosError: true, response: { status: 422, data: { code: "AI_EXTRACTION_FAILED", message: "AI could not detect a full body.", traceId: "trace-123" } } };
    hooks.useExtractCustomerAvatarFromImage.mockReturnValue({ mutate: (_payload: unknown, opts: { onError: (e: unknown) => void }) => opts.onError(axiosError), isPending: false, isError: true });
    renderPage(<CustomerAvatarPhotoPage />, "/customer/avatar/photo");
    fireEvent.change(screen.getByLabelText("Front full-body image"), { target: { files: [new File(["x"], "front.png", { type: "image/png" })] } });
    fireEvent.change(screen.getByLabelText("Height in centimeters"), { target: { value: "177" } });
    fireEvent.click(screen.getByRole("button", { name: "Extract measurements" }));
    expect(screen.getByRole("alert")).toHaveTextContent(/AI could not detect a full body/);
    expect(screen.getByText(/Reference: trace-123/)).toBeInTheDocument();
  });

  it("allows only safe internal customer return routes", () => {
    expect(getSafeCustomerReturnRoute("/customer/try-on")).toBe("/customer/try-on");
    expect(getSafeCustomerReturnRoute("https://evil.example/customer/avatar")).toBe("/customer/avatar");
    expect(getSafeCustomerReturnRoute("/retailer")).toBe("/customer/avatar");
  });
});
