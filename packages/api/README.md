# Donation Alerts - API

API client that allows fetching data from Donation Alerts API. The library covers 100% of available API endpoints.

## Installation

Using `npm`:

```
npm i @donation-alerts/api @donation-alerts/auth
```

Using `yarn`:

```
yarn add @donation-alerts/api @donation-alerts/auth
```

## Usage

To create an [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html) instance, you must provide an [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) class. Read the [Authentication](https://stimulcross.github.io/donation-alerts/modules/auth.html) documentation to learn how to set up [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html).

```ts
import { ApiClient } from '@donation-alerts/api';

const apiClient = new ApiClient({
	authProvider: authProvider,
});
```

Check the [ApiConfig](https://stimulcross.github.io/donation-alerts/interfaces/api.ApiConfig.html) documentation page to see all available configuration options.

### Getting data

After creating `ApiClient`, it's very straightforward to get data from the API. The `ApiClient` includes 5 namespaces:

- [users](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUsersApi.html)
- [donations](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html)
- [customAlerts](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCustomAlertsApi.html)
- [centrifugo](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html)
- [merchandises](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html)

> [!NOTE]
> The user must be registered in the authentication provider instance you passed to the [ApiConfig](https://stimulcross.github.io/donation-alerts/interfaces/api.ApiConfig.html) object. Otherwise, the library won't be able to obtain the user's access token to perform a request and will throw [UnregisteredUserError](https://stimulcross.github.io/donation-alerts/classes/auth.UnregisteredUserError.html).

---

#### [Users API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUsersApi.html)

**Required scope:** `oauth-user-show`

Donation Alerts API currently supports only getting the user associated with the access token used in the request.

```ts
const user = await apiClient.users.getUser(123456789);
```

Returns [DonationAlertsUser](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUser.html) instance.

There is also a way to get the socket connection token directly:

```ts
const connectionToken = await apiClient.users.getSocketConnectionToken(123456789);
```

---

#### [Donations API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html)

**Required scope:** `oauth-donation-index`

You can use a few approaches to get user's donations.

#### `getDonations`

The first one is [getDonations](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html#getDonations) method. It accepts the ID of the user as the first argument.

```ts
const userId = 123456789;
const donations = await apiClient.donations.getDonations(userId);
```

This returns an array of [DonationAlertsDonation](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonation.html) objects.

The example above gets only the first page of donations. To get a specific page, you can pass pagination data as the second argument.

```ts
const userId = 123456789;
const donations = await apiClient.donations.getDonations(userId, { page: 2 });
```

#### `getAllDonations`

If you want to get all donations you can use [getAllDonations](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html#getAllDonations) method.

```ts
const donations = await apiClient.donations.getAllDonations(123456789);
```

Returns an array of [DonationAlertsDonation](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonation.html) objects.

> [!WARNING]
> Use with caution. This method can return a huge amount of data and can take a very long time. It is possible that your application will crash.

#### `createDonationsPaginator`

The more flexible way to get user donations is by using the [DonationAlertsApiPaginator](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html) class. It allows you to navigate pages in both directions and keeps track of the current state.

```ts
const userId = 123456789;
const paginator = apiClient.donations.createDonationsPaginator(userId);
```

After creating a paginator instance, you can use its methods to navigate pages:

- [getNext](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getNext) - Gets the next page. If you reached the last page, this method returns an empty array.
- [getPrev](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getPrev) - Gets the previous page. If you already on the first page, this method returns it back.
- [getPage](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getPage) - Gets the specified page. If page does not exist, this method returns an empty array.
- [getAll](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getAll) - Gets all available donations. Use it carefully because this can return a huge amount of data and take a lot of time.

```ts
const nextPage = await paginator.getNext();
const prevPage = await paginator.getPrev();
const page5 = await paginator.getPage(5);
const donations = await paginator.getAll();
```

The paginator also supports async iterations. It returns an array of page donations per iteration.

```ts
const userId = 123456789;
const paginator = apiClient.donations.createDonationsPaginator(userId);

for await (const page of paginator) {
	console.log(page);
}
```

There is also a batch of useful accessors indicating the current pagination state: [currentPage](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#currentPage), [totalPages](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#totalPages), [perPage](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#perPage), etc. To see the full list of available properties and methods, check the paginator [documentation](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html) page.

You can reset the state at any time using the [reset](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#reset) method.

```ts
paginator.reset();
```

---

#### [Custom Alerts API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCustomAlertsApi.html)

**Required scope:** `oauth-custom_alert-store`

Donation Alerts supports custom alerts. When a broadcaster creates a widget with the `Custom alert` variation type, you can send alerts to this widget via this API.

```ts
await apiClient.customAlerts.sendCustomAlert(123456789, {
	header: 'Custom Alert',
	message: 'Hello!',
});
```

That's it! The widget triggers the alert. Check [DonationAlertsSendCustomAlertData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsSendCustomAlertData.html) documentation page to see all the available options you can use with custom alerts.

---

#### [Centrifugo API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html)

Donation Alerts supports real-time notifications over WebSocket protocol. To be able to listen to real-time notifications, you must subscribe to the private channels of your choice. This API handles this task.

> [!IMPORTANT]
> You must obtain an UUIDv4 client ID to subscribe users. This client ID is **NOT** the same as your Donation Alerts application client ID. Read more in the official Donation Alerts [documentation](https://www.donationalerts.com/apidoc#advertisement).

> [!NOTE]
> If you need to listen to real-time Donation Alerts notifications, consider using [@donation-alerts/events](https://stimulcross.github.io/donation-alerts/modules/events.html) package. This library makes it very straightforward to listen to supported Donation Alerts channels without any extra actions.

To subscribe to private channels you can use [subscribeUserToPrivateChannels](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToPrivateChannels) method:

```ts
const userId = 123456789;
const clientId = '<OBTAINED_UUIDV4_CLIENT_ID>';

const channels = await apiClient.centrifugo.subscribeUserToPrivateChannels(userId, clientId, [
	'$alerts:donation',
	'$goals:goal',
	'$polls:poll',
]);
```

This method returns an array of [DonationAlertsCentrifugoChannel](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoChannel.html) objects that include the channel name and subscription token.

To subscribe to a private channel, the channel name must fit the following template: `<channel>_<userId>`. If you want to subscribe to donation notifications (means `$alerts:donation` channel) of user `123456789`, you don't need to form the channel name yourself; the library takes on this task for you. The result will be a valid target channel with joined channel name and user ID: `$alerts:donation_123456789`.

If you are passing already valid channel, you should disable this behavior by passing [DonationAlertsCentrifugoSubscribeOptions](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCentrifugoSubscribeOptions.html) as the fourth argument with property `transformChannel` equal to `false`:

```ts
const userId = 123456789;
const clientId = '<OBTAINED_UUIDV4_CLIENT_ID>';

const channels = await apiClient.centrifugo.subscribeUserToPrivateChannels(
	userId,
	clientId,
	// You are passing a valid channel here
	['$alerts:donation_123456789'],
	// Here you can pass options object and disable transformation
	{ transformChannel: false },
);
```

In this case, the library won't transform the channel.

In addition to the above method, you can use special methods to subscribe to specific channels: [subscribeUserToDonationAlertEvents](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToDonationAlertEvents), [subscribeUserToGoalUpdateEvents](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToGoalUpdateEvents), and [subscribeUserToPollUpdateEvents](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToPollUpdateEvents).

```ts
const userId = 123456789;
const clientId = '<OBTAINED_UUIDV4_CLIENT_ID>';

const donationChannel = await apiClient.centrifugo.subscribeUserToDonationAlertEvents(userId, clientId);
const goalUpdateChannel = await apiClient.centrifugo.subscribeUserToGoalUpdateEvents(userId, clientId);
const pollUpdateChannel = await apiClient.centrifugo.subscribeUserToPollUpdateEvents(userId, clientId);
```

These methods also accept [DonationAlertsCentrifugoSubscribeOptions](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCentrifugoSubscribeOptions.html) as the third argument, and you can disable channel transformation here, too.

---

#### [Merchandise API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html)

> [!WARNING] > `Merchandise API` wasn't tested because access to these API endpoints is given as per request. Check the official [documentation](https://www.donationalerts.com/apidoc#advertisement__merchandises) to read more.

Donation Alerts allow the merchant to sell their merchandise and provide the API methods to create or update merchandise and send sale notifications.

#### Creating merchandise

To create merchandise you can use [createMerchandise](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html#createMerchandise) method:

```ts
const userId = 123456789;
const clientSecret = 'SUPER_SECRET_STRING';

const merchadiseData: DonationAlertsCreateMerchandiseData = {
	merchantIdentifier: '<MERCHANT_ID>',
	merchandiseIdentifier: '<MERCHANDISE_ID>',
	title: {
		en_US: 'English Title',
		ru_RU: 'Русский заголовок',
	},
	isActive: true,
	isPercentage: true,
	currency: 'EUR',
	priceUser: 5,
	priceService: 2,
	url: '<MERCHANDISE_WEB_PAGE_URL>',
	imgUrl: '<IMAGE_URL>',
	endTimestamp: 1660632051919,
};

const createdMerchandise = await apiClient.merchandise.createMerchandise(userId, clientSecret, merchadiseData);
```

To read about all the available merchandise options you can check the [DonationAlertsCreateMerchandiseData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCreateMerchandiseData.html) documentation page.

> [!NOTE] > `en_US` title is required, but other languages are optional.

#### Updating merchandise

Updating the merchandise is also very straightforward with [updateMerchandise](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html#updateMerchandise) method:

```ts
const userId = 123456789;
const merchandiseId = '987654321';
const clientSecret = 'SUPER_SECRET_STRING';

const merchadiseData: DonationAlertsUpdateMerchandiseData = {
	title: {
		en_US: 'Updated English Title',
		ru_RU: 'Обновленный русский заголовок',
	},
	isActive: false,
};

const createdMerchandise = await apiClient.merchandise.updateMerchandise(
	userId,
	clientSecret,
	merchandiseId,
	merchadiseData,
);
```

Unlike [DonationAlertsCreateMerchandiseData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCreateMerchandiseData.html), in [DonationAlertsUpdateMerchandiseData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsUpdateMerchandiseData.html), all fields are optional, and you can selectively update merchandise data.

#### Sending sale notifications

To send merchandise sale notification use [sendSaleAlert](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html#sendSaleAlert) method:

```ts
const userId = 123456789;
const clientSecret = 'SUPER_SECRET_STRING';

const alertData: DonationAlertsSendMerchandiseSaleAlertData = {
	externalId: '<UNIQUE_ID_GENERATED_BY_DEVELOPER>',
	merchantIdentifier: '<MERCHANT_ID>',
	merchandiseIdentifier: '<MERCHANDISE_ID>',
	amount: 10,
	currency: 'EUR',
	username: '<USERNAME>',
};

await apiClient.merchandise.sendSaleAlert(userId, clientSecret, alertData);
```

Check the [DonationAlertsSendMerchandiseSaleAlertData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsSendMerchandiseSaleAlertData.html) documentation page to see all available alert data you can send.

### Rate Limits

According to the official [documentation](https://www.donationalerts.com/apidoc#introduction__http_api_requests__limitations), Donation Alerts API limits requests to the API methods for each application by 60 requests per minute, making it 1 request per second.

The library, by default, limits the number of requests to 1 per second. This means if you run, for example, 60 concurrent requests at the same time, they will be executed sequentially at 1 request per second.

To manage rate limit behavior, you can pass [rateLimiterOptions](https://stimulcross.github.io/donation-alerts/interfaces/api.ApiConfig.html#rateLimiterOptions) to the `ApiClient` constructor:

```ts
import { ApiClient } from '@donation-alerts/api';

const apiClient = new ApiClient({
	authProvider: authProvider,
	rateLimiterOptions: {
		limitToOneRequestPerSecond: true,
		limitReachedBehavior: 'enqueue',
	},
});
```

If you set [limitToOneRequestPerSecond](https://stimulcross.github.io/donation-alerts/interfaces/api.RateLimiterOptions.html#limitToOneRequestPerSecond) to `false`, you can reach the rate limit, let's say, in 10 seconds, and the library will not be able to send requests for the remaining 50 seconds of the available 60-second time window. So the client will be idle, waiting for a new time window. By default, this option is set to `true`.

You can also specify the limit reached behavior by setting [limitReachedBehavior](https://stimulcross.github.io/donation-alerts/interfaces/api.RateLimiterOptions.html#limitReachedBehavior). By default, this option is set to `enqueue`, which means that if a request reaches the rate limit, it will be enqueued and sent when possible. Other available options are `throw` and `null`. Read more about rate limiter options in the [documentation](https://stimulcross.github.io/donation-alerts/interfaces/api.RateLimiterOptions.html) page.

These settings define the default behavior of the rate limiter at the entire API client level, but you can specify the behavior of the rate limiter on a per-request basis. All methods of `ApiClient` namespaces allow you to specify the behavior of the rate limiter.

```ts
const user = await apiClient.users.getUser(123456789, {
	limitReachedBehavior: 'throw',
});
```

In this case, the method will throw `RateLimitReachedError` if the rate limit is reached.

### Undocumented fields

Donation Alerts data often includes fields that are not mentioned in the official documentation. While it's not safe to rely on these fields in production, I just want to inform you that you can access this data using [getRawData](https://stimulcross.github.io/donation-alerts/functions/common.getRawData.html) function from [@donation-alerts/common](https://stimulcross.github.io/donation-alerts/modules/common.html) package.

```ts
import { getRawData } from '@donation-alerts/common';

const userId = 123456789;
const donations = await apiClient.donations.getDonations(userId);
const rawData = getRawData(donations[0]);

console.log(rawData);
```

At the time of writing this documentation, the output looks like this:

```ts
interface DonationRawData {
	id: number;
	name: 'Donations';
	username: string;
	message: string;
	message_type: string;
	payin_system: { title: string } | null;
	amount: number;
	currency: string;
	is_shown: 0 | 1;
	amount_in_user_currency: number;
	recipient_name: string;
	recipient: {
		user_id: number;
		code: string;
		name: string;
		avatar: string;
	};
	created_at: string;
	created_at_ts: number;
	shown_at: string | null;
	shown_at_ts: number | null;
}
```

But again, you better avoid using undocumented fields.

---

For more information check the [documentation](https://stimulcross.github.io/donation-alerts/modules/api.html).
