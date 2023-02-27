# Donation Alerts - Events

A client that makes it very easy to listen to various Donation Alerts events.

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

1. [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) - Single user client.
2. [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html) - Multiple users client. This client internally creates a [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) for every user you add.

First of all, in order to be able to listen to Donation Alerts events you must create an [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html) instance. Check the [documentation](https://stimulcross.github.io/donation-alerts/modules/api.html) page to read more.

### Creating single user client

```ts
import { UserEventsClient } from '@donation-alerts/events';

const userId = 123456789;

const userEventsClient = new UserEventsClient({
	user: userId,
	apiClient: apiClient
});
```

You must provide [UserEventsClientConfig](https://stimulcross.github.io/donation-alerts/interfaces/events.UserEventsClientConfig.html) to the [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) constructor.

### Listening to events

After creating a [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) instance, you can now listen to events of your choice:

```ts
import {
	DonationAlertsDonationEvent,
	DonationAlertsGoalUpdateEvent,
	DonationAlertsPollUpdateEvent
} from '@donation-alerts/events';

const donationsListener = userEventsClient.onDonation((evt: DonationAlertsDonationEvent) => {
	console.log(evt);
});

const goalUpdatesListener = userEventsClient.onGoalUpdate((evt: DonationAlertsGoalUpdateEvent) => {
	console.log(evt);
});

const pollUpdatesListener = userEventsClient.onPollUpdate((evt: DonationAlertsPollUpdateEvent) => {
	console.log(evt);
});
```

It's that simple! These methods return an [EventsListener](https://stimulcross.github.io/donation-alerts/classes/events.EventsListener.html) instance.

Check the documentation pages of the event objects to explore all data you can use: [DonationAlertsDonationEvent](https://stimulcross.github.io/donation-alerts/classes/events.DonationAlertsDonationEvent.html), [DonationAlertsGoalUpdateEvent](https://stimulcross.github.io/donation-alerts/classes/events.DonationAlertsGoalUpdateEvent.html), [DonationAlertsPollUpdateEvent](https://stimulcross.github.io/donation-alerts/classes/events.DonationAlertsPollUpdateEvent.html)

If you no longer need any listener, you can remove it by calling [remove](https://stimulcross.github.io/donation-alerts/classes/events.EventsListener.html#remove) method of the [EventsListener](https://stimulcross.github.io/donation-alerts/classes/events.EventsListener.html) instance:

```ts
donationsListener.remove();
```

Or using [removeEventsListener](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#removeEventsListener) method of the [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) instance:

```ts
userEventsClient.removeEventsListener(donationsListener);
```

> **NOTE:** The user you want to set up listeners for, must be registered in [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) that you passed to the [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html) instance. The access token of the user also must have the required scopes to successfully subscribe to the private channels.

### Connection

The client automatically establishes a connection to Donation Alerts Centrifugo server when you are creating any listener as described above. If you remove all listeners, the connection will be automatically closed.

You can also manually manage the connection state by using [connect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#connect), [disconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#disconnect), or [reconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#reconnect) methods of the [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) instance.

[disconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#disconnect) method allow you to close the connection. The client will not attempt to reconnect after manually calling [disconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#disconnect) method. This method also accepts an optional boolean argument `removeListeners`. If you pass `true` argument, the client will remove all listeners. By default, it is set to `false`, so the client will keep listeners and will be able to restore them on the next manual connection.

```ts
userEventsClient.disconnect(true);
```

[connect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#connect) method establishes a connection to Donation Alerts Centrifugo server. This method accepts an optional boolean argument `restoreExistingListeners`. If you called [disconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#disconnect) method without removing listeners (default behavior), the client will be able to restore all listeners. By default, this is set to `true`.

```ts
userEventsClient.connect(true);
```

[reconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#reconnect) internally calls the [disconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#disconnect) method with the following call the [connect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#connect) method. You can pass an option boolean argument `removeListeners` to remove all existing listeners. By default, this is set to `false`, so the client will restore all listeners after reconnect.

The client establishes a persistent connection, so in most cases, it handles disconnections (such as network problems) and attempts to reconnect with exponential backoff (the first attempt performs immediately, and the maximum interval between attempts is 30 seconds).

To have full control over the connection, you'd better listen to [onConnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#onConnect) and [onDisconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#onDisconnect) events:

```ts
userEventsClient.onConnect(() => {
	console.log('CONNECTED');
});

userEventsClient.onDisconnect((reason: string, reconnect: boolean) => {
	console.log('DISCONNECTED', reason, reconnect);
});
```

The `reconnect` parameter of [onDisconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#onDisconnect) callback indicates whether the client will attempt to reconnect to the server. Handle it according to your needs.

### Creating multiple users client

If you have multiple users, you can consider using [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html), which is designed to work with multiple users. To create an [EventsClient]() instance, you must provide [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html) through [EventsClientConfig](https://stimulcross.github.io/donation-alerts/interfaces/events.EventsClientConfig.html).

```ts
import { EventsClient } from '@donation-alerts/events';

const eventsClient = new EventsClient({
	apiClient: apiClient
});
```

After creating an [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html) instance, you must register a user in the client using [addUser](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html#addUser) method. If the user you are registering already exists, this method will throw an error.

```ts
const userId = 123456789;
const userEventsClient = eventsClient.addUser(userId);
```

This method returns a [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) instance described above. You can, for example, set up [onConnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#onConnect) and [onDisconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#onDisconnect) listeners for it.

Creating event listeners is almost the as for [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html), but you also need provide user ID.

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

These methods also return an [EventsListener](https://stimulcross.github.io/donation-alerts/classes/events.EventsListener.html) instance. You can remove these listeners by calling [remove](https://stimulcross.github.io/donation-alerts/classes/events.EventsListener.html#remove) method. If you remove all listener for a single user, the connection for this user will be closed. But the user won't be removed from the [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html) instance, so you are able to restore connection any time.

To get the [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) instance for a single user from [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html) you can use [getUserClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html#getUserClient) method:

```ts
const userId = 123456789;
const userEventsClient = eventsClient.getUserClient(userId);
```

If the user you are trying to get the client for is not registered in [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html) instance, this method will throw an error.

If you don't want to listen for user events anymore, you can remove the user from [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html) by calling [removeUser](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html#removeUser) method:

```ts
const userId = 123456789;
const userEventsClient = eventsClient.removeUser(userId);
```

This method closes connection, removes all listeners, and removes the user from the [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html) instance.

---

For more information check the [documentation](https://stimulcross.github.io/donation-alerts/modules/events.html).
