import { WebSocket } from '@d-fischer/isomorphic-ws';
import { EventEmitter } from '@d-fischer/typed-event-emitter';
import { type ApiClient } from '@donation-alerts/api';
import {
	extractUserId,
	ReadDocumentation,
	type CentrifugoChannel,
	type UserIdResolvable,
} from '@donation-alerts/common';
import { createLogger, LogLevel, type LoggerOptions, type Logger } from '@stimulcross/logger';
import { nonenumerable } from '@stimulcross/shared-utils';
import {
	type JoinLeaveContext,
	type PublicationContext,
	type SubscribeErrorContext,
	type SubscribePrivateContext,
	type SubscribePrivateResponse,
	type SubscribeSuccessContext,
	type Subscription,
	type SubscriptionEvents,
	type UnsubscribeContext,
} from 'centrifuge';
import Centrifuge from 'centrifuge';
import {
	DonationAlertsDonationEvent,
	type DonationAlertsDonationEventData,
} from './events/donations/donation-alerts-donation-event';
import {
	DonationAlertsGoalUpdateEvent,
	type DonationAlertsGoalUpdateEventData,
} from './events/goals/donation-alerts-goal-update-event';
import {
	DonationAlertsPollUpdateEvent,
	type DonationAlertsPollUpdateEventData,
} from './events/polls/donation-alerts-poll-update-event';
import { EventsListener } from './events-listener';
import { transformChannel } from './helpers/transform-channel';

/** @internal */
interface ConnectContext {
	client: string;
	transport: string;
	latency: number;
}

/** @internal */
interface DisconnectContext {
	reason: string;
	reconnect: boolean;
}

/**
 * Configuration for {@link UserEventsClient}.
 *
 * @remarks
 * Defines the settings required to initialize an instance of `UserEventsClient`.
 * Includes user identification, an API client for server interaction, and optional logger options.
 */
export interface UserEventsClientConfig {
	user: UserIdResolvable;
	apiClient: ApiClient;
	logger?: Partial<LoggerOptions>;
}

/**
 * Client for managing and subscribing to Donation Alerts events.
 *
 * This class provides a WebSocket-based interface for real-time interaction with the Donation Alerts platform.
 * It connects to its Centrifugo WebSocket server, enabling receiving notifications
 * about donations, goal updates, and poll updates.
 *
 * Designed for single-user use cases, it supports managing connection states (connect, disconnect, reconnect)
 * and subscribing to or unsubscribing from specific event types.
 */
@ReadDocumentation('events')
export class UserEventsClient extends EventEmitter {
	@nonenumerable private readonly _logger: Logger;
	@nonenumerable private readonly _userId: number;
	@nonenumerable private readonly _apiClient: ApiClient;
	@nonenumerable private readonly _listeners: Map<string, EventsListener> = new Map();
	@nonenumerable private readonly _centrifuge: Centrifuge;
	@nonenumerable private _client: string | null = null;

	private readonly _subscriptionListeners: SubscriptionEvents = {
		subscribe: (ctx: SubscribeSuccessContext) => {
			this._logger.debug(`[USER:${this._userId}] [SUBSCRIBE]`, ctx);
			this._logger.info(
				`[USER:${this._userId}] ${ctx.isResubscribe ? 'Resubscribed' : 'Subscribed'} to ${ctx.channel}`,
			);
		},
		error: (ctx: SubscribeErrorContext) => {
			this._logger.debug(`[USER:${this._userId}] [SUBSCRIBE ERROR]`, ctx);
		},
		unsubscribe: (ctx: UnsubscribeContext) => {
			this._logger.debug(`[UNSUBSCRIBE] [USER:${this._userId}]`, ctx);
			this._logger.info(`[USER:${this._userId}] Unsubscribed from ${ctx.channel}`);
		},
		join: (ctx: JoinLeaveContext) => {
			this._logger.debug(`[USER:${this._userId}] [JOIN]`, ctx);
		},
		leave: (ctx: JoinLeaveContext) => {
			this._logger.debug(`[USER:${this._userId}] [LEAVE]`, ctx);
		},
	};

	/**
	 * Fires when the client establishes a connection with Centrifugo server.
	 */
	readonly onConnect = this.registerEvent();

	/**
	 * Fires when the client disconnects from the Centrifugo server.
	 */
	readonly onDisconnect = this.registerEvent<[reason: string, reconnect: boolean]>();

