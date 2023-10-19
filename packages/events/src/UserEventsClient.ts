import { type ApiClient } from '@donation-alerts/api';
import {
	extractUserId,
	ReadDocumentation,
	type CentrifugoChannel,
	type UserIdResolvable
} from '@donation-alerts/common';
import { createLogger, LogLevel, type LoggerOptions, type Logger } from '@stimulcross/logger';
import { nonenumerable } from '@stimulcross/shared-utils';
import { type PublicationContext } from 'centrifuge';
import { EventEmitter } from 'typed-event-emitter';
import { BasicEventsClient } from './BasicEventsClient';
import {
	DonationAlertsDonationEvent,
	type DonationAlertsDonationEventData
} from './events/donations/DonationAlertsDonationEvent';
import {
	DonationAlertsGoalUpdateEvent,
	type DonationAlertsGoalUpdateEventData
} from './events/goals/DonationAlertsGoalUpdateEvent';
import {
	DonationAlertsPollUpdateEvent,
	type DonationAlertsPollUpdateEventData
} from './events/polls/DonationAlertsPollUpdateEvent';
import { EventsListener } from './EventsListener';
import { transformChannel } from './helpers/transformChannel';

/**
 * Configuration for {@link UserEventsClient}.
 */
export interface UserEventsClientConfig {
	user: UserIdResolvable;
	apiClient: ApiClient;
	logger?: LoggerOptions;
}

/**
 * Single user client to listen to Donation Alerts events.
 */
@ReadDocumentation('events')
export class UserEventsClient extends EventEmitter {
	@nonenumerable private readonly _logger: Logger;
	@nonenumerable private readonly _userId: number;
	@nonenumerable private readonly _basicEventsClient: BasicEventsClient;
	@nonenumerable private readonly _listeners: Map<string, EventsListener> = new Map();

	/**
	 * Fires when the client establishes connection with Centrifugo server.
	 */
	readonly onConnect = this.registerEvent();

	/**
	 * Fires when the client disconnects from the Centrifugo server.
	 */
	readonly onDisconnect = this.registerEvent<[reason: string, reconnect: boolean]>();

	/**
	 * Creates Donation Alerts Events client that allows listen to the various events.
	 *
	 * @param config Configuration for single user `EventsClient`.
	 */
	constructor(config: UserEventsClientConfig) {
		super();

		this._logger = createLogger({ context: 'da:events', minLevel: LogLevel.SUCCESS, ...config.logger });

		this._basicEventsClient = new BasicEventsClient({
			logger: this._logger,
			user: config.user,
			apiClient: config.apiClient
		});

		this._basicEventsClient.onConnect(() => this.emit(this.onConnect));
		this._basicEventsClient.onDisconnect((reason: string, reconnect: boolean) =>
			this.emit(this.onDisconnect, reason, reconnect)
		);

		this._userId = extractUserId(config.user);
	}

	/**
	 * The ID of the user the events client belongs to.
	 */
	get userId(): number {
		return this._userId;
	}

	/**
	 * Checks whether the client is currently connected to the server.
	 */
	get isConnected(): boolean {
		return this._basicEventsClient.isConnected;
	}

	/**
	 * Connects to the Donation Alerts Centrifugo WebSocket server and subscribes to the topics.
	 *
	 * @param restoreExistingListeners Whether to restore previously registered listeners on connect. Default is `true`.
	 */
	async connect(restoreExistingListeners: boolean = true): Promise<void> {
		for (const [, listener] of this._listeners) {
			if (restoreExistingListeners) {
				this._logger.info(`Restoring previously registered listeners for user ${this._userId}...`);
				listener._subscription.subscribe();
			} else {
				this._logger.info(`Removing previously registered listeners for user ${this._userId}...`);
				await listener.remove();
			}
		}

		await this._basicEventsClient.connect();
	}

	/**
	 * Disconnects from the Donation Alerts Centrifugo WebSocket server.
	 *
	 * @param removeListeners Whether to remove all active listeners on disconnect. If you don't remove them,
	 * the client will try to restore them on the next connection. Default is `false`.
	 */
	async disconnect(removeListeners: boolean = false): Promise<void> {
		if (removeListeners) {
			this._logger.info(`Removing listeners for user ${this._userId}...`);

			for (const [, listener] of this._listeners) {
				await this.removeEventsListener(listener);
			}
		}

		await this._basicEventsClient.disconnect();
	}

	/**
	 * Reconnects to the Donation Alerts Centrifugo WebSocket server.
	 *
	 * @param removeListeners Whether to remove all listeners on reconnect. If the listeners won't be removed,
	 * the client will restore all listeners on reconnect. Defaults to `false`.
	 */
	async reconnect(removeListeners: boolean = false): Promise<void> {
		await this.disconnect(removeListeners);
		await this.connect(!removeListeners);
	}

	/**
	 * Subscribes to Donation Alerts donation events.
	 *
	 * @param callback A function to be called when a donation event is sent to the user.
	 */
	async onDonation(callback: (event: DonationAlertsDonationEvent) => void): Promise<EventsListener> {
		return await this._createListener<DonationAlertsDonationEventData, DonationAlertsDonationEvent>(
			'$alerts:donation',
			DonationAlertsDonationEvent,
			callback
		);
	}

	/**
	 * Subscribes to Donation Alerts goal update events.
	 *
	 * @param callback A function to be called when a goal update event is sent to the user.
	 */
	async onGoalUpdate(callback: (event: DonationAlertsGoalUpdateEvent) => void): Promise<EventsListener> {
		return await this._createListener<DonationAlertsGoalUpdateEventData, DonationAlertsGoalUpdateEvent>(
			'$goals:goal',
			DonationAlertsGoalUpdateEvent,
			callback
		);
	}

	/**
	 * Subscribes to Donation Alerts poll update events.
	 *
	 * @param callback A function to be called when a poll update event is sent to the user.
	 */
	async onPollUpdate(callback: (event: DonationAlertsPollUpdateEvent) => void): Promise<EventsListener> {
		return await this._createListener<DonationAlertsPollUpdateEventData, DonationAlertsPollUpdateEvent>(
			'$polls:poll',
			DonationAlertsPollUpdateEvent,
			callback
		);
	}

	/**
	 * Unsubscribes from a channel and removes its listener.
	 *
	 * @param listener The listener to remove.
	 */
	async removeEventsListener(listener: EventsListener): Promise<void> {
		if (this._listeners.has(listener.channelName)) {
			const existingListener = this._listeners.get(listener.channelName)!;
			this._basicEventsClient.unsubscribe(existingListener._subscription);

			this._listeners.delete(listener.channelName);

			if (this._listeners.size === 0) {
				await this._basicEventsClient.disconnect();
			}
		}
	}

	private async _createListener<D, T>(
		channel: CentrifugoChannel,
		evt: new (data: D) => T,
		callback: (event: T) => void
	): Promise<EventsListener> {
		await this._basicEventsClient.connect();

		const subscription = this._basicEventsClient.subscribe(transformChannel(channel, this._userId));

		subscription.on('publish', (ctx: PublicationContext) => {
			this._logger.debug(`[PUBLISH] (${channel as string}_${this._userId})`, ctx);

			try {
				return callback(new evt(ctx.data));
			} catch (e) {
				this._logger.error(e);
			}
		});

		const listener = new EventsListener(channel, this._userId, subscription, this);
		this._listeners.set(channel, listener);

		return listener;
	}
}
