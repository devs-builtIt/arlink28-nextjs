// Types for the C# API (arlink28-api repo). Type-only: import with `import type`.
//
// Everything here is generated from openapi.json (`pnpm generate`; refresh the
// snapshot from a running API with `pnpm sync`). The aliases below just give
// the schemas the web app uses short names.
import type { components, paths } from "./schema";

export type { components, paths };

type Schemas = components["schemas"];

/** JSON request body of an operation, e.g. RequestBody<"/api/v1/auth/login", "post">. */
export type RequestBody<P extends keyof paths, M extends keyof paths[P]> = paths[P][M] extends {
  requestBody?: { content: { "application/json": infer B } };
}
  ? B
  : never;

export type StaffRoleName = Schemas["StaffRole"];

export type LoginRequest = Schemas["LoginRequest"];
export type ChangePasswordRequest = Schemas["ChangePasswordRequest"];
export type ResetPasswordRequest = Schemas["ResetPasswordRequest"];
export type ConfirmResetPasswordRequest = Schemas["ConfirmResetPasswordRequest"];
export type AcceptInviteRequest = Schemas["AcceptInviteRequest"];
export type InviteUserRequest = Schemas["InviteUserRequest"];
export type AssignRoleRequest = Schemas["AssignRoleRequest"];

export type AuthResponse = Schemas["AuthResponse"];
export type MeResponse = Schemas["MeResponse"];
export type UserResponse = Schemas["UserResponse"];

export type DestinationResponse = Schemas["DestinationResponse"];
export type DestinationDetail = Schemas["DestinationDetailResponse"];
export type Attraction = Schemas["AttractionResponse"];
export type PackageCard = Schemas["PackageCardResponse"];
export type PackageList = Schemas["PackageListResponse"];
export type PackageDetail = Schemas["PackageDetailResponse"];
export type PackageFeature = Schemas["FeatureResponse"];
export type PackageAddOn = Schemas["AddOnResponse"];
export type SeasonRate = Schemas["SeasonRateResponse"];
export type Quote = Schemas["QuoteResponse"];
export type PackageMedia = Schemas["MediaResponse"];

export type AdminPackageSummary = Schemas["AdminPackageSummary"];
export type AdminPackageList = Schemas["AdminPackageListResponse"];
export type AdminPackageDetail = Schemas["AdminPackageDetail"];
export type CreatePackageRequest = Schemas["CreatePackageRequest"];
export type UpdatePackageRequest = Schemas["UpdatePackageRequest"];
export type UpdateMediaRequest = Schemas["UpdateMediaRequest"];
export type AdminStay = Schemas["AdminStay"];
export type AdminFeature = Schemas["AdminFeature"];
export type AdminRate = Schemas["AdminRate"];
export type AdminAddOn = Schemas["AdminAddOn"];
export type AdminReference = Schemas["AdminReferenceResponse"];
export type PropertyOption = Schemas["PropertyOption"];
export type SeasonOption = Schemas["SeasonOption"];
export type FeatureOption = Schemas["FeatureOption"];
export type StayInput = Schemas["StayInput"];
export type FeatureInput = Schemas["FeatureInput"];
export type RateInput = Schemas["RateInput"];
export type AddOnInput = Schemas["AddOnInput"];

export type EnquiryType = Schemas["EnquiryType"];
export type EnquiryStatus = Schemas["EnquiryStatus"];
export type CreateEnquiryRequest = Schemas["CreateEnquiryRequest"];
export type CreateEnquiryResponse = Schemas["CreateEnquiryResponse"];
export type EnquiryListItem = Schemas["EnquiryListItem"];
export type EnquiryList = Schemas["EnquiryListResponse"];
export type EnquiryStatusCounts = Schemas["EnquiryStatusCounts"];
export type EnquiryDetail = Schemas["EnquiryDetail"];
export type UpdateEnquiryRequest = Schemas["UpdateEnquiryRequest"];

/** Query for GET /api/v1/packages (the public list: published packages only). */
export type PackageListQuery = NonNullable<paths["/api/v1/packages"]["get"]["parameters"]["query"]>;

/**
 * Every API error: RFC 9457 Problem Details plus the API's extensions. `code`
 * is stable (e.g. UNAUTHENTICATED, VALIDATION_FAILED, NO_RATE_FOR_DATE), so
 * switch on it, never on `detail`. `errors` is set on validation failures.
 */
export type ApiProblem = Schemas["ProblemDetails"] & {
  code?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};