	/**
	 * Initializes a client for listening to various Donation Alerts events.
	 *
	 * @remarks This client is designed for single-user scenarios, with event subscriptions managed
	 *         through Centrifugo WebSocket connections.
	 *
	 * @param config Configuration required for setting up the client, including user information,
	 *               an API client for server communication, and optional logger options.
	 *
	 */
	constructor(config: UserEventsClientConfig) {
		super();

		this._logger = createLogger({ context: 'da:events', minLevel: LogLevel.SUCCESS, ...config.logger });
		this._userId = extractUserId(config.user);
		this._apiClient = config.apiClient;

		this._centrifuge = new Centrifuge('wss://centrifugo.donationalerts.com/connection/websocket', {
			websocket: WebSocket,
			pingInterval: 15_000,
			ping: true,
			minRetry: 0,
			maxRetry: 30_000,
			onPrivateSubscribe: (
				ctx: SubscribePrivateContext,
				callback: (response: SubscribePrivateResponse) => void,
			): void => {
				this._apiClient.centrifugo
					.subscribeUserToPrivateChannels(
						this._userId,
						ctx.data.client,
						ctx.data.channels as CentrifugoChannel[],
						{ transformChannel: false },
					)
					.then(channels => {
						callback({
							status: 200,
							data: {
								channels: channels.map(channel => ({ channel: channel.channel, token: channel.token })),
							},
						});
					})
					.catch(e => this._logger.error(e));
			},
		});

		this._centrifuge.on('connect', (ctx: ConnectContext) => {
			this._client = ctx.client;
			this._logger.debug(`[USER:${this._userId}] [CONNECT]`, ctx);
			this._logger.info(`[USER:${this._userId}] Connection established to Centrifugo server`);
			this.emit(this.onConnect);
		});

		this._centrifuge.on('disconnect', (ctx: DisconnectContext) => {
			this._logger.debug(`[USER:${this._userId}] [DISCONNECT]`, ctx);
			this.emit(this.onDisconnect, ctx.reason, ctx.reconnect);
		});
	}

	/**
	 * Unique identifier of the user associated with this client.
	 */
	get userId(): number {
		return this._userId;
	}

	/**
	 * Client ID assigned by the Centrifugo server.
	 *
	 * Returns `null` if the client is not connected.
	 */
	get clientId(): string | null {
		return this._client;
	}

	/**
	 * Indicates whether the client is connected to the Centrifugo server.
	 *
	 * @returns `true` if the client is connected; otherwise `false`.
	 */
	get isConnected(): boolean {
		return this._centrifuge.isConnected();
	}

	/**
	 * Establishes a connection to the Centrifugo server.
	 *
	 * @param restoreExistingListeners Specifies whether existing listeners should be restored after connection.
	 *                                 Defaults to `true`.
	 */
	async connect(restoreExistingListeners: boolean = true): Promise<void> {
		for (const [, listener] of this._listeners) {
			if (restoreExistingListeners) {
				this._logger.info(`[USER:${this._userId}] Restoring previously registered listeners...`);
				listener._subscription.subscribe();
			} else {
				this._logger.info(`[USER:${this._userId}] Removing previously registered listeners...`);
				await listener.remove();
			}
		}

		await this._connect();
	}

	/**
	 * Closes the connection to the Centrifugo server.
	 *
	 * @param removeListeners Indicates whether all active listeners should be removed on disconnect.
	 *                        If set to `false`, the listeners will be restored on the next connection.
	 *                        Default to `false`.
	 */
	async disconnect(removeListeners: boolean = false): Promise<void> {
		if (removeListeners) {
			this._logger.info(`[USER:${this._userId}] Removing listeners...`);

			for (const [, listener] of this._listeners) {
				await this.removeEventsListener(listener);
			}
		}

		await this._disconnect();
	}

	/**
	 * Re-establishes the connection to the Centrifugo server.
	 *
	 * @param removeListeners Indicates whether all listeners should be removed during reconnection.
	 *                        If `false`, all listeners will be restored automatically after reconnection.
	 *                        Defaults to `false`.
	 */
	async reconnect(removeListeners: boolean = false): Promise<void> {
		await this.disconnect(removeListeners);
		await this.connect(!removeListeners);
	}

