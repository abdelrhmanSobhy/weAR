import { describe, expect, it } from "vitest";
import { buildAvatarImageExtractionFormData, formatNullableMeasurement, manualMeasurementSchema, mapManualMeasurementsToPayload, MAX_AVATAR_IMAGE_BYTES, normalizeNullableMeasurements, validateAvatarImageFile } from "@/features/customer/types/profileAvatar";

const fileOfSize = (type: string, size: number) => new File([new Uint8Array(size)], "avatar", { type });

describe("avatar measurement and photo helpers", () => {
  it("validates manual measurements and maps payloads with nullable fields", () => {
    const parsed = manualMeasurementSchema.parse({ heightCm: 180, weightKg: 75, chestCm: 100 });
    expect(mapManualMeasurementsToPayload(parsed)).toMatchObject({ heightCm: 180, weightKg: 75, chestCm: 100, waistCm: null });
    expect(() => manualMeasurementSchema.parse({ heightCm: 0, weightKg: 75 })).toThrow();
    expect(() => manualMeasurementSchema.parse({ heightCm: 180 })).toThrow();
  });

  it("normalizes and formats nullable measurements", () => {
    expect(normalizeNullableMeasurements({ heightCm: 170, waistCm: undefined })).toMatchObject({ heightCm: 170, waistCm: null });
    expect(formatNullableMeasurement(null)).toBe("—");
    expect(formatNullableMeasurement(42)).toBe("42");
  });

  it("accepts JPEG/PNG and rejects other image types", () => {
    expect(() => validateAvatarImageFile(fileOfSize("image/jpeg", 10))).not.toThrow();
    expect(() => validateAvatarImageFile(fileOfSize("image/png", 10))).not.toThrow();
    expect(() => validateAvatarImageFile(fileOfSize("image/webp", 10))).toThrow(/JPEG or PNG/);
  });

  it("enforces the 5 MB image limit", () => {
    expect(() => validateAvatarImageFile(fileOfSize("image/png", MAX_AVATAR_IMAGE_BYTES + 1))).toThrow(/5 MB/);
  });

  it("rejects empty (zero-byte) images", () => {
    expect(() => validateAvatarImageFile(fileOfSize("image/png", 0))).toThrow(/must not be empty/);
  });

  it("maps and normalizes the new optional fields and body shape", () => {
    const parsed = manualMeasurementSchema.parse({ heightCm: 180, weightKg: 75, neckCm: 38, armLengthCm: 60, shoeSizeEu: 43, bodyShape: "Rectangle" });
    expect(mapManualMeasurementsToPayload(parsed)).toMatchObject({ neckCm: 38, armLengthCm: 60, shoeSizeEu: 43, bodyShape: "Rectangle" });
    expect(normalizeNullableMeasurements({ heightCm: 170, bodyShape: "Pear" })).toMatchObject({ neckCm: null, bodyShape: "Pear" });
  });

  it("requires height and builds FormData fields without headers", () => {
    const imageFile = fileOfSize("image/png", 10);
    expect(() => buildAvatarImageExtractionFormData({ imageFile, heightCm: 0 })).toThrow(/Height/);
    const formData = buildAvatarImageExtractionFormData({ imageFile, heightCm: 177 });
    expect(formData.get("ImageFile")).toBe(imageFile);
    expect(formData.get("HeightCm")).toBe("177");
  });
});
