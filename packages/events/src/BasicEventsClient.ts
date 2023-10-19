import { WebSocket } from '@d-fischer/isomorphic-ws';
import { type ApiClient } from '@donation-alerts/api';
import { extractUserId, type CentrifugoChannel, type UserIdResolvable } from '@donation-alerts/common';
import { createLogger, LogLevel, type Logger } from '@stimulcross/logger';
import { nonenumerable } from '@stimulcross/shared-utils';
import {
	type JoinLeaveContext,
	type SubscribeErrorContext,
	type SubscribePrivateContext,
	type SubscribePrivateResponse,
	type SubscribeSuccessContext,
	type Subscription,
	type UnsubscribeContext
} from 'centrifuge';
import { EventEmitter } from 'typed-event-emitter';

const HOST = 'wss://centrifugo.donationalerts.com/connection/websocket';

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

/** @internal */
export interface BasicEventsClientConfig {
	user: UserIdResolvable;
	apiClient: ApiClient;
	logger?: Logger;
}

/** @internal */
export class BasicEventsClient extends EventEmitter {
	@nonenumerable private readonly _logger: Logger;
	@nonenumerable private readonly _userId: number;
	@nonenumerable private readonly _apiClient: ApiClient;
	@nonenumerable private readonly _centrifuge: Centrifuge;

	@nonenumerable private readonly _connectionTimeout = 30;

	@nonenumerable private _client?: string;

	private readonly _listeners: Centrifuge.SubscriptionEvents = {
		subscribe: (ctx: SubscribeSuccessContext) => {
			this._logger.debug('[SUBSCRIBE SUCCESS]', ctx);
			this._logger.info(`${ctx.isResubscribe ? 'Resubscribed' : 'Subscribed'} to ${ctx.channel}`);
		},
		error: (ctx: SubscribeErrorContext) => {
			this._logger.debug('[SUBSCRIBE ERROR]', ctx);
		},
		unsubscribe: (ctx: UnsubscribeContext) => {
			this._logger.debug('[UNSUBSCRIBE]', ctx);
			this._logger.info(`Unsubscribed from ${ctx.channel}`);
		},
		join: (ctx: JoinLeaveContext) => {
			this._logger.debug('[JOIN]', ctx);
		},
		leave: (ctx: JoinLeaveContext) => {
			this._logger.debug('[LEAVE]', ctx);
		}
	};

	/**
	 * Fires when the client establishes connection with Centrifugo server.
	 */
	readonly onConnect = this.registerEvent();

	/**
	 * Fires when the client disconnects from the Centrifugo server.
	 */
	readonly onDisconnect = this.registerEvent<[reason: string, reconnect: boolean]>();

	/** @internal */
	constructor(config: BasicEventsClientConfig) {
		super();

		this._logger = config.logger ? config.logger : createLogger({ context: 'da:events', minLevel: LogLevel.INFO });

		this._userId = extractUserId(config.user);
		this._apiClient = config.apiClient;

		// Something wrong with Centrifuge types.
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
		this._centrifuge = new Centrifuge.default(HOST, {
			websocket: WebSocket,
			pingInterval: 15000,
			ping: true,
			minRetry: 0,
			maxRetry: 30_000,
			onPrivateSubscribe: (
				ctx: SubscribePrivateContext,
				callback: (response: SubscribePrivateResponse) => void
			): void => {
				this._apiClient.centrifugo
					.subscribeUserToPrivateChannels(
						this._userId,
						ctx.data.client,
						ctx.data.channels as CentrifugoChannel[],
						{ transformChannel: false }
					)
					.then(channels => {
						callback({
							status: 200,
							data: {
								channels: channels.map(channel => {
									return { channel: channel.channel, token: channel.token };
								})
							}
						});
					})
					.catch(e => this._logger.error(e));
			}
		});

		this._centrifuge.on('connect', (ctx: ConnectContext) => {
			this._client = ctx.client;
			this._logger.debug('[CONNECT]', ctx);
			this._logger.success(`Connection established: ${HOST}`);
			this.emit(this.onConnect);
		});

		this._centrifuge.on('disconnect', (ctx: DisconnectContext) => {
			this._logger.debug('[DISCONNECT]', ctx);
			this.emit(this.onDisconnect, ctx.reason, ctx.reconnect);
		});
	}

	/**
	 * Gets current UUID of the session.
	 */
	get clientId(): string | undefined {
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
	 */
	async connect(): Promise<void> {
		if (!this.isConnected) {
			const token = await this._apiClient.users.getSocketConnectionToken(this._userId);

			return await new Promise<void>((resolve, reject) => {
				try {
					this._centrifuge.setToken(token);

					const rejectTimer = setTimeout(
						() => reject(new Error(`Could not connect to ${HOST}`)),
						this._connectionTimeout * 1000
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

	/**
	 * Disconnects from the Donation Alerts Centrifugo WebSocket server.
	 */
	async disconnect(): Promise<void> {
		return await new Promise<void>((resolve, reject) => {
			if (this.isConnected) {
				try {
					this._logger.info('Disconnecting...');

					const rejectTimer = setTimeout(
						() => reject(new Error(`Could not disconnect from ${HOST}`)),
						this._connectionTimeout * 1000
					);

					this._centrifuge.once('disconnect', () => {
						clearTimeout(rejectTimer);
						this._client = undefined;
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

	/**
	 * Reconnects to the Donation Alerts Centrifugo WebSocket server.
	 */
	async reconnect(): Promise<void> {
		await this.disconnect();
		await this.connect();
	}

	/**
	 * Subscribes to the channel.
	 *
	 * @param channel Channel name to subscribe to.
	 */
	subscribe(channel: string): Subscription {
		return this._centrifuge.subscribe(channel, this._listeners);
	}

	/**
	 * Unsubscribes from the channel.
	 *
	 * @param subscription Subscription to unsubscribe.
	 */
	unsubscribe(subscription: Subscription): void {
		subscription.unsubscribe();
	}
}