	/**
	 * Subscribes to donation events from Donation Alerts.
	 *
	 * @param callback A function invoked whenever a donation event is received.
	 *                 The callback receives an instance of {@link DonationAlertsDonationEvent}.
	 * @returns An {@link EventsListener} instance that manages the subscription.
	 */
	async onDonation(callback: (event: DonationAlertsDonationEvent) => void): Promise<EventsListener> {
		return await this._createListener<DonationAlertsDonationEventData, DonationAlertsDonationEvent>(
			'$alerts:donation',
			DonationAlertsDonationEvent,
			callback,
		);
	}

	/**
	 * Subscribes to goal update events from Donation Alerts.
	 *
	 * @param callback A function invoked whenever a goal update event is received.
	 *                 The callback receives an instance of {@link DonationAlertsGoalUpdateEvent}.
	 * @returns An {@link EventsListener} instance that manages the subscription.
	 */
	async onGoalUpdate(callback: (event: DonationAlertsGoalUpdateEvent) => void): Promise<EventsListener> {
		return await this._createListener<DonationAlertsGoalUpdateEventData, DonationAlertsGoalUpdateEvent>(
			'$goals:goal',
			DonationAlertsGoalUpdateEvent,
			callback,
		);
	}

	/**
	 * Subscribes to poll update events from Donation Alerts.
	 *
	 * @param callback A function invoked whenever a poll update event is received.
	 *                 The callback receives an instance of {@link DonationAlertsPollUpdateEvent}.
	 * @returns An {@link EventsListener} instance that manages the subscription.
	 */
	async onPollUpdate(callback: (event: DonationAlertsPollUpdateEvent) => void): Promise<EventsListener> {
		return await this._createListener<DonationAlertsPollUpdateEventData, DonationAlertsPollUpdateEvent>(
			'$polls:poll',
			DonationAlertsPollUpdateEvent,
			callback,
		);
	}

	/**
	 * Unsubscribes and removes a listener for a specific channel.
	 *
	 * @remarks
	 * If this is the last listener, the WebSocket connection is also closed.
	 *
	 * @param listener The {@link EventsListener} instance to be removed.
	 */
	async removeEventsListener(listener: EventsListener): Promise<void> {
		if (this._listeners.has(listener.channelName)) {
			const existingListener = this._listeners.get(listener.channelName)!;
			this._unsubscribe(existingListener._subscription);

			this._listeners.delete(listener.channelName);

			if (this._listeners.size === 0) {
				await this._disconnect();
			}
		}
	}

	private async _connect(): Promise<void> {
		if (!this.isConnected) {
			const token = await this._apiClient.users.getSocketConnectionToken(this._userId);

			return await new Promise<void>((resolve, reject) => {
				try {
					this._centrifuge.setToken(token);

					const rejectTimer = setTimeout(
						() => reject(new Error(`[USER:${this._userId}] Could not connect to Centrifugo server`)),
						10_000,
					);

					this._centrifuge.once('connect', (ctx: ConnectContext) => {
						clearTimeout(rejectTimer);
						this._client = ctx.client;
						return resolve();
					});

					this._centrifuge.connect();
				} catch (e) {
					return reject(e);
				}
			});
		}
	}

	private async _disconnect(): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			if (this.isConnected) {
				try {
					this._logger.debug(`[USER:${this._userId}] Disconnecting...`);

					const rejectTimer = setTimeout(() => {
						this._logger.warn(
							`[USER:${this._userId}] Disconnect timeout. But the connection should be already closed anyway.`,
						);
						resolve();
					}, 10_000);

					this._centrifuge.once('disconnect', () => {
						clearTimeout(rejectTimer);
						this._client = null;
						return resolve();
					});

					this._centrifuge.disconnect();
				} catch (e) {
					return reject(e);
				}
			} else {
				return resolve();
			}
		});
	}

	private async _createListener<D, T>(
		channel: CentrifugoChannel,
		evt: new (data: D) => T,
		callback: (event: T) => void,
	): Promise<EventsListener> {
		await this._connect();

		const subscription = this._subscribe(transformChannel(channel, this._userId));

		subscription.on('publish', (ctx: PublicationContext) => {
			this._logger.debug(`[USER:${this._userId}] [PUBLISH] (${channel as string}_${this._userId})`, ctx);

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

	private _subscribe(channel: string): Subscription {
		return this._centrifuge.subscribe(channel, this._subscriptionListeners);
	}

	private _unsubscribe(subscription: Subscription): void {
		subscription.unsubscribe();
		subscription.removeAllListeners();
	}
}
