import { DataObject, mapNullable, rawDataSymbol, ReadDocumentation } from '@donation-alerts/common';

/** @internal */
export interface DonationAlertsCustomAlertData {
	id: number;
	external_id: string | null;
	header: string | null;
	message: string | null;
	image_url: string | null;
	sound_url: string | null;
	is_shown: 0 | 1;
	created_at: string;
	shown_at: string | null;
}

/**
 * Represents a Donation Alerts custom alert as a plain JavaScript object.
 */
export interface DonationAlertsCustomAlertJson {
	id: number;
	externalId: string | null;
	header: string | null;
	message: string | null;
	imageUrl: string | null;
	soundUrl: string | null;
	isShown: boolean;
	creationDate: Date;
	showDate: Date | null;
}

/**
 * Represents a Donation Alerts custom alert object.
 *
 * @remarks
 * A custom alert is a user-defined alert, which can include custom headers, messages, images, and sounds.
 * These alerts are shown in the streamer's widget when triggered.
 */
@ReadDocumentation('api')
export class DonationAlertsCustomAlert extends DataObject<
	DonationAlertsCustomAlertData,
	DonationAlertsCustomAlertJson
> {
	/**
	 * The unique custom alert identifier.
	 */
	public get id(): number {
		return this[rawDataSymbol].id;
	}

	/**
	 * The developer-provided unique identifier for the alert, or `null` if none was set.
	 *
	 * @remarks
	 * This value can be used to track or manage custom alerts within external systems.
	 */
	public get externalId(): string | null {
		return this[rawDataSymbol].external_id;
	}

	/**
	 * The header text of the custom alert, or `null` if no header was set.
	 */
	public get header(): string | null {
		return this[rawDataSymbol].header;
	}

	/**
	 * The message text of the custom alert, or `null` if no message was set.
	 */
	public get message(): string | null {
		return this[rawDataSymbol].message;
	}

	/**
	 * The URL of the image to be displayed with the custom alert, or `null` if no URL was set.
	 */
	public get imageUrl(): string | null {
		return this[rawDataSymbol].image_url;
	}

	/**
	 * The URL of the sound file to be played when the custom alert is shown, or `null` if no URL was set.
	 */
	public get soundUrl(): string | null {
		return this[rawDataSymbol].sound_url;
	}

	/**
	 * Indicates whether the alert has been shown in the streamer's widget.
	 */
	public get isShown(): boolean {
		return this[rawDataSymbol].is_shown === 1;
	}

	/**
	 * The date and time when the custom alert was created.
	 */
	public get creationDate(): Date {
		return new Date(this[rawDataSymbol].created_at);
	}

	/**
	 * The date and time when the custom alert was shown, or `null` if the alert has not yet been shown.
	 */
	public get showDate(): Date | null {
		return mapNullable(this[rawDataSymbol].shown_at, (v: string) => new Date(v));
	}

	public override toJSON(): DonationAlertsCustomAlertJson {
		return {
			id: this.id,
			externalId: this.externalId,
			header: this.header,
			message: this.message,
			imageUrl: this.imageUrl,
			soundUrl: this.soundUrl,
			isShown: this.isShown,
			creationDate: this.creationDate,
			showDate: this.showDate,
		};
	}
}
