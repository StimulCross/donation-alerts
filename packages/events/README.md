# Donation Alerts - Events

A simple and efficient client for subscribing to various Donation Alerts events.

## Installation

Using `npm`:

```
npm i @donation-alerts/events @donation-alerts/api
```

Using `yarn`:

```
yarn add @donation-alerts/events @donation-alerts/api
```

Using `pnpm`:

```
pnpm add @donation-alerts/events @donation-alerts/api
```

## Usage

### Event Clients

There are two primary clients to listen to events:

1. **[UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html)**: A client designed for a single user.
2. **[EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html)**: A multi-user client that internally creates a `UserEventsClient` for each user added.

Before subscribing to events, you need an instance of [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html). Refer to the [ApiClient documentation](https://stimulcross.github.io/donation-alerts/modules/api.html) for setup details.

---

### Creating a Single-User Client

To create an instance of `UserEventsClient`, provide a [UserEventsClientConfig](https://stimulcross.github.io/donation-alerts/interfaces/events.UserEventsClientConfig.html) object to its constructor.

```ts
import { ApiClient } from '@donation-alerts/api';
import { UserEventsClient } from '@donation-alerts/events';

const userId = 123456789;
const apiClient = new ApiClient({
	//...
});

const userEventsClient = new UserEventsClient({
	user: userId,
	apiClient: apiClient,
});
```

#### Listening to events

After creating a `UserEventsClient` instance, you can now listen to events of your choice.

```ts
import {
	DonationAlertsDonationEvent,
	DonationAlertsGoalUpdateEvent,
	DonationAlertsPollUpdateEvent,
} from '@donation-alerts/events';

// Listening to donations
const donationsListener = userEventsClient.onDonation((evt: DonationAlertsDonationEvent) => {
	console.log('New donation received:', evt);
});

// Listening to goal updates
const goalUpdatesListener = userEventsClient.onGoalUpdate((evt: DonationAlertsGoalUpdateEvent) => {
	console.log('Goal updated:', evt);
});

// Listening to poll updates
const pollUpdatesListener = userEventsClient.onPollUpdate((evt: DonationAlertsPollUpdateEvent) => {
	console.log('Poll updated:', evt);
});
```

Each of the methods above returns an [EventsListener](https://stimulcross.github.io/donation-alerts/classes/events.EventsListener.html) instance.

For detailed information on event data structures, refer to the documentation pages of the respective event classes:

- [DonationAlertsDonationEvent](https://stimulcross.github.io/donation-alerts/classes/events.DonationAlertsDonationEvent.html)
- [DonationAlertsGoalUpdateEvent](https://stimulcross.github.io/donation-alerts/classes/events.DonationAlertsGoalUpdateEvent.html)
- [DonationAlertsPollUpdateEvent](https://stimulcross.github.io/donation-alerts/classes/events.DonationAlertsPollUpdateEvent.html)

---

#### Removing Event Listeners

If you no longer require a listener, you can remove it in one of two ways.

- Using the `EventsListener` instance:

    ```ts
    await donationsListener.remove();
    ```

- Using the `removeEventsListener` method of the `UserEventsClient`:

    ```ts
    await userEventsClient.removeEventsListener(donationsListener);
    ```

> [!IMPORTANT]
> The user being listened to **must be added** to the [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) provided to the [ApiClient](https://stimulcross.github.io/donation-alerts/classes/api.ApiClient.html), and their access token must include the necessary scopes for subscribing to private channels.

#### Connection Management

The client automatically manages its connection to the Donation Alerts Centrifugo server. A connection is established when you create the first listener, and it is automatically closed once all listeners are removed.

You can also manually manage the connection state by using [connect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#connect), [disconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#disconnect), or [reconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#reconnect) methods of the `UserEventsClient` instance.

- **[disconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#disconnect)** - Closes the connection to the server. After calling `disconnect`, the client will **not attempt to reconnect automatically**.

    The method accepts an optional `removeListeners` argument (boolean).

    If `removeListeners` is set to `true`, all event listeners will be permanently removed.
    If omitted or set to `false` (default), the client retains the listeners and is able to restore them during the next connection attempt.

    ```ts
    // Disconnect and remove all listeners.
    await userEventsClient.disconnect(true);
    ```

- **[connect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#connect)** - Establishes a connection to the Donation Alerts Centrifugo server. If listeners were retained during a previous disconnection, this method can restore them automatically.

    The method accepts an optional `restoreExistingListeners` argument (boolean).
    When `restoreExistingListeners` is `true` (default), previously stored listeners are restored automatically.
    Pass `false` to skip restoring listeners.

    ```ts
    // Reconnect and restore all listeners.
    await userEventsClient.connect(true);
    ```

- **[reconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#reconnect)** - This method performs both `disconnect` and `connect` operations in sequence.

    The method accepts an optional `removeListeners` argument (boolean):
    When `removeListeners` is `false` (default), the client restores all listeners after reconnection.
    If `true`, all listeners are removed during the disconnection step.

    The client uses a **persistent connection** and automatically handles unplanned disconnections (e.g., network issues). Reconnection attempts follow an **exponential backoff strategy**:
    The first reconnection attempt happens immediately.
    The maximum interval between attempts is capped at 30 seconds.

    ```ts
    // Reconnect and restore listeners.
    await userEventsClient.reconnect();
    // Reconnect and remove all listeners.
    await userEventsClient.reconnect(true);
    ```

---

#### Connection Events

You can monitor the connection status by subscribing to [onConnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#onConnect) and [onDisconnect](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html#onDisconnect) callbacks.

- **onConnect**: Triggered whenever a connection to the server is established.

    ```ts
    userEventsClient.onConnect(() => {
    	console.log('Connection established!');
    });
    ```

- **onDisconnect**: Triggered whenever the client disconnects from the server. The callback provides two arguments:

    - `reason`: A string describing the reason for the disconnection.
    - `reconnect`: A boolean indicating whether the client will attempt to reconnect automatically.

    ```ts
    userEventsClient.onDisconnect((reason: string, reconnect: boolean) => {
    	console.log(`Disconnected: ${reason}`);
    	console.log(`Will attempt to reconnect: ${reconnect}`);
    });
    ```

These callbacks allow fine-grained control over the connection state. Use them as needed to handle both planned and unexpected disconnection events.

### Creating a Multiple-User Client

When you need to listen to events for multiple users, use the [EventsClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html). This client simplifies managing events across different users. To create an `EventsClient` instance, provide an `ApiClient` through the [EventsClientConfig](https://stimulcross.github.io/donation-alerts/interfaces/events.EventsClientConfig.html).

```ts
import { ApiClient } from '@donation-alerts/api';
import { EventsClient } from '@donation-alerts/events';

const apiClient = new ApiClient({
	// Provide your ApiClient configuration here
});

const eventsClient = new EventsClient({
	apiClient: apiClient,
});
```

#### Managing Users

Once you have an `EventsClient` instance, you must add users to it in order to start listening to their events.

- **[addUser](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html#addUser)** - Registers a user in the `EventsClient`. If the user is already registered, an error will be thrown.

    ```ts
    import { UserEventsClient } from '@donation-alerts/events';

    const userId = 123456789;
    const userEventsClient = eventsClient.addUser(userId);
    ```

    Returns a [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) instance for the user.

- **[hasUser](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html#hasUser)** - Checks whether a specific user is already added to the client.

    ```ts
    const userId = 123456789;
    const hasUser = eventsClient.hasUser(userId);
    ```

    Returns `boolean`.

- **[removeUser](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html#removeUser)** - Unsubscribes the client from this user's channels and closes the connection before removing the user from the client. This method does nothing if the user is not registered.

    ```ts
    const userId = 123456789;
    eventsClient.removeUser(userId);
    ```

- **[getUserClient](https://stimulcross.github.io/donation-alerts/classes/events.EventsClient.html#getUserClient)** - Retrieves the [UserEventsClient](https://stimulcross.github.io/donation-alerts/classes/events.UserEventsClient.html) instance for a specific user.

    ```ts
    const userId = 123456789;
    const userEventsClient = eventsClient.getUserClient(userId);
    ```

---

#### Listening to Events

Creating listeners for events in `EventsClient` is similar to `UserEventsClient`, with the additional requirement of specifying a user ID.

```ts
import {
	DonationAlertsDonationEvent,
	DonationAlertsGoalUpdateEvent,
	DonationAlertsPollUpdateEvent,
} from '@donation-alerts/events';

const userId = 123456789;

// Listening to donations for a user
const donationsListener = eventsClient.onDonation(userId, (evt: DonationAlertsDonationEvent) => {
	console.log(`Donation event for user ${userId}: `, evt);
});

// Listening to goal updates for a user
const goalUpdatesListener = eventsClient.onGoalUpdate(userId, (evt: DonationAlertsGoalUpdateEvent) => {
	console.log(`Goal update event for user ${userId}: `, evt);
});

// Listening to poll updates for a user
const pollUpdatesListener = eventsClient.onPollUpdate(userId, (evt: DonationAlertsPollUpdateEvent) => {
	console.log(`Poll update event for user ${userId}: `, evt);
});
```

These methods return an `EventsListener` instance. You can remove these listeners by using the `remove` method:

```ts
await donationsListener.remove();
```

If you remove all listeners for a specific user, the connection for that user will be closed. However, the `UserEventsClient` instance for the user will not be removed from the `EventsClient`. This means you can restore the connection at a later time.

`EventsClient` also allows you to listen to connection events:

---

#### Connection Events

The `EventsClient` also supports listening to user-specific connection states. This can be helpful for managing user-specific workflows.

```ts
// Listening for connection establishment
eventsClient.onConnect((userId: number) => {
	console.log(`User ${userId} successfully connected.`);
});

// Listening for disconnections
eventsClient.onDisconnect((userId: number, reason: string, reconnect: boolean) => {
	console.log(`User ${userId} disconnected. Reason: ${reason}. Will reconnect: ${reconnect}`);
});
```

---

### Serialization

Each data instance (event) returned by the library is immutable and exposes its data through getters, ensuring that properties cannot be reassigned. For convenience, every data instance implements a `toJSON()` method, which serializes the instance into a plain JavaScript object representation of the data.

This method is automatically invoked when the instance is passed to `JSON.stringify()`. In Node.js, it is also used when the instance is logged via `console.log()`, utilizing the `util.inspect` mechanism.

> [!TIP]
> If you wish to explore the structure of the data instance, it is always preferable to refer to the [official documentation](https://stimulcross.github.io/donation-alerts) rather than relying on logging. A data instance may include additional utility methods that are not serialized by `toJSON()`. The documentation also provides detailed descriptions of all available properties and methods.

Also, each data instance retains the original event data received from the Donation Alerts Centrifugo API. This raw data is hidden and immutable but can be accessed via the [`getRawData`](https://stimulcross.github.io/donation-alerts/functions/common.getRawData.html) function provided by the [`@donation-alerts/common`](https://stimulcross.github.io/donation-alerts/modules/common.html) package:

```ts
import { getRawData } from '@donation-alerts/common';

const donationsListener = userEventsClient.onDonation((evt: DonationAlertsDonationEvent) => {
	console.log(evt);
});
```

At the time of writing, the output resembles the following structure:

```ts
interface DonationEventRawData {
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
	shown_at: string | null;
	reason: string;
}
```

As you may notice, the raw response includes some fields that are neither directly exposed by the library nor mentioned in Donation Alerts' official [documentation](https://www.donationalerts.com/apidoc).

> [!WARNING]
> For best practices, avoid depending on undocumented fields, as their structure or availability may change over time.

---

For more detailed information, refer to the [documentation](https://stimulcross.github.io/donation-alerts/modules/events.html).
