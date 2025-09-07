/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as alerts from "../alerts.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as inductionDecisions from "../inductionDecisions.js";
import type * as ml from "../ml.js";
import type * as seedData from "../seedData.js";
import type * as trainsets from "../trainsets.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  alerts: typeof alerts;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  http: typeof http;
  inductionDecisions: typeof inductionDecisions;
  ml: typeof ml;
  seedData: typeof seedData;
  trainsets: typeof trainsets;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
