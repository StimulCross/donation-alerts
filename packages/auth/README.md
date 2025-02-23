# Donation Alerts - Authentication

Authentication provider with ability to automatically refresh user tokens.

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

### Authentication provider

Authentication provider is a class that implements the [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) interface. In general, it allows users to register and manage authenticated users and their authentication data (access tokens, refresh tokens, etc.).

There are two built-in authentication providers you can use: [StaticAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html) and [RefreshingAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.RefreshingAuthProvider.html).

If these implementations do not meet your needs, and, for example, you need to share authentication data across multiple processes, you can create your own provider (e.g., based on Redis) that implements the [AuthProvider](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html) interface.

First of all, you must register your application in Donation Alerts and obtain a client ID and a client secret key. Read more [here](https://www.donationalerts.com/apidoc#authorization__authorization_code) in the `Authorization` section.

### Static authentication provider

The [StaticAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html) allows to register users with their credentials in the internal registry and allows to get the access tokens of the registered users. However, this provider is not able to refresh user tokens on expiration.

To instantiate the `StaticAuthProvider` you must specify the application client ID.

```ts
import { StaticAuthProvider } from '@donation-alerts/auth';

const authProvider = new StaticAuthProvider('<CLIENT_ID>');
```

Optionally, you can provide an array of scopes that all registering tokens must be valid for.

```ts
const authProvider = new StaticAuthUser('<CLIENT_ID>', ['oauth-user-show', 'oauth-donation-index']);
```

If the registering token misses any scope from this list, [MissingScopeError](https://stimulcross.github.io/donation-alerts/classes/auth.MissingScopeError.html) exception will be thrown.

If scopes were not specified for the registering token, scope validation will be skipped.

It's also recommended to set scopes for each added token. In this case, the library will compare the requested scopes against the token scopes.

#### Managing users in static authentication provider

To manage users in the `StaticAuthProvider`, you can use [hasUser](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html#hasUser), [addUser](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html#addUser), and [removeUser](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html#removeUser) methods.

#### `hasUser`

Checks whether a user is added to the provider.

```ts
const hasUser = authProvider.hasUser(123456789);
```

Returns `boolean`.

#### `addUser`

Adds a user to the provider. The first argument is the ID of the user, the second is authentication data that includes `accessToken` and optional `scopes`.

```ts
authProvider.addUser(123456789, {
	accessToken: '<ACCESS_TOKEN>',
	scopes: ['oauth-user-show', 'oauth-donation-index', 'oauth-custom_alert-store'],
});
```

#### `removeUser`

Removes a user from the provider.

```ts
authProvider.removeUser(123456789);
```

#### Getting tokens from the static authentication provider

After user registration, you can use the [getAccessTokenForUser](https://stimulcross.github.io/donation-alerts/interfaces/auth.AuthProvider.html#getAccessTokenForUser) method to get the access token for the specified user.

```ts
const token = await authProvider.getAccessTokenForUser(123456789);
```

This method also optionally takes requested scopes as the second `scopes?: string[]` argument. If scopes are provided, the library checks whether the access token is valid for the requested scopes. If the check fails, the [MissingScopeError](https://stimulcross.github.io/donation-alerts/classes/auth.MissingScopeError.html) will be thrown.

```ts
// Add token with 'oauth-user-show' and 'oauth-donation-index' scopes
authProvider.addUser(123456789, {
	accessToken: '<ACCESS_TOKEN>',
	scopes: ['oauth-user-show', 'oauth-donation-index'],
});

// Throws 'MissingScopeError' because the token
// is not valid for 'oauth-custom_alert-store' scope
const token = await authProvider.getAccessTokenForUser(123456789, ['oauth-custom_alert-store']);
```

Returns [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

### Refreshing authentication provider

Unlike [StaticAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html), [RefreshingAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.RefreshingAuthProvider.html) has an ability to automatically refresh user tokens whether necessary.

To instantiate a `RefreshingAuthProvider` you must set up [RefreshingAuthProviderConfig](https://stimulcross.github.io/donation-alerts/interfaces/auth.RefreshingAuthProviderConfig.html).

- `clientId` - Donation Alerts application's client ID
- `clientSecret` - Donation Alerts application's client secret
- `redirectUri` (optional) - Donation Alerts application's redirect URI. Only used in `addAuthForCode` method to exchange an authorization code for an access token.
- `scopes` (optional) - an array of scopes that all registering tokens must be valid for.

```ts
import { RefreshingAuthProvider } from '@donation-alerts/auth';

const authProvider = new RefreshingAuthProvider({
	clientId: '<CLIENT_ID>',
	clientSecret: '<CLIENT_SECRET>',
	redirectUri: '<REDIRECT_URI>',
	scopes: ['oauth-user-show', 'oauth-donation-index', 'oauth-custom_alert-store'],
});
```

#### Managing users in refreshing authentication provider

#### `hasUser`

Checks whether a user was added to the provider.

```ts
const hasUser = authProvider.hasUser(123456789);
```

Returns `boolean`.

#### `addUser`

Adds a user to the provider:

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

> [!NOTE]
> Both `aceessToken` and `refreshToken` must be non-empty strings. Otherwise, [InvalidTokenError](https://stimulcross.github.io/donation-alerts/classes/auth.InvalidTokenError.html) will be thrown.

If `expiresIn` and `obtainmentTimestamp` are unknown, you can set them both to `0` to force refresh the token on the first access.

Also keep in mind that there is actually no way to dynamically figure out scopes the token is valid for, so if you need scope validation, you have to set valid scopes for the token when you are adding it to the provider. The right approach would be to persist the token with its valid scopes and obtainment timestamp in the database (or any other persistent storage) after the authentication flow.

#### `addUserForToken`

You can also add a user to the auth provider with only token data:

```ts
const tokenWithUserId = await authProvider.addUserForToken({
	accessToken: '<ACCESS_TOKEN>',
	refreshToken: '<REFRESH_TOKEN>',
	expiresIn: 0,
	obtainmentTimestamp: 0,
	scopes: ['oauth-user-show', 'oauth-donation-index', 'oauth-custom_alert-store'],
});
```

The ID of the user will be fetched internally followed by adding it to the provider with the given token data.

Returns [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

> [!WARNING]
> The token must be valid for `oauth-user-show` scope to fetch the user data. Otherwise, the [MissingScopeError](https://stimulcross.github.io/donation-alerts/classes/auth.MissingScopeError.html) exception will be thrown.

#### `addUserForCode`

Another option to add a user to the provider is using an authorization code received during the OAuth2 authorization flow.

```ts
const tokenWithUserId = await authProvider.addUserForCode('<AUTH_CODE>', [
	'oauth-user-show',
	'oauth-donation-index',
	'oauth-custom_alert-store',
]);
```

`addUserForCode` method accepts token scopes as the second argument. They will be compared against the provider's scopes (if any) as described above.

This method exchanges the code for the access token, followed by getting the user associated with the token and adding it to the auth provider.

> [!WARNING]
> The token must be valid for `oauth-user-show` scope to fetch the user data. Otherwise, the [MissingScopeError](https://stimulcross.github.io/donation-alerts/classes/auth.MissingScopeError.html) exception will be thrown.

Returns [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

#### `removeUser`

Removes the specified user ID from the auth provider.

```ts
authProvider.removeUser(123456789);
```

#### Managing tokens in refreshing authentication provider

Now let's move on to what we started all this for.

#### `getAccessTokenForUser`

You can get the user's access token by calling the `getAccessTokenForUser` method. If the token has expired, it will be refreshed internally by the provider, and a new one will be returned.

```ts
const token = await authProvider.getAccessTokenForUser(12345678);
```

Returns [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

#### `refreshAccessTokenForUser`

If for some reason you need to force refresh the access token, you can call `refreshAccessTokenForUser`method:

```ts
const token = await authProvider.refreshAccessTokenForUser(12345678);
```

Returns [AccessTokenWithUserId](https://stimulcross.github.io/donation-alerts/interfaces/auth.AccessTokenWithUserId.html) object.

#### Events

When an access token is refreshed, whether internally or externally, `onRefresh` event occurs. You can listen to it, for example, to save the token to a persistence storage.

```ts
import { AccessToken } from '@donation-alerts/auth';

authProvider.onRefresh((userId: number, token: AccessToken) => {
	console.log(`The access token was refreshed for user ${userId}`);
});
```

Check the [StaticAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.StaticAuthProvider.html) and [RefreshingAuthProvider](https://stimulcross.github.io/donation-alerts/classes/auth.RefreshingAuthProvider.html) documentation pages to see the full list of available properties and methods.

---

For more information check the [documentation](https://stimulcross.github.io/donation-alerts/modules/auth.html).
