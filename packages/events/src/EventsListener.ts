import { Subscription } from 'centrifuge';
import { ReadDocumentation, CentrifugoChannel } from '@donation-alerts/common';
import { UserEventsClient } from './UserEventsClient';

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
	 * The user ID part of the full channel name.
	 */
	get userId(): number {
		return this._userId;
	}

	/**
	 * The channel name part of the full channel name.
	 */
	get channelName(): string {
		return this._channelName;
	}

	/**
	 * The full channel name with user ID.
	 */
	get channel(): string {
		return this._centrifugoSubscription.channel;
	}

	/** @internal */
	get _subscription(): Subscription {
		return this._centrifugoSubscription;
	}

	/**
	 * Removes the listener.
	 */
	async remove(): Promise<void> {
		await this._client.removeEventsListener(this);
	}
}
