import { z } from "zod";

export type CustomerAddressType = "shipping" | "billing" | "both";

export interface CustomerAccountProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  age?: number | null;
  gender?: "Male" | "Female" | string | null;
}

export interface UpdateCustomerProfilePayload {
  fullName: string;
  phoneNumber?: string | null;
  age?: number | null;
  gender?: string | null;
}

export interface ChangeCustomerPasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface DeleteCustomerAccountPayload {
  password: string;
  reason?: string | null;
}

export interface CustomerAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  line1: string;
  line2?: string | null;
  city: string;
  state?: string | null;
  postalCode: string;
  country: string;
  type?: CustomerAddressType;
  isDefault: boolean;
}

export type CustomerAddressPayload = Omit<CustomerAddress, "id" | "isDefault"> & {
  isDefault?: boolean;
};

export const measurementFieldConfigs = [
  { key: "heightCm", label: "Height", unit: "cm", required: true, min: 1, max: 300 },
  { key: "weightKg", label: "Weight", unit: "kg", required: true, min: 1, max: 400 },
  { key: "chestCm", label: "Chest", unit: "cm", required: false, min: 1, max: 250 },
  { key: "waistCm", label: "Waist", unit: "cm", required: false, min: 1, max: 250 },
  { key: "hipsCm", label: "Hips", unit: "cm", required: false, min: 1, max: 250 },
  { key: "shoulderCm", label: "Shoulder", unit: "cm", required: false, min: 1, max: 200 },
  { key: "inseamCm", label: "Inseam", unit: "cm", required: false, min: 1, max: 200 },
  { key: "neckCm", label: "Neck", unit: "cm", required: false, min: 1, max: 100 },
  { key: "armLengthCm", label: "Arm length", unit: "cm", required: false, min: 1, max: 150 },
  { key: "shoeSizeEu", label: "Shoe size (EU)", unit: "EU", required: false, min: 20, max: 60 },
] as const;

export const BODY_SHAPE_OPTIONS = ["Rectangle", "Triangle", "InvertedTriangle", "Hourglass", "Apple", "Pear"] as const;
export type BodyShape = (typeof BODY_SHAPE_OPTIONS)[number];

export type MeasurementFieldKey = (typeof measurementFieldConfigs)[number]["key"];
export type BodyMeasurements = Partial<Record<MeasurementFieldKey, number | null>> & {
  heightCm: number | null;
  weightKg?: number | null;
  bodyShape?: BodyShape | string | null;
};
export type ManualMeasurementsInput = Partial<Record<MeasurementFieldKey, number | null>> & {
  heightCm: number;
  weightKg: number;
};

const optionalMeasurement = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.number().min(1).max(400).nullable(),
);

export const manualMeasurementSchema = z.object({
  heightCm: z.number().min(1).max(300),
  weightKg: z.number().min(1).max(400),
  chestCm: optionalMeasurement.optional(),
  waistCm: optionalMeasurement.optional(),
  hipsCm: optionalMeasurement.optional(),
  shoulderCm: optionalMeasurement.optional(),
  inseamCm: optionalMeasurement.optional(),
  neckCm: optionalMeasurement.optional(),
  armLengthCm: optionalMeasurement.optional(),
  shoeSizeEu: optionalMeasurement.optional(),
  bodyShape: z.enum(BODY_SHAPE_OPTIONS).nullable().optional(),
});

export interface CustomerAvatar {
  id: string;
  customerId: string;
  measurements: BodyMeasurements;
  avatar3dModelUrl: string | null;
  avatarFrontImageUrl?: string | null;
  avatarSideImageUrl?: string | null;
  avatar2dImageUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MeasurementHistoryEntry {
  id: string;
  measurements: BodyMeasurements;
  source: "Manual" | "BodyScan" | "AIEstimate" | string;
  createdAt: string;
}

export interface SizeRecommendation {
  productId?: string;
  recommendedSize: string | null;
  confidenceScore?: number | null;
  justification?: string | null;
  confidence?: number | null;
  reason?: string | null;
}

export interface ExtractAvatarFromImageInput {
  frontImageFile: File;
  sideImageFile: File;
  heightCm: number;
}

export const MAX_AVATAR_IMAGE_BYTES = 10 * 1024 * 1024;
export const AVATAR_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

export const mapManualMeasurementsToPayload = (input: ManualMeasurementsInput & { bodyShape?: BodyShape | string | null }): BodyMeasurements => {
  const payload = measurementFieldConfigs.reduce((acc, field) => {
    const value = input[field.key];
    acc[field.key] = value === undefined ? null : value;
    return acc;
  }, {} as BodyMeasurements);
  payload.bodyShape = input.bodyShape ?? null;
  return payload;
};

export const normalizeNullableMeasurements = (
  measurements: Partial<Record<MeasurementFieldKey, number | null | undefined>> & { bodyShape?: BodyShape | string | null },
): BodyMeasurements => {
  const normalized = measurementFieldConfigs.reduce((acc, field) => {
    acc[field.key] = measurements[field.key] ?? null;
    return acc;
  }, {} as BodyMeasurements);
  normalized.bodyShape = measurements.bodyShape ?? null;
  return normalized;
};

export const formatNullableMeasurement = (value: number | null | undefined): string =>
  value == null ? "—" : String(value);

export const validateAvatarImageFile = (file: File): void => {
  if (![...AVATAR_IMAGE_TYPES].includes(file.type as (typeof AVATAR_IMAGE_TYPES)[number])) {
    throw new Error("Avatar photo must be a JPEG or PNG image");
  }
  if (file.size === 0) {
    throw new Error("Avatar photo must not be empty");
  }
  if (file.size > MAX_AVATAR_IMAGE_BYTES) {
    throw new Error("Avatar photo must be 10 MB or smaller");
  }
};

export const buildAvatarImageExtractionFormData = ({ frontImageFile, sideImageFile, heightCm }: ExtractAvatarFromImageInput): FormData => {
  validateAvatarImageFile(frontImageFile);
  validateAvatarImageFile(sideImageFile);
  if (!Number.isFinite(heightCm) || heightCm < 1 || heightCm > 300) {
    throw new Error("Height in centimeters is required");
  }
  const formData = new FormData();
  formData.append("FrontImageFile", frontImageFile);
  formData.append("SideImageFile", sideImageFile);
  formData.append("HeightCm", String(heightCm));
  return formData;
};
