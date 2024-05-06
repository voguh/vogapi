# VogAPI

### What is VogAPI
VogAPI was created based on [DecAPI](https://github.com/Decicus/DecAPI). Developed with the purpose of helping ChatBots/
Overlays to fetch useful information from the Twitch API in a simple way.


### Libraries
- [`@twurple/api`](https://www.npmjs.com/package/@twurple/api): I decided to use this library because it already
provides me with access to Twitch API endpoints with great typing and ease of use; this package is the backbone
of the project.
- [`express`](https://www.npmjs.com/package/express): Together with `@twurple/api`, Express is also the main library
that gives backbone to the project.
- [`log4js`](https://www.npmjs.com/package/log4js): This is a simple yet powerful logging library. I decided to use it
because I can customize the format and have access to the log's stack trace.
- [`node-cron`](https://www.npmjs.com/package/node-cron): With these libraries, I implemented a cache cleaning method
and file separation by day.
- [`node-cache`](https://www.npmjs.com/package/node-cache): This library enabled the creation of an in-memory caching
system to prevent excessive calls to the Twitch API, caching team IDs, users, and games.
- [`swagger-ui-express`](https://www.npmjs.com/package/swagger-ui-express): Using this library and some custom
decorators, I implemented a simple Swagger interface with OAS-3.1.0.


### Development

#### Rest routes
As a way to simplify route registration, I created two decorators with the purpose of injecting metadata for route
registration. The `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` and `HEAD` decorators are just prefixed aliases of
rest, which injects a `REST_API` metadata indicating that the method in the class is a REST endpoint with X method,
X middlewares, and X path. The SwaggerDocs decorator adds the `REST_DOCS` metadata, which is used to add route
documentation information such as summary, description, and route tags.