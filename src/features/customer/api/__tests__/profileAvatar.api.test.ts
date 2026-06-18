import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildAvatarImageExtractionFormData } from "@/features/customer/types/profileAvatar";

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

describe("buildAvatarImageExtractionFormData", () => {
  const makeFile = (name: string) => new File(["data"], name, { type: "image/jpeg" });

  it("uses camelCase backend field names (frontImageFile / sideImageFile / heightCm)", () => {
    const fd = buildAvatarImageExtractionFormData({
      frontImageFile: makeFile("front.jpg"),
      sideImageFile: makeFile("side.jpg"),
      heightCm: 175,
    });
    expect(fd.get("frontImageFile")).toBeInstanceOf(File);
    expect(fd.get("sideImageFile")).toBeInstanceOf(File);
    expect(fd.get("heightCm")).toBe("175");
  });

  it("does not contain PascalCase legacy keys", () => {
    const fd = buildAvatarImageExtractionFormData({
      frontImageFile: makeFile("front.jpg"),
      sideImageFile: makeFile("side.jpg"),
      heightCm: 175,
    });
    expect(fd.get("FrontImageFile")).toBeNull();
    expect(fd.get("SideImageFile")).toBeNull();
    expect(fd.get("HeightCm")).toBeNull();
  });

  it("returns a FormData instance, not JSON", () => {
    const fd = buildAvatarImageExtractionFormData({
      frontImageFile: makeFile("front.jpg"),
      sideImageFile: makeFile("side.jpg"),
      heightCm: 170,
    });
    expect(fd).toBeInstanceOf(FormData);
  });
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

  it("extractFromImage sends a FormData instance (not plain JSON)", async () => {
    mockPost.mockResolvedValue({
      data: {
        id: "av1",
        customerId: "c1",
        heightCm: 175,
        avatar3dModelUrl: null,
        sourceImageUrl: "https://cdn.example.test/source.jpg",
        has2DCapability: true,
        has3DCapability: false,
      },
    });
    const frontFile = new File(["data"], "front.jpg", { type: "image/jpeg" });
    const sideFile = new File(["data"], "side.jpg", { type: "image/jpeg" });
    await avatarApi.extractFromImage("c1", { frontImageFile: frontFile, sideImageFile: sideFile, heightCm: 175 });
    const [url, body, opts] = mockPost.mock.calls[0] as [string, unknown, unknown];
    expect(url).toBe("/api/customers/c1/avatar/extract-from-image");
    expect(body).toBeInstanceOf(FormData);
    expect((opts as { timeout: number }).timeout).toBe(240_000);
  });

  it("repairSourceImage sends multipart/form-data with FrontImageFile and RetryGenerate3D (PascalCase)", async () => {
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
    const frontFile = new File(["data"], "front.jpg", { type: "image/jpeg" });
    const result = await avatarApi.repairSourceImage("c1", { frontImageFile: frontFile, retryGenerate3D: true });

    const [url, body] = mockPost.mock.calls[0] as [string, unknown, unknown];
    expect(url).toBe("/api/customers/c1/avatar/repair-source-image");
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get("FrontImageFile")).toBeInstanceOf(File);
    expect((body as FormData).get("RetryGenerate3D")).toBe("true");
    expect(result.sourceImageUrl).toBe("https://cdn.example.test/repaired.jpg");
    expect(result.has2DCapability).toBe(true);
  });

  it("repairSourceImage does not send avatarId", async () => {
    mockPost.mockResolvedValue({
      data: { id: "av1", customerId: "c1", heightCm: 175, avatar3dModelUrl: null, sourceImageUrl: "https://cdn.example.test/repaired.jpg", has2DCapability: true, has3DCapability: false },
    });
    const frontFile = new File(["data"], "front.jpg", { type: "image/jpeg" });
    await avatarApi.repairSourceImage("c1", { frontImageFile: frontFile });
    const [, body] = mockPost.mock.calls[0] as [string, FormData, unknown];
    expect(body.get("avatarId")).toBeNull();
    expect(body.get("AvatarId")).toBeNull();
  });

  it("repairSourceImage defaults RetryGenerate3D to true when omitted", async () => {
    mockPost.mockResolvedValue({
      data: { id: "av1", customerId: "c1", heightCm: 175, avatar3dModelUrl: null, sourceImageUrl: "https://cdn.example.test/repaired.jpg", has2DCapability: true, has3DCapability: false },
    });
    const frontFile = new File(["data"], "front.jpg", { type: "image/jpeg" });
    await avatarApi.repairSourceImage("c1", { frontImageFile: frontFile });
    const [, body] = mockPost.mock.calls[0] as [string, FormData, unknown];
    expect((body as FormData).get("RetryGenerate3D")).toBe("true");
  });
});
