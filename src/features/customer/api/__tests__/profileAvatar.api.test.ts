import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/axios", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/features/customer/api/customerApiUtils", () => ({
  unwrapCustomerApiData: <T>(data: T) => data,
}));

import { apiClient } from "@/lib/axios";
import { avatarApi } from "@/features/customer/api/profileAvatar.api";

const mockGet = apiClient.get as ReturnType<typeof vi.fn>;
const mockPost = apiClient.post as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("avatarApi normalization", () => {
  it("maps sourceImageUrl from backend response", async () => {
    mockGet.mockResolvedValue({
      data: {
        id: "av1",
        customerId: "c1",
        heightCm: 175,
        avatar3dModelUrl: null,
        sourceImageUrl: "https://cdn.example.test/source.jpg",
      },
    });
    const avatar = await avatarApi.getAvatar("c1");
    expect(avatar?.sourceImageUrl).toBe("https://cdn.example.test/source.jpg");
  });

  it("infers has2DCapability from sourceImageUrl when backend omits the flag", async () => {
    mockGet.mockResolvedValue({
      data: {
        id: "av1",
        customerId: "c1",
        heightCm: 175,
        avatar3dModelUrl: null,
        sourceImageUrl: "https://cdn.example.test/source.jpg",
      },
    });
    const avatar = await avatarApi.getAvatar("c1");
    expect(avatar?.has2DCapability).toBe(true);
    expect(avatar?.has3DCapability).toBe(false);
  });

  it("infers has2DCapability from avatarFrontImageUrl when sourceImageUrl is absent", async () => {
    mockGet.mockResolvedValue({
      data: {
        id: "av1",
        customerId: "c1",
        heightCm: 175,
        avatar3dModelUrl: null,
        avatarFrontImageUrl: "https://cdn.example.test/front.jpg",
      },
    });
    const avatar = await avatarApi.getAvatar("c1");
    expect(avatar?.has2DCapability).toBe(true);
  });

  it("infers has3DCapability from avatar3dModelUrl when backend omits the flag", async () => {
    mockGet.mockResolvedValue({
      data: {
        id: "av1",
        customerId: "c1",
        heightCm: 175,
        avatar3dModelUrl: "https://cdn.example.test/avatar.glb",
      },
    });
    const avatar = await avatarApi.getAvatar("c1");
    expect(avatar?.has3DCapability).toBe(true);
    expect(avatar?.has2DCapability).toBe(false);
  });

  it("prefers explicit has2DCapability/has3DCapability flags over inferred values", async () => {
    mockGet.mockResolvedValue({
      data: {
        id: "av1",
        customerId: "c1",
        heightCm: 175,
        avatar3dModelUrl: null,
        sourceImageUrl: null,
        has2DCapability: true,
        has3DCapability: true,
      },
    });
    const avatar = await avatarApi.getAvatar("c1");
    expect(avatar?.has2DCapability).toBe(true);
    expect(avatar?.has3DCapability).toBe(true);
  });

  it("returns null for 404 responses", async () => {
    const err = Object.assign(new Error("Not found"), {
      isAxiosError: true,
      response: { status: 404 },
    });
    mockGet.mockRejectedValue(err);
    const avatar = await avatarApi.getAvatar("c1");
    expect(avatar).toBeNull();
  });

  it("repairSourceImage calls the repair endpoint with avatarId", async () => {
    mockPost.mockResolvedValue({
      data: {
        id: "av1",
        customerId: "c1",
        heightCm: 175,
        avatar3dModelUrl: null,
        sourceImageUrl: "https://cdn.example.test/repaired.jpg",
        has2DCapability: true,
        has3DCapability: false,
      },
    });
    const result = await avatarApi.repairSourceImage("c1", "av1");
    expect(mockPost).toHaveBeenCalledWith(
      "/api/customers/c1/avatar/repair-source-image",
      { avatarId: "av1" },
    );
    expect(result?.sourceImageUrl).toBe("https://cdn.example.test/repaired.jpg");
    expect(result?.has2DCapability).toBe(true);
  });
});
