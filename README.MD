# Meteor API Example

## Table of Content

* [Content](#content)
* [Server API Call](#server-api-call)
* [Client API Call](#client-api-call)


## Content

* Login screen where the user can login with credentials admin/admin or test/test.
* Dashboard screen with weather data in 2 sections (one labeled server-side, one labeled client-side).

**Important files**

* /client/views/dashboard/dashboard.js (contains all the client view logic, the client API call and the server method
call utilising `ReactiveVar`s
* /server/methods/api.js (contains the server API call utilising a `Future`)

## Server API Call

The weather data retrieved by the server is stored in a reactive variable in the template. The data is retrieved via a
Meteor server method call. Due to the reactiveness of the `ReactiveVar` used, the asynchronous method call doesn't
prevent the data from being displayed correctly.

On the server side, the method is using a Promise/Future to return a result after the API call has finished.

### Client API Call

The weather data retrieved by the client is stored in a reactive variable in the template. The data is retrieved via a
 standard AJAX call and the result written to the reactive variable, which triggers the re-execution of the helper and
 returns the result.



