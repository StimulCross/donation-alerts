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
 */
@ReadDocumentation('api')
export class DonationAlertsUser extends DataObject<DonationAlertsUserData> {
	/**
	 * The unique and unchangeable user identifier.
	 */
	get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * The unique user name.
	 */
	get code(): string {
		return this[rawDataSymbol].code;
	}

	/**
	 * The unique displayed user name.
	 */
	get name(): string {
		return this[rawDataSymbol].name;
	}

	/**
	 * The URL to the personalized graphical illustration.
	 */
	get avatar(): string {
		return this[rawDataSymbol].avatar;
	}

	/**
	 * The email address.
	 */
	get email(): string {
		return this[rawDataSymbol].email;
	}

	/**
	 * Centrifugo connection token.
	 */
	get socketConnectionToken(): string {
		return this[rawDataSymbol].socket_connection_token;
	}
}
