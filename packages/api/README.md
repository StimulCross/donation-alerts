# Donation Alerts - API

API client that allows fetching data from Donation Alerts API. The library covers 100% of available API endpoints.

## Installation

Using `npm`:

```
npm i @donation-alerts/api
```

Using `yarn`:

```
yarn add @donation-alerts/api
```

## Usage

To create an API client you must provide [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html). Read the [Authentication](https://stimulcross.github.io/donation-alerts/modules/auth.html) documentation to learn how to create an [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) instance.

```ts
import { ApiClient } from '@donation-alerts/api';

const apiClient = new ApiClient({
	authProvider: authProvider
});
```

Check the [ApiConfig](https://stimulcross.github.io/donation-alerts/interfaces/api.ApiConfig.html) documentation page to see all available configuration options.

### Getting data

After creating the [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html) it's very straightforward to get data from the API. The [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html) has 5 namespaces:

-   [users](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUsersApi.html)
-   [donations](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html)
-   [customAlerts](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCustomAlertsApi.html)
-   [centrifugo](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html)
-   [merchandises](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html)

> **Note:** The user must be registered in the auth provider instance you provided in the [ApiConfig](https://stimulcross.github.io/donation-alerts/interfaces/api.ApiConfig.html). Otherwise, the library won't be able to obtain the user access token to perform request and will throw [UnregisteredUserError](https://stimulcross.github.io/donation-alerts/classes/auth.UnregisteredUserError.html).

---

#### [Users API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUsersApi.html)

**Required scope:** `oauth-user-show`

Donation Alerts API currently supports only getting the user associated with the access token used in the request.

```ts
const user = await apiClient.users.getUser(123456789);
```

The method returns [DonationAlertsUser](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUser.html) instance.

There is also a direct way to retrieve the socket connection token from [DonationAlertsUser](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsUser.html) instance:

```ts
const user = await apiClient.users.getSocketConnectionToken(123456789);
```

---

#### [Donations API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html)

**Required scope:** `oauth-donation-index`

There are numerous ways to get user donations.

```ts
const donations = await apiClient.donations.getDonations(123456789);
```

The `donations` will be an array of [DonationAlertsDonation](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonation.html) object.

But this method returns only the first page of the donations. To choose the page of donations you want to retrieve, you can specify pagination data in the second argument:

```ts
const donations = await apiClient.donations.getDonations(123456789, { page: 2 });
```

Now [getDonations](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html#getDonations) method returns the second page.

If you want to get all donations you can use [getAllDonations](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsDonationsApi.html#getAllDonations) method. Keep in mind that the more donations user has, the more time it will take to fetch all.

```ts
const donations = await apiClient.donations.getAllDonations(123456789);
```

There is the more flexible way getting user donations - [DonationAlertsApiPaginator](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html). It helps to navigate pages easily and has a state. To create the paginator for donations you can do the following:

```ts
const paginator = apiClient.donations.createDonationsPaginator(123456789);
```

After creating the paginator, you can use its methods to navigate pages:

-   [getNext](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getNext) - Gets the next page. If you reached the last page, this method returns an empty array.
-   [getPrev](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getPrev) - Gets the previous page. If you already on the first page, this method returns it back.
-   [getPage](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getPage) - Gets the specified page. If page does not exist, this method returns an empty array.
-   [getAll](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#getAll) - Gets all available donations.
-

```ts
const nextPage = await paginator.getNext();
const prevPage = await paginator.getPrev();
const page5 = await paginator.getPage(5);
const donations = await paginator.getAll();
```

The paginator also supports async iterations. It returns an array of page donations per iteration.

```ts
const paginator = apiClient.donations.createDonationsPaginator(123456789);

for await (const donations of paginator) {
	console.log(donations);
}
```

To flexibly control the process, the paginator has the state, such as [currentPage](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#currentPage), [totalPages](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#totalPages), and [perPage](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#perPage). To see the full list of available properties and methods check the paginator [documentation](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html) page.

You can reset the state at any time with [reset](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsApiPaginator.html#reset) method:

```ts
paginator.reset();
```

The paginator is the recommended way to fetch donations.

---

#### [Custom Alerts API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCustomAlertsApi.html)

**Required scope:** `oauth-custom_alert-store`

Donation Alerts supports custom alerts. If a broadcaster creates a variation with `Custom alert` type you can send alerts to this variation via this API.

```ts
await apiClient.customAlerts.sendCustomAlert(123456789, {
	header: 'Custom Alert',
	message: 'Hello!',
	shouldShow: true
});
```

That's it! The widget should show this alert. Check [DonationAlertsSendCustomAlertData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsSendCustomAlertData.html) documentation page to see all available options you can use with custom alerts.

---

#### [Centrifugo API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html)

Donation Alerts supports real-time notifications over WebSocket protocol. To be able to listen to real-time notifications, you must subscribe to the private channels of your choice. This API takes this task.

> **NOTE:** You must obtain an UUIDv4 client ID to subscribe users. This client ID is **NOT** the same as your Donation Alerts application client ID. Read more in the official Donation Alerts [documentation](https://www.donationalerts.com/apidoc#advertisement).

> If you need to listen to real-time Donation Alerts notifications, consider using the [@donation-alerts/events](https://stimulcross.github.io/donation-alerts/modules/events.html) package. This library makes it very straightforward to listen to supported Donation Alerts channels without any extra actions.

To subscribe to private channels you can use [subscribeUserToPrivateChannels](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToPrivateChannels) method:

```ts
const userId = 123456789;
const clientId = '<OBTAINED_UUIDV4_CLIENT_ID>';

const channels = await apiClient.centrifugo.subscribeUserToPrivateChannels(userId, clientId, [
	'$alerts:donation',
	'$goals:goal',
	'$polls:poll'
]);
```

The `channels` will be an array of [DonationAlertsCentrifugoChannel](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoChannel.html) objects, that contain channel name and connection token.

To subscribe to a private channel, the channel name must be the following form: `<channel>_<userId>`. If you need subscribe user `123456789` to channel `$alerts:donation`, you don't usually need to transform channel name yourself, the library transforms channel names itself. The result will be joined channel name and user ID: `$alerts:donation_123456789`.

But if for some reason you are passing already transformed channel names, then you can disable this behavior by passing [DonationAlertsCentrifugoSubscribeOptions]() as the fourth argument with property `transformChannel: false`:

```ts
const userId = 123456789;
const clientId = '<OBTAINED_UUIDV4_CLIENT_ID>';

const channels = await apiClient.centrifugo.subscribeUserToPrivateChannels(
	userId,
	clientId,
	// HERE YOU ARE PASSING ALREADY VALID CHANNEL NAME WITH USER ID.
	['$alerts:donation_123456789'],
	{
		transformChannel: false
	}
);
```

In this case, the library won't join channel name and user ID.

In addition to the above method, you can use special methods: [subscribeUserToDonationAlertEvents](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToDonationAlertEvents), [subscribeUserToGoalUpdateEvents](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToGoalUpdateEvents), [subscribeUserToPollUpdateEvents](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsCentrifugoApi.html#subscribeUserToPollUpdateEvents). For example:

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

> **WARNING:** [Merchandise API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html) wasn't tested because of access to these API endpoints is given as per request. Check the official [documentation](https://www.donationalerts.com/apidoc#advertisement__merchandises) to read more.

Donation Alerts allow the merchant to sell their merchandise and provides the API methods to create and update merchandise, and send sale notifications.

> **WARNING:** All [Merchandise API](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html) endpoints require your Donation Alerts application client secret. They SHOULD NOT be used on the front-end, because you will leak your client secret.

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
		ru_RU: 'Русский заголовок'
	},
	isActive: true,
	isPercentage: true,
	currency: 'EUR',
	priceUser: 5,
	priceService: 2,
	url: '<MERCHANDISE_WEB_PAGE_URL>',
	imgUrl: '<IMAGE_URL>',
	endTimestamp: 1660632051919
};

const createdMerchandise = await apiClient.merchandise.createMerchandise(userId, clientSecret, merchadiseData);
```

To read about all available merchandise options you can check the [DonationAlertsCreateMerchandiseData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCreateMerchandiseData.html) documentation page.

Note that `en_US` title is required, but any other languages are optional.

#### Updating merchandise

Updating the merchandise is also very straightforward with [updateMerchandise](https://stimulcross.github.io/donation-alerts/classes/api.DonationAlertsMerchandiseApi.html#updateMerchandise) method:

```ts
const userId = 123456789;
const merchandiseId = '987654321';
const clientSecret = 'SUPER_SECRET_STRING';

const merchadiseData: DonationAlertsUpdateMerchandiseData = {
	title: {
		en_US: 'Updated English Title',
		ru_RU: 'Обновленный русский заголовок'
	},
	isActive: false
};

const createdMerchandise = await apiClient.merchandise.updateMerchandise(
	userId,
	clientSecret,
	merchandiseId,
	merchadiseData
);
```

Unlike [DonationAlertsCreateMerchandiseData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsCreateMerchandiseData.html), in [DonationAlertsUpdateMerchandiseData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsUpdateMerchandiseData.html) all fields are optional, and you can selectively update merchandise data.

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
	username: '<USERNAME>'
};

await apiClient.merchandise.sendSaleAlert(userId, clientSecret, alertData);
```

Check the [DonationAlertsSendMerchandiseSaleAlertData](https://stimulcross.github.io/donation-alerts/interfaces/api.DonationAlertsSendMerchandiseSaleAlertData.html) documentation page to see all available alert data you can send.

### Rate Limits

According to the official [documentation](https://www.donationalerts.com/apidoc#introduction__http_api_requests__limitations), Donation Alerts API limits requests to the API methods for each application by 60 requests per minute, making it 1 request per second.

The library, by default, limits the number of requests to 1 per second. This means that if you run, for example, 60 concurrent requests at the same time, they will be executed sequentially at 1 request per second.

To manage rate limit behavior you can pass [rateLimiterOptions](https://stimulcross.github.io/donation-alerts/interfaces/api.ApiConfig.html#rateLimiterOptions) to the ApiClient constructor:

```ts
import { ApiClient } from '@donation-alerts/api';

const apiClient = new ApiClient({
	authProvider: authProvider,
	rateLimiterOptions: {
		limitToOneRequestPerSecond: true,
		limitReachedBehavior: 'enqueue'
	}
});
```

If you set [limitToOneRequestPerSecond](https://stimulcross.github.io/donation-alerts/interfaces/api.RateLimiterOptions.html#limitToOneRequestPerSecond) to `false`, you can reach the rate limit let's say in 10 seconds, and the library will not be able to send requests for the remaining 50 seconds of the available 60 seconds time window. So the client will be idle waiting for a new time window. By default, this options set to `true`.

You can also specify the behavior of rate limit reaching by setting [limitReachedBehavior](https://stimulcross.github.io/donation-alerts/interfaces/api.RateLimiterOptions.html#limitReachedBehavior). By default, this option is set to `enqueue`, which means that if a request reached the rate limit it will be enqueued and sent when possible. Other available options are `throw` and `null`. Read more about rate limiter options in the [documentation](https://stimulcross.github.io/donation-alerts/interfaces/api.RateLimiterOptions.html) page.

These settings define the default behavior of the rate limiter at the entire API client level, but you can specify the behavior of the rate limiter on a per-request basis. All methods of [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html) namespaces allow you to specify the behavior of the rate limiter. For example:

```ts
const user = await apiClient.users.getUser(123456789, {
	limitReachedBehavior: 'throw'
});
```

In this case, the method will throw `RateLimitReachedError` if the rate limit is reached.

### Undocumented fields

Donation Alerts data often includes fields, that are not mentioned in the official documentation. While it's not safe to rely on these fields in production, I just want to inform you that you can access this data using [getRawData](https://stimulcross.github.io/donation-alerts/functions/common.getRawData.html) function from [@donation-alerts/common](https://stimulcross.github.io/donation-alerts/modules/common.html) package.

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
