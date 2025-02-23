import { CustomError } from '@donation-alerts/common';

/**
 * An error indicating the token is invalid.
 *
 * This may relate to access tokens, refresh tokens, or other token-related data.
 */
export class InvalidTokenError extends CustomError {}
