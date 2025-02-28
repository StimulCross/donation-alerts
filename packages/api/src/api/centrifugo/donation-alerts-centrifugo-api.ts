import { type RateLimiterRequestOptions } from '@d-fischer/rate-limiter';
import {
	extractUserId,
	ReadDocumentation,
	type CentrifugoChannel,
	type DonationAlertsApiScope,
	type UserIdResolvable,
} from '@donation-alerts/common';
import {
	DonationAlertsCentrifugoChannel,
	type DonationAlertsCentrifugoChannelsResponseData,
} from './donation-alerts-centrifugo-channel';
import { BaseApi } from '../base-api';

/**
 * Additional subscribe options.
 */
export interface DonationAlertsCentrifugoSubscribeOptions {
	/**
	 * Merges channel name and user ID to form valid channel name.
	 *
	 * @defaultValue `true`
	 */
	transformChannel?: boolean;
}

/**
 * Donation Alerts Centrifugo API.
 *
 * Provides methods to manage user subscriptions to Centrifugo private channels.
 * These channels allow receiving real-time updates about specific events such as donations, goals, and polls.
 */

@ReadDocumentation('api')
export class DonationAlertsCentrifugoApi extends BaseApi {
	/**
	 * Subscribes a user to the specified Centrifugo private channels.
	 *
	 * @remarks
	 * To subscribe a user, you must first obtain the Client ID (UUIDv4) via WebSockets.
	 *
	 * The full subscription flow is described in the official documentation:
	 * {@link https://www.donationalerts.com/apidoc#introduction__centrifugo}
	 *
	 * Alternatively, the `@donation-alerts/events` library can simplify the process of subscribing
	 * and listening to events.
	 *
	 * @param user The Donation Alerts user ID.
	 * @param clientId The Client ID obtained beforehand.
	 * @param channels List of private channel names to subscribe the user to. Channel names should not include the
	 * user ID – the library will format them automatically if needed.
	 * @param options Additional options for subscription, such as formatting channel names.
	 * @param rateLimiterOptions Options for controlling the request rate using a rate limiter.
	 *
	 * @returns A promise resolving with a list of {@link DonationAlertsCentrifugoChannel}.
	 *
	 * @throws {@link HttpError} If the HTTP status code is outside the range of 200–299.
	 * @throws {@link UnregisteredUserError} If the user provided is not registered in the auth provider.
	 *
	 * @example
	 * ```ts
	 * const subscribedChannels = await apiClient.centrifugo.subscribeUserToPrivateChannels(userId, clientId, [
	 *   '$alerts:donation',
	 *   '$goals:goal'
	 * ]);
	 * subscribedChannels.forEach(channel =>
	 *   console.log(`Subscribed to ${channel.channel}; token: ${channel.token}`)
	 * );
	 * ```
	 */
	async subscribeUserToPrivateChannels(
		user: UserIdResolvable,
		clientId: string,
		channels: Array<CentrifugoChannel | string>,
		options?: DonationAlertsCentrifugoSubscribeOptions,
		rateLimiterOptions?: RateLimiterRequestOptions,
	): Promise<DonationAlertsCentrifugoChannel[]> {
		return await this._genericSubscribeToMultiplePrivateChannels(
			user,
			clientId,
			channels,
			options,
			rateLimiterOptions,
		);
	}

	/**
	 * Subscribes a user to donation alert events.
	 *
	 * Donation alert events notify when a new donation is made. This requires the user to be subscribed
	 * to the `$alerts:donation` private channel.
	 *
	 * @remarks
	 * Requires `oauth-donation-subscribe` scope.
	 *
	 * See the official documentation for more details:
	 * {@link https://www.donationalerts.com/apidoc#introduction__centrifugo}
	 *
	 * Alternatively, the `@donation-alerts/events` library can simplify the process of subscribing
	 * and listening to events.
	 *
	 * @param user The Donation Alerts user ID.
	 * @param clientId The Client ID obtained beforehand.
	 * @param options Additional options for subscription, such as formatting channel names.
	 * @param rateLimiterOptions Options for rate limiting during the subscription.
	 *
	 * @returns A promise resolving with the {@link DonationAlertsCentrifugoChannel} object.
	 *
	 * @throws {@link HttpError} If the HTTP status code is outside the range of 200–299.
	 * @throws {@link UnregisteredUserError} If the user provided is not registered in the auth provider.
	 *
	 * @example
	 * ```ts
	 * const channel = await apiClient.centrifugo.subscribeUserToDonationAlertEvents(userId, clientId);
	 * console.log(`Subscribed to channel: ${channel.channel}; token: ${channel.token}`);
	 * ```
	 */
	async subscribeUserToDonationAlertEvents(
		user: UserIdResolvable,
		clientId: string,
		options?: DonationAlertsCentrifugoSubscribeOptions,
		rateLimiterOptions?: RateLimiterRequestOptions,
	): Promise<DonationAlertsCentrifugoChannel> {
		return await this._genericSubscribeToPrivateChannel(
			user,
			clientId,
			'$alerts:donation',
			'oauth-donation-subscribe',
			options,
			rateLimiterOptions,
		);
	}

