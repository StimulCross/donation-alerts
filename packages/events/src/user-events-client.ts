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
import * as Centrifuge from 'centrifuge';
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
	 * The ID of the user the events client belongs to.
	 */
	get userId(): number {
		return this._userId;
	}

	/**
	 * Centrifugo current connection client ID.
	 *
	 * Returns `null` if no connection is established.
	 */
	get clientId(): string | null {
		return this._client;
	}

	/**
	 * Checks whether the client is currently connected to the server.
	 */
	get isConnected(): boolean {
		return this._centrifuge.isConnected();
	}

	/**
	 * Connects to the Donation Alerts Centrifugo WebSocket server and subscribes to the topics.
	 *
	 * @param restoreExistingListeners Whether to restore previously registered listeners on connect. Default is `true`.
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
	 * Disconnects from the Donation Alerts Centrifugo WebSocket server.
	 *
	 * @param removeListeners Whether to remove all active listeners on disconnect. If you don't remove them,
	 * the client will try to restore them on the next connection. Default is `false`.
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
			callback,
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
			callback,
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
			callback,
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
