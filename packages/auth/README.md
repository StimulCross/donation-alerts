# Donation Alerts - Authentication

Authentication provider with ability to automatically refresh user tokens.

This package is already used by [@donation-alerts/api](../../docs/modules/api.html) and [@donation-alerts/events](../../docs/modules/events.html) packages, so you, probably, don't need to install it separately.

## Installation

Using `npm`:

```
npm i @donation-alerts/auth
```

Using `yarn`:

```
yarn add @donation-alerts/auth
```

## Usage

First of all, you have two variations of the authentication provider.

### Static authentication provider

The [StaticAuthProvider](../../docs/classes/auth.StaticAuthProvider.html) registers users with their credentials in the internal registry and makes it possible to get an access token for a registered user. But this provider is not able to refresh user tokens on expiration.

To instantiate the [StaticAuthProvider](../../docs/classes/auth.StaticAuthProvider.html) you must specify the application client ID. Read the official Donation Alerts [guide](https://www.donationalerts.com/apidoc#advertisement) to learn how to register the application and obtain client ID and client secret.

```ts
import { StaticAuthProvider } from '@donation-alerts/auth';

const clientId = 'YOUR_CLIENT_ID';

const authProvider = new StaticAuthProvider(clientId);
```

Optionally, you can provide an array of users to register on [StaticAuthProvider](../../docs/classes/auth.StaticAuthProvider.html) instance creation. Each user must implement [StaticAuthProvider](../../docs/classes/auth.StaticAuthProvider.html)

```ts
const authProvider = new StaticAuthUser(clientId, [
	{
		userId: 123456789,
		accessToken: { accessToken: '<USER_ACCESS_TOKEN>' }
	}
]);
```

It's also recommended to set the scopes the token has. In this case, the library will compare the requested scope against the scopes the token has.

```ts
const authProvider = new StaticAuthUser(clientId, [
	{
		userId: 123456789,
		accessToken: {
			accessToken: '<USER_ACCESS_TOKEN>',
			scopes: ['oauth-user-show'] // ARRAY OF SCOPES THE TOKEN HAS
		}
	}
]);
```

If you want to dynamically manage users in the [StaticAuthProvider](../../docs/classes/auth.StaticAuthProvider.html), you can use [addUser](../../docs/interfaces/auth.AuthProvider.html#addUser) and [removeUser](../../docs/interfaces/auth.AuthProvider.html#removeUser) methods.

```ts
const authProvider = new StaticAuthProvider(clientId);

authProvider.addUser(123456789, { accessToken: '<USER_ACCESS_TOKEN>' });
authProvider.removeUser(123456789);
```

After user registration you can use [getAccessTokenForUser](../../docs/interfaces/auth.AuthProvider.html#getAccessTokenForUser) method to gen the access token for a specified user. This method returns the [AccessToken](../../docs/interfaces/auth.AccessToken.html) object.

```ts
authProvider.getAccessTokenForUser(123456789);
```

This method also optionally takes requested scopes as the second `scopes?: string[]` argument. If the `scopes` argument is provided, the library checks whether the access token has the requested scopes. if the check fails, it throws [MissingScopeError](../../docs/classes/auth.MissingScopeError.html).

```ts
authProvider.getAccessTokenForUser(123456789, ['oauth-user-show']);
```

### Refreshing authentication provider

Unlike [StaticAuthProvider](../../docs/classes/auth.StaticAuthProvider.html), [RefreshingAuthProvider](../../docs/classes/auth.RefreshingAuthProvider.html) has an ability to automatically refresh user tokens whether necessary.

Creating [RefreshingAuthProvider]() slightly different from [StaticAuthProvider](../../docs/classes/auth.StaticAuthProvider.html). To create [RefreshingAuthProvider](../../docs/classes/auth.RefreshingAuthProvider.html) you must set up [RefreshConfig](../../docs/interfaces/auth.RefreshConfig.html). Optionally, you can provide a callback function that will be called on every token refresh, and you will be able to handle new token data, for example, to save it to your database. The callback function has two parameters:

-   `userId`: string - The ID of the user the access token refreshed for.
-   `accessToken`: [AccessToken](../../docs/interfaces/auth.AccessToken.html) - The access token data.

```ts
import { RefreshingAuthProvider } from '@donation-alerts/auth';
import { AccessToken } from '@donation-alerts/auth';

const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';

const authProvider = new RefreshingAuthProvider({
	clientId,
	clientSecret,
	onRefresh: (userId: number, accessToken: AccessToken) => {
		// This function will be triggered on every user token refresh.
	}
});
```

You can also specify initial users as the second argument that will be registered on the [RefreshingAuthProvider](../../docs/classes/auth.RefreshingAuthProvider.html) instance creation.

```ts
const authProvider = new RefreshingAuthProvider(
	{
		clientId,
		clientSecret,
		onRefresh: (userId: number, accessToken: AccessToken) => {
			// This function will be triggered on every user token refresh.
		}
	},
	[
		{
			userId: 123456789,
			accessToken: {
				accessToken: '<USER_ACCESS_TOKEN>',
				refreshToken: '<USER_REFRESH_TOKEN>',
				expiresIn: 1660503203,
				obtainmentTimestamp: 1660500227199,
				scope: ['oauth-user-show'] // HIGLY RECOMMENDED TO SET TOKEN SCOPES
			}
		}
	]
);
```

Note that unlike [StaticAuthProvider](../../docs/classes/auth.StaticAuthProvider.html), [RefreshingAuthProvider](../../docs/classes/auth.RefreshingAuthProvider.html) requires full token data to register users (including [addUser](../../docs/interfaces/auth.AuthProvider.html#addUser) and [removeUser](../../docs/interfaces/auth.AuthProvider.html#removeUser) methods): `accessToken`, `refreshToken`, `expiresIn`, `obtainmentTimestmap`, and optional `scope` properties.

In [RefreshingAuthProvider](../../docs/classes/auth.RefreshingAuthProvider.html), in addition to [getAccessTokenForUser](../../docs/interfaces/auth.AuthProvider.html#getAccessTokenForUser) method you can also use [refreshAccessTokenForUser](../../docs/interfaces/auth.AuthProvider.html#refreshAccessTokenForUser) method to force refresh the access token for a user. This method also returns [AccessToken](../../docs/interfaces/auth.AccessToken.html) object.

```ts
authProvider.refreshAccessTokenForUser(123456789);
```

Check the [StaticAuthProvider](../../docs/classes/auth.StaticAuthProvider.html) and [RefreshingAuthProvider](../../docs/classes/auth.RefreshingAuthProvider.html) documentation pages to see the full list of available properties and methods.

---

For more information check the [documentation](../../docs/modules/auth.html).
