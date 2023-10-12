import { CustomError } from '@donation-alerts/common';

/**
 * An error indicating that managed user is not registered in the authentication provider.
 */
export class UnregisteredUserError extends CustomError {}