	/**
	 * Subscribes a user to goal update events.
	 *
	 * Goal update events provide information about the progress and completion of goals.
	 * This requires the user to be subscribed to the `$goals:goal` private channel.
	 *
	 * @remarks
	 * Requires `oauth-goal-subscribe` scope.
	 *
	 * See the official documentation for more details:
	 * {@link https://www.donationalerts.com/apidoc#introduction__centrifugo}
	 *
	 * Alternatively, the `@donation-alerts/events` library can simplify the process of subscribing
	 * and listening to events.
	 *
	 * @param user The Donation Alerts user ID.
	 * @param clientId The Client ID obtained beforehand.
	 * @param options Additional options for subscription, such as formatting channel names.
	 * @param rateLimiterOptions Options for rate limiting during the subscription.
	 *
	 * @returns A promise resolving with the successfully subscribed channel object.
	 *
	 * @throws {@link HttpError} If the HTTP status code is outside the range of 200–299.
	 * @throws {@link UnregisteredUserError} If the user provided is not registered in the auth.
	 *
	 * @example
	 * ```ts
	 * const channel = await apiClient.centrifugo.subscribeUserToGoalUpdateEvents(userId, clientId);
	 * console.log(`Subscribed to channel: ${channel.channel}; token: ${channel.token}`);
	 * ```
	 */
	async subscribeUserToGoalUpdateEvents(
		user: UserIdResolvable,
		clientId: string,
		options?: DonationAlertsCentrifugoSubscribeOptions,
		rateLimiterOptions?: RateLimiterRequestOptions,
	): Promise<DonationAlertsCentrifugoChannel> {
		return await this._genericSubscribeToPrivateChannel(
			user,
			clientId,
			'$goals:goal',
			'oauth-goal-subscribe',
			options,
			rateLimiterOptions,
		);
	}

	/**
	 * Subscribes a user to poll update events.
	 *
	 * Poll update events notify about ongoing poll progress or results.
	 * This requires the user to be subscribed to the `$polls:poll` private channel.
	 *
	 * @remarks
	 * Requires `oauth-poll-subscribe` scope.
	 *
	 * See the official documentation for more details:
	 * {@link https://www.donationalerts.com/apidoc#introduction__centrifugo}
	 *
	 * Alternatively, the `@donation-alerts/events` library can simplify the process of subscribing
	 * and listening to events.
	 *
	 * @param user The Donation Alerts user ID.
	 * @param clientId The Client ID obtained beforehand.
	 * @param options Additional options for subscription, such as formatting channel names.
	 * @param rateLimiterOptions Options for rate limiting during the subscription.
	 *
	 * @returns A promise resolving with the successfully subscribed channel object.
	 *
	 * @throws {@link HttpError} If the HTTP status code is outside the range of 200–299.
	 * @throws {@link UnregisteredUserError} If the user provided is not registered in the auth provider.
	 *
	 * @example
	 * ```ts
	 * const channel = await apiClient.centrifugo.subscribeUserToPollUpdateEvents(userId, clientId);
	 * console.log(`Subscribed to channel: ${channel.channel}; token: ${channel.token}`);
	 * ```
	 */
	async subscribeUserToPollUpdateEvents(
		user: UserIdResolvable,
		clientId: string,
		options?: DonationAlertsCentrifugoSubscribeOptions,
		rateLimiterOptions?: RateLimiterRequestOptions,
	): Promise<DonationAlertsCentrifugoChannel> {
		return await this._genericSubscribeToPrivateChannel(
			user,
			clientId,
			'$polls:poll',
			'oauth-poll-subscribe',
			options,
			rateLimiterOptions,
		);
	}

	private async _genericSubscribeToMultiplePrivateChannels(
		user: UserIdResolvable,
		clientId: string,
		channels: Array<CentrifugoChannel | string>,
		options?: DonationAlertsCentrifugoSubscribeOptions,
		rateLimiterOptions?: RateLimiterRequestOptions,
	): Promise<DonationAlertsCentrifugoChannel[]> {
		const response = await this._apiClient.callApi<DonationAlertsCentrifugoChannelsResponseData>(
			user,
			{
				type: 'api',
				url: 'centrifuge/subscribe',
				method: 'POST',
				jsonBody: {
					client: clientId,
					channels:
						(options?.transformChannel ?? true)
							? channels.map(channel => `${channel}_${extractUserId(user)}`)
							: channels,
				},
			},
			rateLimiterOptions,
		);

		return response.channels.map(channel => new DonationAlertsCentrifugoChannel(channel));
	}

	private async _genericSubscribeToPrivateChannel(
		user: UserIdResolvable,
		clientId: string,
		channel: CentrifugoChannel | string,
		scope?: DonationAlertsApiScope,
		options?: DonationAlertsCentrifugoSubscribeOptions,
		rateLimiterOptions?: RateLimiterRequestOptions,
	): Promise<DonationAlertsCentrifugoChannel> {
		const response = await this._apiClient.callApi<DonationAlertsCentrifugoChannelsResponseData>(
			user,
			{
				type: 'api',
				url: 'centrifuge/subscribe',
				method: 'POST',
				scope: scope as string | undefined,
				jsonBody: {
					client: clientId,
					channels: [
						`${(options?.transformChannel ?? true) ? `${channel}_${extractUserId(user)}` : channel}`,
					],
				},
			},
			rateLimiterOptions,
		);

		if (response.channels.length === 0) {
			throw new Error(`Could not subscribe to the private channel: ${channel}`);
		}

		return new DonationAlertsCentrifugoChannel(response.channels[0]);
	}
}
