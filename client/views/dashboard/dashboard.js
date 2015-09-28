
// reactive variable to store the weather data retrieved by the server
Template.dashboard.dataWeatherServer = new ReactiveVar();
// stores the city ID of the weather data currently retrieved from the server
Template.dashboard.dataWeatherServerId = new ReactiveVar();

// reactive variable to store the weather data retrieved by the client
Template.dashboard.dataWeatherClient = new ReactiveVar();
// stores the city ID of the weather data currently retrieved from the client
Template.dashboard.dataWeatherClientId = new ReactiveVar();

// reset trigger for the client data
Template.dashboard.resetWeatherClient = new ReactiveVar(false);
// reset trigger for the server data
Template.dashboard.resetWeatherServer = new ReactiveVar(false);

/**
 * Identifies the thread that is responsible for the automatic API data update, to ensure only one thread is able to
 * reset the data
 */
Template.dashboard.updaterTimestamp = new Date();


/**
 * Recursively called function to reset the API data. The function will use the update interval stored in the user
 * profile. The function also makes sure to only have one thread executing this function at a time by using the passed
 * parameter to compare against the updaterTimestamp stored in the template.
 *
 * @param updaterChangeDate - the date this updater was first called. Will abort execution if this doesn't match the
 * updaterTimeStamp any more.
 */
function updateWeatherData(updaterChangeDate) {
    // check if this is the active thread
    if (updaterChangeDate.getTime() == Template.dashboard.updaterTimestamp.getTime()) {
        // only if the user is logged in (avoids undefined exception)
        if (Meteor.user()) {
            // retrieve interval from profile
            var timeout = Meteor.user().profile.apiUpdateInterval;
            // default fallback to 'Manual' -> ''
            timeout = (timeout === undefined) ? '' : timeout;

            // set the reset flags
            Template.dashboard.resetWeatherClient.set(true);
            Template.dashboard.resetWeatherServer.set(true);

            // if timeout is not set to 'Manual' ('')
            if (timeout != '') {
                // execute updater again using the timeout (e.g. 5000, 15000, 30000, 60000, ...) in ms
                setTimeout(function() {
                    updateWeatherData(updaterChangeDate);
                }, timeout);
            }
        }
    }
}


