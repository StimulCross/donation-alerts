import { EventEmitter } from '@d-fischer/typed-event-emitter';
import { type ApiClient } from '@donation-alerts/api';
import { extractUserId, ReadDocumentation, type UserIdResolvable } from '@donation-alerts/common';
import { type LoggerOptions } from '@stimulcross/logger';
import { nonenumerable } from '@stimulcross/shared-utils';
import { type DonationAlertsDonationEvent } from './events/donations/DonationAlertsDonationEvent';
import { type DonationAlertsGoalUpdateEvent } from './events/goals/DonationAlertsGoalUpdateEvent';
import { type DonationAlertsPollUpdateEvent } from './events/polls/DonationAlertsPollUpdateEvent';
import { type EventsListener } from './EventsListener';
import { UserEventsClient } from './UserEventsClient';

/**
 * Configuration for {@link EventsClient}.
 */
export interface EventsClientConfig {
	apiClient: ApiClient;
	logger?: LoggerOptions;
}
/**
 * Donation Alerts events client that allows listen to various events, such as new donations, goal updates,
 * and poll updates.
 */
@ReadDocumentation('events')
export class EventsClient extends EventEmitter {
	@nonenumerable private readonly _config: EventsClientConfig;
	@nonenumerable private readonly _apiClient: ApiClient;
	@nonenumerable private readonly _userClients: Map<number, UserEventsClient> = new Map();

	/**
	 * Fires when a user's client establishes a connection to a Centrifugo server.
	 */
	readonly onConnect = this.registerEvent<[userId: number]>();

	/**
	 * Fires when a user's client disconnected from a Centrifugo server.
	 */
	readonly onDisconnect = this.registerEvent<[userId: number, reason: string, reconnect: boolean]>();

	/**
	 * Creates the Donation Alerts events client that allows listen to various events, such as new donations,
	 * goal updates, and poll updates.
	 *
	 * @param config
	 */
	constructor(config: EventsClientConfig) {
		super();

		this._config = config;
		this._apiClient = config.apiClient;
	}

	/**
	 * Returns a {@link UserEventsClient} by user ID.
	 *
	 * @param user The user to get the {@link UserEventsClient} instance of.
	 */
	getUserClient(user: UserIdResolvable): UserEventsClient {
		const userId = extractUserId(user);

		if (!this._userClients.has(userId)) {
			throw new Error(
				`User "${userId}" is not registered. Use "addUser" method to register the user before listening to events.`
			);
		}

		return this._userClients.get(userId)!;
	}

	/**
	 * Checks whether a user was added to the client.
	 */
	hasUser(user: UserIdResolvable): boolean {
		return this._userClients.has(extractUserId(user));
	}

	/**
	 * Registers a user in the client.
	 *
	 * @param user The ID of the user to register.
	 */
	addUser(user: UserIdResolvable): UserEventsClient {
		const userId = extractUserId(user);

		if (this._userClients.has(userId)) {
			throw new Error(`User "${userId}" is already registered`);
		}

		const userEventsClient = new UserEventsClient({
			user: userId,
			apiClient: this._apiClient,
			logger: this._config.logger
		});

		userEventsClient.onConnect(() => this.emit(this.onConnect, userId));
		userEventsClient.onDisconnect((reason: string, reconnect: boolean) =>
			this.emit(this.onDisconnect, userId, reason, reconnect)
		);

		this._userClients.set(userId, userEventsClient);

		return userEventsClient;
	}

	/**
	 * Removes a user and the listeners from the client.
	 *
	 * If the user client doesn't have active channels, the connection will be closed.
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
	 * Creates a listener for user for donation events.
	 *
	 * @param user The ID of the user to listen donation events to.
	 * @param callback A function to be called when donation event is sent to the user.
	 */
	async onDonation(
		user: UserIdResolvable,
		callback: (event: DonationAlertsDonationEvent) => void
	): Promise<EventsListener> {
		return await this.getUserClient(user).onDonation(callback);
	}

	/**
	 * Creates a listener for user for goal update events.
	 *
	 * @param user The ID of the user to listen goal update events to.
	 * @param callback A function to be called when goal update is sent to the user.
	 */
	async onGoalUpdate(
		user: UserIdResolvable,
		callback: (event: DonationAlertsGoalUpdateEvent) => void
	): Promise<EventsListener> {
		return await this.getUserClient(user).onGoalUpdate(callback);
	}

	/**
	 * Creates a listener for user for poll update events.
	 *
	 * @param user The ID of the user to listen poll update events to.
	 * @param callback A function to be called when poll update is sent to the user.
	 */
	async onPollUpdate(
		user: UserIdResolvable,
		callback: (event: DonationAlertsPollUpdateEvent) => void
	): Promise<EventsListener> {
		return await this.getUserClient(user).onPollUpdate(callback);
	}
}
