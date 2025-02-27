# Donation Alerts - Api Call

A lightweight wrapper for making API calls to Donation Alerts.

This package provides simple utilities for sending requests to various Donation Alerts API endpoints using provided credentials. Although it is mainly intended for internal use, some of its utilities may prove useful in your own code. For a more flexible and feature-rich experience with the Donation Alerts API, consider using the [@donation-alerts/api](https://stimulcross.github.io/donation-alerts/modules/api.html) package.

## Installation

#### Using `npm`:

```
npm i @donation-alerts/api-call
```

#### Using `yarn`:

```
yarn add @donation-alerts/api-call
```

#### Using `pnpm`:

```
pnpm add @donation-alerts/api-call
```

## Usage

You can call the Donation Alerts API in two ways:

1. **Using `callDonationAlertsApiRaw()`**: This function returns the native `Response` object from the Fetch API.

2. **Using `callDonationAlertsApi<T>()`**: This function returns only the payload data, which you can type via the generic parameter `T`.

Both functions accept the following arguments:

- **`options`**: [DonationAlertsApiCallOptions](https://stimulcross.github.io/donation-alerts/interfaces/api_call.DonationAlertsApiCallOptions.html)
- **`accessToken`** (optional): string
- **`fetchOptions`** (optional): [DonationAlertsCallFetchOptions](https://stimulcross.github.io/donation-alerts/types/api_call.DonationAlertsCallFetchOptions.html)

### Example: Fetching Raw Data

To fetch raw data from the `alerts/donations` endpoint:

```ts
import { callDonationAlertsApiRaw } from '@donation-alerts/api-call';

// Within an async function or when using top-level await:
const response = await callDonationAlertsApiRaw(
	{
		url: 'alerts/donations',
	},
	'<YOUR_ACCESS_TOKEN>',
);

// 'response' is the native Response object from the Fetch API.
```

### Example: Fetching Mapped Payload Data

To receive only the mapped payload data, you can do the following:

```ts
import { callDonationAlertsApi } from '@donation-alerts/api-call';

// Define an interface representing the expected payload.
interface PayloadData {
	// ...
}

const response = await callDonationAlertsApi<PayloadData>(
	{
		url: '<endpoint>',
	},
	'<YOUR_ACCESS_TOKEN>',
);

// 'response' is mapped to the PayloadData interface.
```

> [!NOTE]
> The above function may throw an [HttpError](https://stimulcross.github.io/donation-alerts/classes/api_call.HttpError.html), which you should catch and handle accordingly.

---

For more detailed information, please refer to the [documentation](https://stimulcross.github.io/donation-alerts/modules/api_call.html).
