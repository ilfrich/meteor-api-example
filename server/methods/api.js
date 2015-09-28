// This package is required for promises.
Future = Npm.require('fibers/future');

Meteor.methods({

    /**
     * Retrieves weather data for the city specified by the `id` parameter.
     * @param id - the city ID
     * @returns {*}
     */
    weatherData: function(id) {
        // create the result
        var result = new Future();

        // trigger the HTTP call
        HTTP.get('http://api.openweathermap.org/data/2.5/weather?id=' + id + '&units=metric', function(err, data) {
            // parse the result and pass it to the promise
            result.return(JSON.parse(data.content));
        });

        // return the waiting promise (will return when result.return(..);) is executed)
        return result.wait();
    }
});