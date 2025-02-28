/**
 * Represents a valid scope for the Donation Alerts API.
 *
 * @remarks
 * Scopes define the permissions granted to an application using the Donation Alerts API.
 * Each scope enables specific actions or access to certain data through the API.
 *
 * Scopes are requested during OAuth authorization and determine what parts of a user's data
 * or API functionality the application can access. Users must grant these scopes explicitly.
 *
 * Available Scopes:
 * - `oauth-user-show`: Access user profile information.
 * - `oauth-donation-index`: Access donation history.
 * - `oauth-custom_alert-store`: Send custom alerts.
 * - `oauth-donation-subscribe`: Subscribe to real-time donation events.
 * - `oauth-goal-subscribe`: Subscribe to real-time updates for goals.
 * - `oauth-poll-subscribe`: Subscribe to real-time updates for polls.
 */
export type DonationAlertsApiScope =
	| 'oauth-user-show'
	| 'oauth-donation-index'
	| 'oauth-custom_alert-store'
	| 'oauth-donation-subscribe'
	| 'oauth-goal-subscribe'
	| 'oauth-poll-subscribe';
