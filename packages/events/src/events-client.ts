import { EventEmitter } from '@d-fischer/typed-event-emitter';
import { type ApiClient } from '@donation-alerts/api';
import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { type LoggerOptions } from '@stimulcross/logger';
import { nonenumerable } from '@stimulcross/shared-utils';
import { type DonationAlertsDonationEvent } from './events/donations/donation-alerts-donation-event';
import { type DonationAlertsGoalUpdateEvent } from './events/goals/donation-alerts-goal-update-event';
import { type DonationAlertsPollUpdateEvent } from './events/polls/donation-alerts-poll-update-event';
import { type EventsListener } from './events-listener';
import { UserEventsClient } from './user-events-client';

/**
 * Configuration for {@link EventsClient}.
 *
 * @remarks
 * Defines the settings required to initialize the `EventsClient`, including the API client
 * for communication and optional logger configuration.
 */
export interface EventsClientConfig {
	apiClient: ApiClient;
	logger?: Partial<LoggerOptions>;
}

/**
 * Donation Alerts events client that manages multiple users and allows listening to
 * various events such as donations, goal updates, and poll updates.
 *
 * @remarks
 * The `EventsClient` acts as a central manager for event subscriptions. Each user tracked
 * by the client operates within its own {@link UserEventsClient} instance. This class
 * simplifies handling multiple users while maintaining individual event subscription control.
 */

@ReadDocumentation('events')
export class EventsClient extends EventEmitter {
	@nonenumerable private readonly _config: EventsClientConfig;
	@nonenumerable private readonly _apiClient: ApiClient;
	@nonenumerable private readonly _userClients: Map<number, UserEventsClient> = new Map();

	/**
	 * Fires when a user's client successfully connects to the Centrifugo server.
	 */
	readonly onConnect = this.registerEvent<[userId: number]>();

	/**
	 * Fires when a user's client disconnected from the Centrifugo server.
	 */
	readonly onDisconnect = this.registerEvent<[userId: number, reason: string, reconnect: boolean]>();

	/**
	 * Initializes the Donation Alerts events client.
	 *
	 * @param config Configuration for creating the `EventsClient`.
	 */
	constructor(config: EventsClientConfig) {
		super();

		this._config = config;
		this._apiClient = config.apiClient;
	}

	/**
	 * Returns an instance of {@link UserEventsClient} for a specific user.
	 *
	 * @param user The ID of the user to retrieve the client instance for.
	 * @throws Error if the user has not been registered in the client.
	 */
	getUserClient(user: UserIdResolvable): UserEventsClient {
		const userId = extractUserId(user);

		if (!this._userClients.has(userId)) {
			throw new Error(
				`User "${userId}" is not registered. Use "addUser" method to register the user before listening to events.`,
			);
		}

		return this._userClients.get(userId)!;
	}

	/**
	 * Checks if a user is registered in the client.
	 *
	 * @param user The user ID to check for registration.
	 * @returns `true` if the user is registered; otherwise, `false`.
	 */
	hasUser(user: UserIdResolvable): boolean {
		return this._userClients.has(extractUserId(user));
	}

	/**
	 * Registers a user with the client and creates a new {@link UserEventsClient} for them.
	 *
	 * @param user The ID of the user to register.
	 *
	 * @returns A {@link UserEventsClient} instance for the registered user.
	 *
	 * @throws Error if the user is already registered.
	 */
	addUser(user: UserIdResolvable): UserEventsClient {
		const userId = extractUserId(user);

		if (this._userClients.has(userId)) {
			throw new Error(`User "${userId}" is already registered`);
		}

		const userEventsClient = new UserEventsClient({
			user: userId,
			apiClient: this._apiClient,
			logger: this._config.logger,
		});

		userEventsClient.onConnect(() => this.emit(this.onConnect, userId));
		userEventsClient.onDisconnect((reason: string, reconnect: boolean) =>
			this.emit(this.onDisconnect, userId, reason, reconnect),
		);

		this._userClients.set(userId, userEventsClient);

		return userEventsClient;
	}

	/**
	 * Unregisters a user and removes their listeners and event subscriptions.
	 *
	 * @remarks
	 * If the user's client is not actively subscribed to channels, the WebSocket connection
	 * will be closed.
	 *
	 * @param user The ID of the user to remove.
	 */
	async removeUser(user: UserIdResolvable): Promise<void> {
		const userId = extractUserId(user);

		if (!this._userClients.has(userId)) {
			return;
		}

		const client = this._userClients.get(userId)!;
		await client.disconnect(true);

		client.removeListener();

		this._userClients.delete(userId);
	}

	/**
	 * Subscribes to donation events for a specific user.
	 *
	 * @param user The ID of the user whose donations are being monitored.
	 * @param callback A function invoked when a donation event is received.
	 *
	 * @returns An {@link EventsListener} instance for managing the subscription.
	 */
	async onDonation(
		user: UserIdResolvable,
		callback: (event: DonationAlertsDonationEvent) => void,
	): Promise<EventsListener> {
		return await this.getUserClient(user).onDonation(callback);
	}

	/**
	 * Subscribes to goal update events for a specific user.
	 *
	 * @param user The ID of the user whose goal updates are being monitored.
	 * @param callback A function invoked when a goal update event is received.
	 *
	 * @returns An {@link EventsListener} instance for managing the subscription.
	 */
	async onGoalUpdate(
		user: UserIdResolvable,
		callback: (event: DonationAlertsGoalUpdateEvent) => void,
	): Promise<EventsListener> {
		return await this.getUserClient(user).onGoalUpdate(callback);
	}

	/**
	 * Subscribes to poll update events for a specific user.
	 *
	 * @param user The ID of the user whose poll updates are being monitored.
	 * @param callback A function invoked when a poll update event is received.
	 *
	 * @returns An {@link EventsListener} instance for managing the subscription.
	 */
	async onPollUpdate(
		user: UserIdResolvable,
		callback: (event: DonationAlertsPollUpdateEvent) => void,
	): Promise<EventsListener> {
		return await this.getUserClient(user).onPollUpdate(callback);
	}
}
