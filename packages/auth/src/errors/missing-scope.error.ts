import { CustomError } from '@donation-alerts/common';

/**
 * An error indicating that a token does not include the requested scope.
 */
export class MissingScopeError extends CustomError {}
