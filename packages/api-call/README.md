# Donation Alerts - Api Call

A basic Donation Alerts API call wrapper.

This package contains simple utils that allow you to send requests to different Donation Alerts API endpoints with given credentials.

If you need to use the Donation Alerts API, consider using the [@donation-alerts/api](https://stimulcross.github.io/donation-alerts/modules/api.html) package, which allows for more flexibility and convenience in requesting data from the Donation Alerts API. The [@donation-alerts/api](https://stimulcross.github.io/donation-alerts/modules/api.html) package already uses this package internally, so you don't need to install it separately.

But if you still need it:

## Installation

Using `npm`:

```
npm i @donation-alerts/api-call
```

Using `yarn`:

```
yarn add @donation-alerts/api-call
```

## Usage

You can call Donation Alerts API in one of two ways:

1. Using `callDonationAlertsApiRaw()` function to get native `Response` object.
2. Using `callDonationAlertsApi<T>()` function to get only payload data. You can specify data type in the type parameter `T`.

The both functions accepts the same arguments:

- `options`: [DonationAlertsApiCallOptions](https://stimulcross.github.io/donation-alerts/interfaces/api_call.DonationAlertsApiCallOptions.html)
- `accessToken`?: string
- `fetchOptions`?: [DonationAlertsCallFetchOptions](https://stimulcross.github.io/donation-alerts/types/api_call.DonationAlertsCallFetchOptions.html)

You can do the following to request raw data, for example, from `alerts/donations` endpoint:

```ts
import { callDonationAlertsApiRaw } from '@donation-alerts/api-call';

// Assuming we are inside an async funcation or with top level `await` enabled.
const response = await callDonationAlertsApiRaw(
	{
		url: 'alerts/donations',
	},
	'<YOUR_ACCESS_TOKEN>',
);
```

The `response` will be native `Response` object of the [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

To request only payload mapped data, you can do the following:

```ts
import { callDonationAlertsApi } from '@donation-alerts/api-call';

// Create an interface that represents the data you expect to receive.
interface PayloadData {
	// ...
}

const response = await callDonationAlertsApi<PayloadData>(
	{
		url: '<endpoint>',
	},
	'<your access token>',
);
```

The `response` will be mapped to the `PayloadData` interface that we passed as a type parameter.

The function above can throw the [HttpError](https://stimulcross.github.io/donation-alerts/classes/api_call.HttpError.html) which you can catch and use.

---

For more information check the [documentation](https://stimulcross.github.io/donation-alerts/modules/api_call.html).
