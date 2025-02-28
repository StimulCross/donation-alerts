import { DataObject, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';

/** @internal */
export interface DonationAlertsUserData {
	id: number;
	code: string;
	name: string;
	avatar: string;
	email: string;
	socket_connection_token: string;
}

/**
 * Represents user profile information.
 *
 * @remarks
 * This class provides access to user-related profile data, including unique identifiers,
 * display names, email addresses, and authentication tokens for Centrifugo connections.
 */
@ReadDocumentation('api')
export class DonationAlertsUser extends DataObject<DonationAlertsUserData> {
	/**
	 * The unique and unchangeable user identifier.
	 *
	 * @returns The user ID as a number.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * The unique textual code (username) for the user.
	 *
	 * @returns The user's unique code as a string.
	 */
	get code(): string {
		return this[rawDataSymbol].code;
	}

	/**
	 * The unique displayed username.
	 *
	 * @remarks
	 * This name is used for display purposes on the platform and can be updated by the user.
	 *
	 * @returns The display name as a string.
	 */
	get name(): string {
		return this[rawDataSymbol].name;
	}

	/**
	 * The URL to the personal profile picture.
	 *
	 * @returns The URL to the user's avatar as a string.
	 */
	get avatar(): string {
		return this[rawDataSymbol].avatar;
	}

	/**
	 * The email associated with the user's account.
	 *
	 * @returns The user's email as a string.
	 */
	get email(): string {
		return this[rawDataSymbol].email;
	}

	/**
	 * Centrifugo connection token.
	 *
	 * @remarks
	 * A token issued to the user for establishing websocket connections via Centrifugo.
	 *
	 * @returns The Centrifugo connection token as a string.
	 */
	get socketConnectionToken(): string {
		return this[rawDataSymbol].socket_connection_token;
	}
}
