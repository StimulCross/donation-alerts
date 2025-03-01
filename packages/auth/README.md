# Donation Alerts - Authentication

A robust authentication provider that can automatically refresh user tokens.

## Installation

#### Using `npm`:

```
npm i @donation-alerts/auth
```

#### Using `yarn`:

```
yarn add @donation-alerts/auth
```

#### Using `pnpm`:

```
pnpm add @donation-alerts/auth
```

## Usage

### Overview

The authentication provider is a class that implements the [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) interface, allowing you to register and manage users along with their authentication data (access tokens, refresh tokens, etc.).

Two built-in providers are available:

- [StaticAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html)
- [RefreshingAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.RefreshingAuthProvider.html)

If these implementations do not suit your requirements — such as when you need to share authentication data across multiple processes — you can implement your own provider (e.g., using Redis) that adheres to the [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) interface.

> [!IMPORTANT]
> Before using the provider, you must register your application in [Donation Alerts OAuth server](https://www.donationalerts.com/application/clients) and obtain a client ID and a client secret. Learn more in the [Authorization section](https://www.donationalerts.com/apidoc#authorization__authorization_code).

### Static Authentication Provider

The [StaticAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html) lets you register users and store their credentials in an internal registry, enabling you to retrieve their access tokens when needed. Note that this provider does not support automatic token refresh upon expiration.

To create an instance of `StaticAuthProvider`, provide your application’s client ID:

```ts
import { StaticAuthProvider } from '@donation-alerts/auth';

const authProvider = new StaticAuthProvider('<CLIENT_ID>');
```

You can also specify an array of required scopes for the registering tokens:

```ts
const authProvider = new StaticAuthUser('<CLIENT_ID>', ['oauth-user-show', 'oauth-donation-index']);
```

If a token is registered without all the required scopes, a [MissingScopeError](https://stimulcross.github.io/donation-alerts/classes/auth.MissingScopeError.html) will be thrown.

If no scopes are specified, scope validation is skipped.

It is recommended to always set scopes for added tokens so that the library can verify that the token meets the requested scopes.

#### Managing Users

The `StaticAuthProvider` offers several methods to manage users:

- **hasUser:** Checks if a user is registered.

    ```ts
    const exists = authProvider.hasUser(123456789);
    // returns a boolean
    ```

- **addUser:** Registers a user with their authentication data.

    ```ts
    authProvider.addUser(123456789, '<ACCESS_TOKEN>', [
    	'oauth-user-show',
    	'oauth-donation-index',
    	'oauth-custom_alert-store',
    ]);
    ```

- **removeUser:** Unregisters a user.

    ```ts
    authProvider.removeUser(123456789);
    ```

#### Retrieving Access Tokens

After a user is registered, you can retrieve their access token by using the [getAccessTokenForUser](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html#getAccessTokenForUser) method:

```ts
const token = await authProvider.getAccessTokenForUser(123456789);
```

This method also accepts an optional array of scopes as the second argument. If you provide scopes, the provider verifies that the token is valid for those scopes. If not, a [MissingScopeError](https://stimulcross.github.io/donation-alerts/classes/auth.MissingScopeError.html) will be thrown.

For example:

```ts
// Register token with 'oauth-user-show' and 'oauth-donation-index' scopes
authProvider.addUser(123456789, {
	accessToken: '<ACCESS_TOKEN>',
	scopes: ['oauth-user-show', 'oauth-donation-index'],
});

// Attempting to retrieve the token with an additional required scope
// will throw a 'MissingScopeError' if the token lacks 'oauth-custom_alert-store'
const token = await authProvider.getAccessTokenForUser(123456789, ['oauth-custom_alert-store']);
```

The method returns an [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

### Refreshing authentication provider

Unlike the [StaticAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html), the [RefreshingAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.RefreshingAuthProvider.html) can automatically refresh user tokens when needed.

To instantiate a `RefreshingAuthProvider`, configure it with a [RefreshingAuthProviderConfig](https://stimulcross.github.io/donation-alerts/interfaces/auth.RefreshingAuthProviderConfig.html):

- **clientId** – Your Donation Alerts application's client ID.
- **clientSecret** – Your Donation Alerts application's client secret.
- **redirectUri** (optional) – Your application's redirect URI, used in the `addUserForCode` method to exchange an authorization code for an access token.
- **scopes** (optional) – An array of scopes that all registering tokens must be valid for.

- **clientId** – Your Donation Alerts application client ID.
- **clientSecret** – Your Donation Alerts application client secret.
- **redirectUri** (optional) – The redirect URI set for your application. This is used in the `addUserForCode` method to exchange an authorization code for an access token.
- **scopes** (optional) – An array of scopes that every registering token must be valid for.

```ts
import { RefreshingAuthProvider } from '@donation-alerts/auth';

const authProvider = new RefreshingAuthProvider({
	clientId: '<CLIENT_ID>',
	clientSecret: '<CLIENT_SECRET>',
	redirectUri: '<REDIRECT_URI>',
	scopes: ['oauth-user-show', 'oauth-donation-index', 'oauth-custom_alert-store'],
});
```

#### Managing Users

- **hasUser:** Checks whether a user is already added to the provider.

    ```ts
    const hasUser = authProvider.hasUser(123456789);
    ```

    Returns a `boolean`.

- **addUser:** Registers a user with their token data:

    ```ts
    const userId = 123456789;
    authProvider.addUser(userId, {
    	accessToken: '<ACCESS_TOKEN>',
    	refreshToken: '<REFRESH_TOKEN>',
    	expiresIn: 0,
    	obtainmentTimestamp: 0,
    	scopes: ['oauth-user-show', 'oauth-donation-index', 'oauth-custom_alert-store'],
    });
    ```

    If `expiresIn` and `obtainmentTimestamp` are unknown, set them to `0` to force a token refresh on first access.

    Since there is no dynamic way to verify token scopes, if you require scope validation, ensure valid scopes are provided when adding the token. It is recommended to store the token along with its valid scopes and obtainment timestamp in persistent storage (e.g., a database) after the authentication process.

    This method returns an [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

> [!WARNING]
> Both `accessToken` and `refreshToken` must be non-empty strings; otherwise, an [InvalidTokenError](https://stimulcross.github.io/donation-alerts/classes/auth.InvalidTokenError.html) will be thrown.

- **addUserForToken:** You can also add a user using only token data:

    ```ts
    const tokenWithUserId = await authProvider.addUserForToken({
    	accessToken: '<ACCESS_TOKEN>',
    	refreshToken: '<REFRESH_TOKEN>',
    	expiresIn: 0,
    	obtainmentTimestamp: 0,
    	scopes: ['oauth-user-show', 'oauth-donation-index', 'oauth-custom_alert-store'],
    });
    ```

    The user will be fetched internally followed by adding it to the provider with the given token data.

    This method returns an [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

> [!WARNING]
> The token must be valid for the `oauth-user-show` scope to fetch user data; otherwise, a [MissingScopeError](https://stimulcross.github.io/donation-alerts/classes/auth.MissingScopeError.html) will be thrown.

- **addUserForCode**

    Alternatively, you can add a user using an authorization code obtained during the OAuth2 flow:

    ```ts
    const tokenWithUserId = await authProvider.addUserForCode('<AUTH_CODE>', [
    	'oauth-user-show',
    	'oauth-donation-index',
    	'oauth-custom_alert-store',
    ]);
    ```

    The `addUserForCode` method accepts an array of scopes as its second argument; these will be compared against the provider's scopes (if specified).

    This method exchanges the code for an access token, retrieves the user associated with the token, and adds them to the auth provider.

    This method returns an [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

> [!WARNING]
> The token must include the `oauth-user-show` scope to fetch user data; otherwise, a [MissingScopeError](https://stimulcross.github.io/donation-alerts/classes/auth.MissingScopeError.html) will be thrown.

- **removeUser**

    Removes a user from the provider by their user ID:

    ```ts
    authProvider.removeUser(123456789);
    ```

#### Managing Tokens

- **getAccessTokenForUser**

    Retrieves the user's access token. If the token has expired, it will be automatically refreshed, and the new token will be returned:

    ```ts
    const token = await authProvider.getAccessTokenForUser(12345678);
    ```

    Returns an [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

- **refreshAccessTokenForUser**

    For cases when you need to force a token refresh, call the `refreshAccessTokenForUser` method:

    ```ts
    const token = await authProvider.refreshAccessTokenForUser(12345678);
    ```

    Returns a [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

#### Events

Whenever an access token is refreshed—either automatically or manually—the `onRefresh` event is triggered. This allows you to perform actions such as saving the updated token to persistent storage:

```ts
import { AccessToken } from '@donation-alerts/auth';

authProvider.onRefresh((userId: number, token: AccessToken) => {
	console.log(`The access token was refreshed for user ${userId}`);
});
```

For a complete list of available methods and properties, please refer to the [StaticAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html) and [RefreshingAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.RefreshingAuthProvider.html) documentation.

---

### Utility Functions

This package also provides some utility functions you may find useful if you handle some tasks outside the library:

- **[getExpiryMilliseconds](https://stimulcross.github.io/donation-alerts/functions/auth.getExpiryMilliseconds.html)** - Calculates the expiration time of the access token in milliseconds since UNIX epoch.
- **[getTokenExpiryDate](https://stimulcross.github.io/donation-alerts/functions/auth.getTokenExpiryDate.html)** - Calculates the expiration date of the access token as a `Date` object.
- **[isAccessTokenExpired](https://stimulcross.github.io/donation-alerts/functions/auth.isAccessTokenExpired.html)** - Checks whether the given access token is expired.
- **[getAccessToken](https://stimulcross.github.io/donation-alerts/functions/auth.getAccessToken.html)** - Obtains an access token using client credentials and an authorization code.
- **[refreshAccessToken](https://stimulcross.github.io/donation-alerts/functions/auth.refreshAccessToken.html)** - Refreshes an expired access token using the refresh token.
- **[compareScopes](https://stimulcross.github.io/donation-alerts/functions/auth.compareScopes.html)** - Compares and verifies the token's scopes against requested scopes.

---

For more detailed information, please refer to the [documentation](https://stimulcross.github.io/donation-alerts/modules/auth.html).
