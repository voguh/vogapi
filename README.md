# VogAPI

## What is VogAPI
VogAPI was created based on [DecAPI](https://github.com/Decicus/DecAPI). Developed with the purpose
of helping ChatBots/Overlays to fetch useful information from the Twitch API in a simple way.


## Libraries
#### Core
- [`@twurple/api`](https://www.npmjs.com/package/@twurple/api): I decided to use this library because
it already provides me with access to Twitch API endpoints with great typing and ease of use;
- [`express`](https://www.npmjs.com/package/express): One of the most popular frameworks for creating
REST APIs in Node.js, I decided to use it because I am already familiar with it and can customize
the parts I deem necessary;
- [`cors`](https://www.npmjs.com/package/cors): Express CORS middleware;
- [`morgan`](https://www.npmjs.com/package/morgan): Express logging middleware;

#### Caching
- [`redis`](https://www.npmjs.com/package/redis): Used for connecting to KeyDB/Redis to enhance
caching to prevent excessive calls to the Twitch API, caching some low mutable data;

#### Logging
- [`winston`](https://www.npmjs.com/package/winston): Simple yet customizable logging library;
- [`winston-daily-rotate-file`](https://www.npmjs.com/package/winston-daily-rotate-file): Add a daily
file transporter to winston;

#### Documentation
- [`swagger-ui-express`](https://www.npmjs.com/package/swagger-ui-express): Using this library and
some custom decorators, I implemented a simple Swagger interface with OpenAPI Specification;


## Development

#### Rest routes
As a way to simplify route registration, I created some decorators with the purpose of injecting
metadata for route registration.

The `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` and `HEAD` decorators are just prefixed aliases
of `rest` decorator, which injects a `REST_API` metadata indicating that the method in the class is
a REST endpoint with determinated path, middlewares and HTTP request method.

The `SwaggerPath` and `SwaggerResponse` decorators adds the `REST_DOCS` metadata, which is used to
add route documentation information such as summary, description, and route tags.

### File import/export

I decided not to use relative paths in the project, opting instead for the path alias approach and
absolute paths.

For better file control and scope, I chose to define that each file will mostly represent a class
with a specific purpose. However, I didn't limit myself to using just one export. Some files have
more than one export with items related to the main class. For example, the "RestController.ts" file
not only exports the RestController class but also exports the decorators that give meaning to the
existence of the "RestController" class.


## License

This project is under the [MIT License](LICENSE)