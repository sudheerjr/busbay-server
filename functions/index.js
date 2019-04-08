const functions = require("firebase-functions");
const axios = require("axios");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require("firebase-admin");
admin.initializeApp();

exports.reformatReadings = functions.database
  .ref("/BUS_TRACKING_EVENING/{cardNo}/{pushId}")
  .onCreate((snapshot, context) => {
    const reading = snapshot.val();
    var splitReading = reading.split("#");
    const rfid = splitReading[0].trim();
    const lat = splitReading[1].trim();
    const lng = splitReading[2].trim();
    const date = splitReading[3].trim();
    const time = splitReading[4].trim();
    const reformattedReading = {
      rfid,
      lat,
      lng,
      time
    };
    var reformattedDate = date.replace("/", "_");
    reformattedDate = reformattedDate.replace("/", "_");
    return admin
      .database()
      .ref(`/rfid_uid_mapping/`)
      .child(rfid)
      .once("value", snapshot => {
        const userId = snapshot.val();
        // admin
        //   .database()
        //   .ref(`bus_morning/${userId}`)
        //   .child(`date${reformattedDate}`)
        //   .set(reformattedReading);

        var googleDirectionsUrl =
          "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=" +
          lat +
          "," +
          lng +
          "&destinations=" +
          10.049948 +
          "," +
          76.329194 +
          "&key=AIzaSyA-AuKqE-g9wAfwN9g99-BcWy_-oAN_V0c";

        var googlePlacesUrl =
          "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
          lat +
          "," +
          lng +
          "&key=AIzaSyA-AuKqE-g9wAfwN9g99-BcWy_-oAN_V0c";
        axios
          .all([axios.post(googlePlacesUrl), axios.get(googleDirectionsUrl)])
          .then(
            axios.spread((placesResponse, directionsResponse )=> {
              const distance = directionsResponse.data.rows[0].elements[0].distance.text;
              const fromLocation = placesResponse.data.results[0].address_components[1].short_name;
              const locationDetails = { distance, fromLocation};
              // TODO: Change branch names
              return admin
                .database()
                .ref(`guio/`)
                .child(`locationDetails`)
                .set(locationDetails);
            })
          )
          .catch(function(error) {
            return console.log(error);
          });
      });
  });
