import { ReadDocumentation, type CentrifugoChannel } from '@donation-alerts/common';
import { type Subscription } from 'centrifuge';
import { type UserEventsClient } from './user-events-client';

/**
 * Listener for subscription-based events in Centrifugo channels.
 *
 * @remarks
 * This class represents a connection to a specific Centrifugo channel associated with a user.
 * It handles event subscriptions and provides information about the connected channel and user.
 * You can use it to manage events and to remove the associated listener when it's no longer needed.
 *
 * @example
 * ```ts
 * console.log(listener.channel); // Full channel name
 * console.log(listener.userId); // User's ID
 *
 * await listener.remove(); // Removes the listener
 * ```
 */
@ReadDocumentation('events')
export class EventsListener {
	private readonly _channelName: CentrifugoChannel;
	private readonly _userId: number;
	private readonly _centrifugoSubscription: Subscription;
	private readonly _client: UserEventsClient;

	/** @internal */
	constructor(channelName: CentrifugoChannel, userId: number, subscription: Subscription, client: UserEventsClient) {
		this._channelName = channelName;
		this._userId = userId;
		this._centrifugoSubscription = subscription;
		this._client = client;
	}

	/**
	 * ID of the user associated with this listener.
	 */
	get userId(): number {
		return this._userId;
	}

	/**
	 * Name of the Centrifugo channel associated with this listener.
	 */
	get channelName(): string {
		return this._channelName;
	}

	/**
	 * Full name of the Centrifugo channel.
	 *
	 * @remarks
	 * Combines the base channel name and the user ID to construct the complete channel string.
	 */
	get channel(): string {
		return this._centrifugoSubscription.channel;
	}

	/** @internal */
	get _subscription(): Subscription {
		return this._centrifugoSubscription;
	}

	/**
	 * Removes this listener from the client.
	 */
	async remove(): Promise<void> {
		await this._client.removeEventsListener(this);
	}
}
