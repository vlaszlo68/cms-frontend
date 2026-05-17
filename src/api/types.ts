/**
 * Error payload returned by the backend when an API request fails.
 */
export type ApiError = {
  code: string;
  message: string;
};

/**
 * Successful API envelope used by backend endpoints.
 */
export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

/**
 * Failed API envelope used by backend endpoints.
 */
export type ApiErrorResponse = {
  success: false;
  error: ApiError;
};

/**
 * Common API response shape shared by successful and failed requests.
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
