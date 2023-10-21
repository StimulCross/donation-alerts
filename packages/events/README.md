# Donation Alerts - Events

A client that makes it very straightforward to listen to various Donation Alerts events.

## Installation

Using `npm`:

```
npm i @donation-alerts/events @donation-alerts/api
```

Using `yarn`:

```
yarn add @donation-alerts/events @donation-alerts/api
```

## Usage

You have 2 options to listen to events:

1. [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) - Single-user client.
2. [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html) - Multiple-user client. This client internally creates a `UserEventsClient` instance for each user you add.

First of all, in order to be able to listen to Donation Alerts events, you must create an [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html) instance. Check the [documentation](https://stimulcross.github.io/donation-alerts/modules/api.html) page to read more.

### Creating a single-user client

To instantiate a `UserEventsClient`, you must provide [UserEventsClientConfig](https://stimulcross.github.io/donation-alerts/interfaces/events.UserEventsClientConfig.html) to the `UserEventsClient` constructor.

```ts
import { ApiClient } from '@donation-alerts/api';
import { UserEventsClient } from '@donation-alerts/events';

const userId = 123456789;
const apiClient = new ApiClient({
	//...
});

const userEventsClient = new UserEventsClient({
	user: userId,
	apiClient: apiClient
});
```

#### Listening to events

After creating a `UserEventsClient` instance, you can now listen to events of your choice.

```ts
import {
	DonationAlertsDonationEvent,
	DonationAlertsGoalUpdateEvent,
	DonationAlertsPollUpdateEvent
} from '@donation-alerts/events';

const donationsListener = userEventsClient.onDonation((evt: DonationAlertsDonationEvent) => {
	// Handle the event...
});

const goalUpdatesListener = userEventsClient.onGoalUpdate((evt: DonationAlertsGoalUpdateEvent) => {
	// Handle the event...
});

const pollUpdatesListener = userEventsClient.onPollUpdate((evt: DonationAlertsPollUpdateEvent) => {
	// Handle the event...
});
```

It's that simple! These methods return an [EventsListener](https://stimulcross.github.io/donation-alerts/classes/events.EventsListener.html) instance.

Check the documentation pages of the event objects to explore all data you can use: [DonationAlertsDonationEvent](https://stimulcross.github.io/donation-alerts/classes/events.DonationAlertsDonationEvent.html), [DonationAlertsGoalUpdateEvent](https://stimulcross.github.io/donation-alerts/classes/events.DonationAlertsGoalUpdateEvent.html), [DonationAlertsPollUpdateEvent](https://stimulcross.github.io/donation-alerts/classes/events.DonationAlertsPollUpdateEvent.html)

If you no longer need any listeners, you can remove them by calling [remove](https://stimulcross.github.io/donation-alerts/classes/events.EventsListener.html#remove) method of the `EventsListener` instance.

```ts
await donationsListener.remove();
```

Or using [removeEventsListener](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#removeEventsListener) method of the `UserEventsClient` instance:

```ts
await userEventsClient.removeEventsListener(donationsListener);
```

> [!IMPORTANT]
> The user you want to set up listeners for must be added to the [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) that you passed to the [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html) instance. The access token of the user also must have the required scopes to successfully subscribe to the private channels.

#### Connection

The client automatically establishes a connection to the Donation Alerts Centrifugo server when you create any listener, as described above. If you remove all listeners, the connection will be automatically closed.

You can also manually manage the connection state by using [connect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#connect), [disconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#disconnect), or [reconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#reconnect) methods of the `UserEventsClient` instance.

#### `disconnect`

`disconnect` method closes the connection. The client will not attempt to reconnect after manually calling `disconnect` method. This method also accepts the optional boolean `removeListeners` argument. If you pass `true`, the client will remove all listeners. By default, it is set to `false`, so the client will store listeners and will be able to restore them on the next manual connection.

```ts
await userEventsClient.disconnect(true);
```

#### `connect`

`connect` method establishes a connection to a Donation Alerts Centrifugo server. This method accepts an optional boolean argument `restoreExistingListeners`. If you call `disconnect` method without removing listeners (the default behavior), the client will be able to restore all listeners. By default, this is set to `true`.

```ts
await userEventsClient.connect(true);
```

#### `reconnect`

`reconnect` internally calls `disconnect` method, followed by calling `connect` method. You can pass the optional boolean `removeListeners` argument to remove all existing listeners. By default, this is set to `false`, so the client will restore all listeners after reconnection.

The client establishes a persistent connection, so in most cases, it handles disconnections (such as network problems) and attempts to reconnect with exponential backoff (the first attempt performs immediately, and the maximum interval between attempts is 30 seconds).

If you want to have full control over the connection flow, you can listen to [onConnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#onConnect) and [onDisconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#onDisconnect) events:

```ts
userEventsClient.onConnect(() => {
	console.log('CONNECTED');
});

userEventsClient.onDisconnect((reason: string, reconnect: boolean) => {
	console.log('DISCONNECTED', reason, reconnect);
});
```

The `reconnect` parameter of the `onDisconnect` callback indicates whether the client will attempt to reconnect to the server. Handle it according to your needs.

### Creating a multiple-user client

If you need to listen to events of multiple users, consider using [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html). To create an `EventsClient` instance, you must provide `ApiClient` through [EventsClientConfig](https://stimulcross.github.io/donation-alerts/interfaces/events.EventsClientConfig.html).

```ts
import { ApiClient } from '@donation-alerts/api';
import { EventsClient } from '@donation-alerts/events';

const apiClient = new ApiClient({
	//...
});

const eventsClient = new EventsClient({
	apiClient: apiClient
});
```

#### Managing users

After creating an `EventsClient` instance, you should register users to be able to listen to events.

#### `addUser`

Adds a user to the client. If the user already exists, an error will be thrown.

```ts
import { UserEventsClient } from '@donation-alerts/events';

const userId = 123456789;
const userEventsClient: UserEventsClient = eventsClient.addUser(userId);
```

Returns a `UserEventsClient` instance.

#### `hasUser`

Checks whether a user was added to the client.

```ts
const userId = 123456789;
const hasUser: boolean = eventsClient.hasUser(userId);
```

Returns `boolean`.

#### `removeUser`

The client will be unsubscribed from all user channels, and the connection will be closed before actually removing the user from the client.

Does nothing if user is not added to the client.

```ts
const userId = 123456789;
eventsClient.removeUser(userId);
```

#### `getUserClient`

You can get the [UserEventsClientConfig](https://stimulcross.github.io/donation-alerts/interfaces/events.UserEventsClientConfig.html) of the user by using [getUserClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html#getUserClient) method.

```ts
const userId = 123456789;
const userEventsClient = eventsClient.getUserClient(userId);
```

#### Listening to events

Creating event listeners is almost the same as for `UserEventsClient`, but you also need to provide the ID of the user you want to listen to events from.

```ts
import {
	DonationAlertsDonationEvent,
	DonationAlertsGoalUpdateEvent,
	DonationAlertsPollUpdateEvent
} from '@donation-alerts/events';

const userId = 123456789;

const donationsListener = eventsClient.onDonation(userId, (evt: DonationAlertsDonationEvent) => {
	console.log(evt);
});

const goalUpdatesListener = eventsClient.onGoalUpdate(userId, (evt: DonationAlertsGoalUpdateEvent) => {
	console.log(evt);
});

const pollUpdatesListener = eventsClient.onPollUpdate(userId, (evt: DonationAlertsPollUpdateEvent) => {
	console.log(evt);
});
```

These methods return an `EventsListener` instance. You can remove these listeners by calling [remove](https://stimulcross.github.io/donation-alerts/classes/events.EventsListener.html#remove) method. If you remove all listeners for a single user, the connection for this user will be closed. The user's client won't be removed from the `EventsClient` instance, so you will be able to restore the connection at any time.

`EventsClient` also allows you to listen to connection events:

```ts
eventsClient.onConnect((userId: number) => {
	console.log(`[${userId}] CONNECTED`);
});

eventsClient.onDisconnect((userId: number, reason: string, reconnect: boolean) => {
	console.log(`[${userId}] DISCONNECTED`, reason, reconnect);
});
```

---

For more information check the [documentation](https://stimulcross.github.io/donation-alerts/modules/events.html).
