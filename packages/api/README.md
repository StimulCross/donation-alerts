# Donation Alerts - API

A fully-featured API client that enables seamless access to the Donation Alerts API. This library offers complete coverage of all available API endpoints.

## Installation

#### Using `npm`:

```bash
npm i @donation-alerts/api @donation-alerts/auth
```

#### Using `yarn`:

```bash
yarn add @donation-alerts/api @donation-alerts/auth
```

#### Using `pnpm`:

```bash
pnpm add @donation-alerts/api @donation-alerts/auth
```

## Usage

To instantiate an [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html), you need to provide an [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) instance. For detailed instructions on setting up an `AuthProvider`, please refer to the [Authentication](https://stimulcross.github.io/donation-alerts/modules/auth.html) documentation.

```ts
import { ApiClient } from '@donation-alerts/api';

const apiClient = new ApiClient({
	authProvider: authProvider,
});
```

For a complete list of available configuration options, see the documentation for [ApiConfig](https://stimulcross.github.io/donation-alerts/interfaces/api.ApiConfig.html).

### Getting data

After creating the `ApiClient`, fetching data from the API becomes very straightforward. The client is organized into five namespaces:

- [users](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUsersApi.html)
- [donations](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html)
- [customAlerts](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCustomAlertsApi.html)
- [centrifugo](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html)
- [merchandises](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html)

> [!IMPORTANT]
> Ensure that the user is registered with the authentication provider instance specified in the [ApiConfig](https://stimulcross.github.io/donation-alerts/interfaces/api.ApiConfig.html). Otherwise, the library will not be able to retrieve the user's access token required for requests, and it will throw an [UnregisteredUserError](https://stimulcross.github.io/donation-alerts/classes/auth.UnregisteredUserError.html).

---

#### [Users API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUsersApi.html)

**Required scope:** `oauth-user-show`

Currently, the Donation Alerts API only supports fetching the user associated with the access token used in the request.

```ts
const user = await apiClient.users.getUser(123456789);
```

This returns an instance of [DonationAlertsUser](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUser.html).

Additionally, you can directly fetch the socket connection token:

```ts
const connectionToken = await apiClient.users.getSocketConnectionToken(123456789);
```

---

#### [Donations API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html)

**Required scope:** `oauth-donation-index`

There are multiple ways to retrieve a user's donations.

##### getDonations

The [getDonations](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html#getDonations) method accepts a user ID as its first argument:

```ts
const userId = 123456789;
const donations = await apiClient.donations.getDonations(userId);
```

This returns an array of [DonationAlertsDonation](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonation.html) objects.

This method returns an array of [DonationAlertsDonation](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonation.html) objects. By default, only the first page of donations is returned; to request a specific page, pass pagination options as the second argument:

```ts
const userId = 123456789;
const donations = await apiClient.donations.getDonations(userId, { page: 2 });
```

##### getAllDonations

If you need to fetch all donations at once, you can use the [getAllDonations](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html#getAllDonations) method:

```ts
const donations = await apiClient.donations.getAllDonations(123456789);
```

This returns an array of [DonationAlertsDonation](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonation.html) objects.

> [!WARNING]
> Use this method with caution. Retrieving all donations can result in a significant amount of data and may take a long time, potentially causing performance issues or application crashes.

##### createDonationsPaginator

For more flexible pagination, the [DonationAlertsApiPaginator](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html) class is available. This paginator allows you to navigate pages in both directions while keeping track of the current state.

```ts
const userId = 123456789;
const paginator = apiClient.donations.createDonationsPaginator(userId);
```

Once you have a paginator instance, you can navigate between pages using its methods:

- [getNext](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getNext) – Retrieves the next page. Returns an empty array if there are no further pages.
- [getPrev](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getPrev) – Retrieves the previous page. If already on the first page, it returns that same page.
- [getPage](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getPage) – Retrieves a specific page. If the page does not exist, it returns an empty array.
- [getAll](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getAll) – Retrieves all available donations. Use with caution due to potential performance drawbacks.

```ts
const nextPage = await paginator.getNext();
const prevPage = await paginator.getPrev();
const page5 = await paginator.getPage(5);
const donations = await paginator.getAll();
```

The paginator also supports asynchronous iteration, yielding an array of donations for each page:

```ts
const userId = 123456789;
const paginator = apiClient.donations.createDonationsPaginator(userId);

for await (const page of paginator) {
	console.log(page);
}
```

In addition, the paginator provides useful properties to inspect the current state, such as [currentPage](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#currentPage), [totalPages](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#totalPages), [perPage](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#perPage), and others. For a complete list of available properties and methods, refer to the paginator [documentation](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html).

You can reset the paginator’s state at any time using the [reset](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#reset) method:

```ts
paginator.reset();
```

---

#### [Custom Alerts API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCustomAlertsApi.html)

**Required scope:** `oauth-custom_alert-store`

Donation Alerts supports custom alerts. When a broadcaster creates a widget with the `Custom alert` variation type, you can send alerts to that widget using this API.

```ts
await apiClient.customAlerts.sendCustomAlert(123456789, {
	header: 'Custom Alert',
	message: 'Hello!',
});
```

That's it — the widget triggers the alert immediately. For a complete list of configuration options when sending custom alerts, please refer to the [DonationAlertsSendCustomAlertData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsSendCustomAlertData.html) documentation.

---

#### [Centrifugo API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html)

Donation Alerts supports real-time notifications over the WebSocket protocol. To receive these notifications, you must subscribe to the private channels you’re interested in. This API simplifies that process.

> [!IMPORTANT]
> You must obtain a UUIDv4 client ID to subscribe users. This client ID is **NOT** the same as your Donation Alerts application client ID. For more details, consult the official Donation Alerts [documentation](https://www.donationalerts.com/apidoc).

> [!TIP]
> If you need to listen to real-time Donation Alerts notifications, consider using the [@donation-alerts/events](https://stimulcross.github.io/donation-alerts/modules/events.html) package. It offers a straightforward way to subscribe to Donation Alerts channels without additional configuration.

To subscribe to private channels, use the [subscribeUserToPrivateChannels](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToPrivateChannels) method:

```ts
const userId = 123456789;
const clientId = '<OBTAINED_UUIDV4_CLIENT_ID>';

const channels = await apiClient.centrifugo.subscribeUserToPrivateChannels(userId, clientId, [
	'$alerts:donation',
	'$goals:goal',
	'$polls:poll',
]);
```

This method returns an array of [DonationAlertsCentrifugoChannel](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoChannel.html) objects, each containing a channel name and a subscription token.

To subscribe to a private channel, DonationAlerts requires the channel name to follow the format `<channel>_<userId>`, but you don't need to create the complete name manually. For instance, if you wish to subscribe to donation notifications (`$alerts:donation`) for a user with the ID `123456789`, simply provide the base channel name. The library will automatically append the user ID to form the full channel name: `$alerts:donation_123456789`.

If you prefer to pass an already fully formed channel name and disable the automatic transformation, provide [DonationAlertsCentrifugoSubscribeOptions](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCentrifugoSubscribeOptions.html) as the fourth argument with the property `transformChannel` set to `false`:

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

In addition to this generic method, there are specialized methods to subscribe to specific notification channels:

- [subscribeUserToDonationAlertEvents](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToDonationAlertEvents)
- [subscribeUserToGoalUpdateEvents](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToGoalUpdateEvents)
- [subscribeUserToPollUpdateEvents](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToPollUpdateEvents)

For example:

```ts
const userId = 123456789;
const clientId = '<OBTAINED_UUIDV4_CLIENT_ID>';

const donationChannel = await apiClient.centrifugo.subscribeUserToDonationAlertEvents(userId, clientId);
const goalUpdateChannel = await apiClient.centrifugo.subscribeUserToGoalUpdateEvents(userId, clientId);
const pollUpdateChannel = await apiClient.centrifugo.subscribeUserToPollUpdateEvents(userId, clientId);
```

These methods also accept [DonationAlertsCentrifugoSubscribeOptions](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCentrifugoSubscribeOptions.html) as an optional parameter, allowing you to disable channel transformation if needed.

---

#### [Merchandise API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html)

> [!WARNING]
> Merchandise API hasn't been tested because access to these endpoints is provided upon request. Please refer to the official [documentation](https://www.donationalerts.com/apidoc#advertisement__merchandises) for more details.

DonationAlerts enables merchants to sell their merchandise by providing API methods to create or update products and to send sale notifications.

#### Creating merchandise

To create merchandise, use the [createMerchandise](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html#createMerchandise) method:

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

For details on all available merchandise options, see the [DonationAlertsCreateMerchandiseData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCreateMerchandiseData.html) documentation.

> [!NOTE]
> The `en_US` title is mandatory, while other language titles are optional.

#### Updating merchandise

Updating merchandise is straightforward with the [updateMerchandise](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html#updateMerchandise) method:

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

Unlike [DonationAlertsCreateMerchandiseData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCreateMerchandiseData.html), all fields in [DonationAlertsUpdateMerchandiseData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsUpdateMerchandiseData.html) are optional, allowing you to update only the desired values.

#### Creating or updating merchandise

A combined [createOrUpdateMerchandise](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html#createOrUpdateMerchandise) method which allows updating merchandise, or create if it doesn't exist yet:

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

const merchandise = await apiClient.merchandise.createOrUpdateMerchandise(userId, clientSecret, merchadiseData);
```

#### Sending sale notifications

To send a merchandise sale notification, use the [sendSaleAlert](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html#sendSaleAlert) method:

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

For a complete list of available alert data fields, refer to the [DonationAlertsSendMerchandiseSaleAlertData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsSendMerchandiseSaleAlertData.html) documentation.

### Rate Limits

According to the [official documentation](https://www.donationalerts.com/apidoc#introduction__http_api_requests__limitations), the Donation Alerts API restricts each application to 60 requests per minute — essentially, 1 request per second.

By default, the library enforces this limit, so even if you initiate 60 concurrent requests, they will be executed one by one at a rate of 1 per second.

You can adjust rate the limiter behavior by providing [rateLimiterOptions](https://stimulcross.github.io/donation-alerts/interfaces/api.ApiConfig.html#rateLimiterOptions) to the `ApiClient` constructor:

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

Setting [limitToOneRequestPerSecond](https://stimulcross.github.io/donation-alerts/interfaces/api.RateLimiterOptions.html#limitToOneRequestPerSecond) to `false` means that you might reach the rate limit sooner (for example, 60 requests in 10 seconds), after which the library will be idle until the next 60-second window. By default, this option is enabled.

Furthermore, you can specify the behavior when the rate limit is reached using [limitReachedBehavior](https://stimulcross.github.io/donation-alerts/interfaces/api.RateLimiterOptions.html#limitReachedBehavior). The default is `enqueue`, which queues requests that exceed the rate limit until they can be sent. Other options include `throw` and `null`. For more details, refer to the [documentation](https://stimulcross.github.io/donation-alerts/interfaces/api.RateLimiterOptions.html).

These settings define the default behavior at the API client level; however, you can override them on a per-request basis. For instance:

```ts
const user = await apiClient.users.getUser(123456789, {
	limitReachedBehavior: 'throw',
});
```

In this scenario, the method will throw a `RateLimitReachedError` if the rate limit is exceeded.

### Undocumented fields

Donation Alerts responses often include fields not mentioned in the official documentation. Although it is not recommended to rely on these undocumented fields in production, you can access the raw data using the [getRawData](https://stimulcross.github.io/donation-alerts/functions/common.getRawData.html) function from the [@donation-alerts/common](https://stimulcross.github.io/donation-alerts/modules/common.html) package:

```ts
import { getRawData } from '@donation-alerts/common';

const userId = 123456789;
const donations = await apiClient.donations.getDonations(userId);
const rawData = getRawData(donations[0]);

console.log(rawData);
```

At the time of writing, the output resembles the following structure:

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

It is advisable to avoid depending on undocumented fields as their structure may change.

---

For additional information, please refer to the [documentation](https://stimulcross.github.io/donation-alerts/modules/api.html).
