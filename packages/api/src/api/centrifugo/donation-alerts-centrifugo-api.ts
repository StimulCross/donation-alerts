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
 * Allows to subscribe a user to the Centrifugo private channels.
 */
@ReadDocumentation('api')
export class DonationAlertsCentrifugoApi extends BaseApi {
	/**
	 * Subscribes a user to the given Centrifugo private channels.
	 *
	 * You must obtain the UUIDv4 Client ID via WebSockets to subscribe user to Centrifugo private channels.
	 *
	 * See the complete subscription flow in the official documentation:
	 * {@link https://www.donationalerts.com/apidoc#introduction__centrifugo}
	 *
	 * Also, consider using the "@donation-alerts/events" library which makes it very easy to subscribe and listen
	 * to events.
	 *
	 * @param user The Donation Alerts user ID.
	 * @param clientId The previously obtained Client ID.
	 * @param channels The private channel names the user should be subscribed to. The channel names must not contain
	 * the user IDs. The library will properly format channel names itself.
	 * @param options Additional subscribe options.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
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
	 * Subscribes a user to the donation alert events.
	 *
	 * You must obtain the UUIDv4 Client ID via WebSockets to subscribe to Centrifugo private channels.
	 *
	 * See the complete subscription flow in the official documentation:
	 * {@link https://www.donationalerts.com/apidoc#introduction__centrifugo}
	 *
	 * Also, consider using the `@donation-alerts/events` library which makes it very easy to subscribe and listen
	 * to events.
	 *
	 * @param user The Donation Alerts user ID.
	 * @param clientId The previously obtained Client ID.
	 * @param options Additional subscribe options.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
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
	 * Subscribes a user to the goal update events.
	 *
	 * You must obtain the UUIDv4 Client ID via WebSockets to subscribe to Centrifugo private channels.
	 *
	 * See the complete subscription flow in the official documentation:
	 * {@link https://www.donationalerts.com/apidoc#introduction__centrifugo}
	 *
	 * Also, consider using the "@donation-alerts/events" library which makes it very easy to subscribe and listen
	 * to events.
	 *
	 * @param user The Donation Alerts user ID.
	 * @param clientId The previously obtained Client ID.
	 * @param options Additional subscribe options.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
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
	 * Subscribes a user to the poll update events.
	 *
	 * You must obtain the UUIDv4 Client ID via WebSockets to subscribe to Centrifugo private channels.
	 *
	 * See the complete subscription flow in the official documentation:
	 * {@link https://www.donationalerts.com/apidoc#introduction__centrifugo}
	 *
	 * Also, consider using the "@donation-alerts/events" library which makes it very easy to subscribe and listen
	 * to events.
	 *
	 * @param user The Donation Alerts user ID.
	 * @param clientId The previously obtained Client ID.
	 * @param options Additional subscribe options.
	 * @param rateLimiterOptions The rate limiter options.
	 *
	 * @throws {@link HttpError} if response status code is out of 200-299 range.
	 * @throws {@link UnregisteredUserError} if the user you are trying to get is not registered in authentication provider.
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