Template.dashboard.helpers({

    /**
     * Returns the weather data on the client side by executing an AJAX request directly from within the browser.
     * @returns {any}
     */
    clientWeatherData: function() {
        // only if the reset flag is set, trigger AJAX call
        if (Template.dashboard.resetWeatherClient.get() === true) {
            // don't re-execute again until reset is triggered again
            Template.dashboard.resetWeatherClient.set(false);
            // show the overlay with the loading animation
            $('#client-api .overlay').show();

            // AJAX call retrieving weather data for the currently selected city (TODO: add check for no city selected)
            HTTP.get('http://api.openweathermap.org/data/2.5/weather?id=' + Template.dashboard.dataWeatherClientId.get() + '&units=metric', function(err, data) {
                // set the data retrieved from the API -> triggers re-execution of the helper
                Template.dashboard.dataWeatherClient.set(JSON.parse(data.content));
                // debug output
                console.log('Client Data:');
                console.log(JSON.parse(data.content));
                // hide overlay
                $('#client-api .overlay').hide();
            });
        }

        /*
         Return the current client data; before the API call returns this will return null and the template won't
         display anything. Once the API call returns this variable will be changed, which will re-trigger
         the execution of this helper and return the correct data, which will trigger the UI "refresh".
          */
        return Template.dashboard.dataWeatherClient.get();
    },

    /**
     * Returns the weather data on the server side by calling a server method that makes an HTTP call and retrieves the
     * data.
     * @returns {any}
     */
    serverWeatherData: function() {
        // only if the reset flag is set, trigger server method call
        if (Template.dashboard.resetWeatherServer.get() === true) {
            // don't re-execute again until reset is triggered again
            Template.dashboard.resetWeatherServer.set(false);
            // show the overlay with the loading animation
            $('#server-api .overlay').show();
            // call the server method to make the API call, passing the currently selected city ID (TODO: null check)
            Meteor.call('weatherData', Template.dashboard.dataWeatherServerId.get(), function(err, data) {
                // set the data retrieved from the server -> triggers re-execution of the helper
                Template.dashboard.dataWeatherServer.set(data);
                // debug output
                console.log('Server Data:');
                console.log(data);
                // hide overlay
                $('#server-api .overlay').hide();
            });
        }

        /*
         Return the current server data; before the method call returns this will return null and the template won't
         display anything. Once the method call returns this variable will be changed, which will re-trigger
         the execution of this helper and return the correct data, which will trigger the UI "refresh".
         */
        return Template.dashboard.dataWeatherServer.get();
    },

    /**
     * Returns a list of cities (with their ID on openweathermap.org)
     * @returns {{id: number, name: string}[]}
     */
    cities: function() {
        return [
            { id: 524901, name: 'Moscow' },
            { id: 703448, name: 'Kiev' },
            { id: 2643743, name: 'London' },
            { id: 2172797, name: 'Cairns' }
        ];
    },

    /**
     * The datetime returned by openweathermap is only in seconds. This makes sure to convert it in milliseconds so it
     * can be used to construct a Date object (formatDateDefault global helper).
     * @returns {number}
     */
    datetime: function() {
        return this.dt * 1000;
    },

    /**
     * Returns the button class for the city button. Comparing the current city ID with the one stored in the templates
     * reactive variable for a specific category ('client' or 'server').
     *
     * This helper will be re-executed when the city ID of one section is changed (because the helper uses a reactive
     * variable).
     *
     * @param category - an identifier (client or server) for the section in which the helper is used
     * @returns {string} - a button class for a bootstrap button
     */
    btnClass: function(category) {
        // data context is an element returned by the 'cities' helper of this template
        if (category == 'client') {
            // helper is executed in the client API section
            return (Template.dashboard.dataWeatherClientId.get() == this.id) ? 'btn-primary' : 'btn-default';
        }
        else {
            // helper is executed in the server API section
            return (Template.dashboard.dataWeatherServerId.get() == this.id) ? 'btn-primary' : 'btn-default';
        }
    },

    /**
     * Comparison helper for the selected option the update interval drop-down.
     * @param value - the value to compare against
     * @returns {boolean} - true if the value to compare against matches the one currently stored at the profile.
     */
    updateInterval: function(value) {
        // only handle this if the user is logged in
        if (Meteor.user()) {
            // compare the current value with the value stored in the profile
            var comparison = Meteor.user().profile.apiUpdateInterval == value;
            if (comparison) {
                // trigger the automatic update (if 'Manual' is selected, the updater will automatically handle it and exit)
                updateWeatherData(Template.dashboard.updaterTimestamp);
            }
            // return the result of the comparison to set the selected attribute of the drop-down option
            return comparison;
        }
        // user is logged out -> who cares
        return false;
    }
});


Template.dashboard.events({

    /**
     * Click on a refresh icon to manually update a section (client or server)
     * @param e
     */
    'click .fa-refresh': function(e) {
        // fetch the ID of the closest section
        var id = $(e.target).closest('.section').attr('id');
        if (id == 'client-api') {
            // icon on the client side was clicked
            console.log('reset client');
            // trigger a client data refresh
            Template.dashboard.resetWeatherClient.set(true);
        }
        else {
            // icon on the server side was clicked
            console.log('reset server');
            // trigger a server data refresh
            Template.dashboard.resetWeatherServer.set(true);
        }
    },

    /**
     * Select a different city for either the server or client side data.
     * @param e
     */
    'click .button-grp button': function(e) {
        // figure out if it is client or server side
        var cat = $(e.target).closest('.button-grp').attr('data-category');
        // the city ID selected
        var city = $(e.target).closest('button').attr('data-id');
        if (cat == 'client') {
            // set the new city ID for the client data
            Template.dashboard.dataWeatherClientId.set(city);
            // trigger reset
            Template.dashboard.resetWeatherClient.set(true);
        }
        else {
            // set the new city ID for the server data
            Template.dashboard.dataWeatherServerId.set(city);
            // trigger reset
            Template.dashboard.resetWeatherServer.set(true);
        }
    },

    /**
     * Change the update interval (Manual, 5 seconds, 15 seconds, etc.)
     * @param e
     */
    'change #update-interval': function(e) {
        // only handle the event if the user is logged in
        if (Meteor.user()) {
            // determine the new value
            var value = $(e.target).closest('select').find('option:selected').val();
            // update the user profile
            Meteor.users.update({ _id: Meteor.userId() }, {
                $set: {
                    'profile.apiUpdateInterval': value
                }
            });
            /*
            Change the updaters time stamp to the current date. This will avoid that any existing running updater will
            perform any further re-executions. They were triggered with an older timestamp, which means they will exit
            when they check against the templates updater timestamp (which is overwritten here).
             */
            Template.dashboard.updaterTimestamp = new Date();
            // trigger new updater thread with this new timestamp
            updateWeatherData(Template.dashboard.updaterTimestamp);
        }
    }
});