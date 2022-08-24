import { nonenumerable } from '@stimulcross/shared-utils';
import type { LoggerOptions } from '@stimulcross/logger';
import type { UserIdResolvable } from '@donation-alerts/common';
import { extractUserId, ReadDocumentation } from '@donation-alerts/common';
import type { ApiClient } from '@donation-alerts/api';
import { UserEventsClient } from './UserEventsClient';
import type { DonationAlertsDonationEvent } from './events/donations/DonationAlertsDonationEvent';
import type { EventsListener } from './EventsListener';
import type { DonationAlertsGoalUpdateEvent } from './events/goals/DonationAlertsGoalUpdateEvent';
import type { DonationAlertsPollUpdateEvent } from './events/polls/DonationAlertsPollUpdateEvent';

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
export class EventsClient {
	@nonenumerable private readonly _config: EventsClientConfig;
	@nonenumerable private readonly _apiClient: ApiClient;
	@nonenumerable private readonly _userClients = new Map<number, UserEventsClient>();

	/**
	 * Creates the Donation Alerts events client that allows listen to various events, such as new donations,
	 * goal updates, and poll updates.
	 * @param config
	 */
	constructor(config: EventsClientConfig) {
		this._config = config;
		this._apiClient = config.apiClient;
	}

	/**
	 * Returns a {@link UserEventsClient} by user ID.
	 *
	 * @param user The ID of the user.
	 *
	 * @throws Error if user unregistered.
	 */
	getUserClient(user: UserIdResolvable): UserEventsClient {
		const userId = extractUserId(user);

		if (!this._userClients.has(userId)) {
			throw new Error(`User "${userId}" is not registered`);
		}

		return this._userClients.get(userId)!;
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
			throw new Error(`User "${userId}" is not registered`);
		}

		const client = this._userClients.get(userId)!;
		await client.disconnect(true);

		this._userClients.delete(userId);
	}

	/**
	 * Creates a listener for user for donation events.
	 *
	 * @param user The ID of the user to listen donation events to.
	 * @param callback A function to be called when donation event is sent to the user.
	 */
	async listenToDonationEvents(
		user: UserIdResolvable,
		callback: (event: DonationAlertsDonationEvent) => void
	): Promise<EventsListener> {
		return await this.getUserClient(user).listenToDonationEvents(callback);
	}

	/**
	 * Creates a listener for user for goal update events.
	 *
	 * @param user The ID of the user to listen goal update events to.
	 * @param callback A function to be called when goal update is sent to the user.
	 */
	async listenToGoalUpdateEvents(
		user: UserIdResolvable,
		callback: (event: DonationAlertsGoalUpdateEvent) => void
	): Promise<EventsListener> {
		return await this.getUserClient(user).listenToGoalUpdateEvents(callback);
	}

	/**
	 * Creates a listener for user for poll update events.
	 *
	 * @param user The ID of the user to listen poll update events to.
	 * @param callback A function to be called when poll update is sent to the user.
	 */
	async listenToPollUpdateEvents(
		user: UserIdResolvable,
		callback: (event: DonationAlertsPollUpdateEvent) => void
	): Promise<EventsListener> {
		return await this.getUserClient(user).listenToPollUpdateEvents(callback);
	}
}
