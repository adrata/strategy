import { PipelineData, SellerProfile } from "../types";
import { SellerProfileSchema } from "../types/seller";

export async function defineSellerProfile(
  data: PipelineData,
): Promise<Partial<PipelineData>> {
  // Validate input data
  if (!data.sellerProfile) {
    throw new Error("Seller profile is required");
  }

  // Parse and validate seller profile
  const validatedProfile = SellerProfileSchema.parse(data.sellerProfile);

  // Enrich profile with additional data if needed
  const enrichedProfile: SellerProfile = {
    ...validatedProfile,
    lastUpdated: new Date(),
  };

  return {
    sellerProfile: enrichedProfile,
  };
}
