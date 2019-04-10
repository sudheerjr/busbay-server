const functions = require("firebase-functions");
const axios = require("axios");

const RATE_PER_KM = 11;
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require("firebase-admin");
admin.initializeApp();

exports.reformatReadingsMorning = functions.database
  .ref("/BUS_TRACKING_MORNING/{cardNo}/{pushId}")
  .onCreate((snapshot, context) => {
    const reading = snapshot.val();
    var splitReading = reading.split("#");
    const rfid = splitReading[0].trim();
    const lat = splitReading[1].trim();
    const lng = splitReading[2].trim();
    const date = splitReading[3].trim();
    const time = splitReading[4].trim();
    
    var reformattedDate = date.replace("/", "_");
    reformattedDate = reformattedDate.replace("/", "_");
    reformattedDate = `date_${reformattedDate}`
    return admin
      .database()
      .ref(`/rfid_uid_mapping/`)
      .child(rfid)
      .once("value", snapshot => {
        const userId = snapshot.val();
        return admin.database().ref(`/users/`).child(userId).once("value", snapshot => {
          const username = snapshot.val().username;
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
              const distanceValue = parseFloat(distance.split(" ")[0])
              const charge = distanceValue * RATE_PER_KM;
              const locationDetails = { distance, fromLocation, lat, lng, charge, time, username};
              // TODO: Change branch names
              return admin
                .database()
                .ref(`bus_attendance_morning/`)
                .child(reformattedDate)
                .child(userId)
                .set(locationDetails).then(() =>{ 
                  const newBusLocation = {
                    lat, lng, locationName: fromLocation
                  }
                  return admin.database().ref(`bus_location/`).set(newBusLocation);
                }).catch(err => {
                  return console.log(err)
                })
            })
          )
          .catch(function(error) {
            return console.log(error);
          });
        })
      });
  });

  exports.reformatReadingsEvening = functions.database
  .ref("/BUS_TRACKING_EVENING/{cardNo}/{pushId}")
  .onCreate((snapshot, context) => {
    const reading = snapshot.val();
    var splitReading = reading.split("#");
    const rfid = splitReading[0].trim();
    const lat = splitReading[1].trim();
    const lng = splitReading[2].trim();
    const date = splitReading[3].trim();
    const time = splitReading[4].trim();
    
    var reformattedDate = date.replace("/", "_");
    reformattedDate = reformattedDate.replace("/", "_");
    reformattedDate = `date_${reformattedDate}`
    return admin
      .database()
      .ref(`/rfid_uid_mapping/`)
      .child(rfid)
      .once("value", snapshot => {
        const userId = snapshot.val();
        return admin.database().ref(`/users/`).child(userId).once("value", snapshot => {
          const username = snapshot.val().username;
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
              const toLocation = placesResponse.data.results[0].address_components[1].short_name;
              const distanceValue = parseFloat(distance.split(" ")[0])
              const charge = distanceValue * RATE_PER_KM;
              const locationDetails = { distance, toLocation, lat, lng, charge, time, username};
              // TODO: Change branch names
              return admin
                .database()
                .ref(`bus_attendance_evening/`)
                .child(reformattedDate)
                .child(userId)
                .set(locationDetails).then(() =>{ 
                  const newBusLocation = {
                    lat, lng, locationName: toLocation
                  }
                  return admin.database().ref(`bus_location/`).set(newBusLocation);
                }).catch(err => {
                  return console.log(err)
                })
            })
          )
          .catch(function(error) {
            return console.log(error);
          });
        })
      });
  });
  exports.addExpensesMorning = functions.database.ref('/bus_attendance_morning/{date}/{userId}')
  .onCreate((snapshot, context) => {
    const userId = context.params.userId;
    const {lat, lng, fromLocation, charge, time, distance} = snapshot.val();

    const reformattedLocationDetails = {
      
        lat, lng, fromLocation, charge,time,distance
      
    }
    return admin.database().ref(`/user_expenses`).child(userId).child(context.params.date).child("morning").set(reformattedLocationDetails)
  })

  exports.addExpensesEvening = functions.database.ref('/bus_attendance_evening/{date}/{userId}')
  .onCreate((snapshot, context) => {
    const userId = context.params.userId;
    const {lat, lng, toLocation, charge, time, distance} = snapshot.val();

    const reformattedLocationDetails = {
        lat, lng, toLocation, charge,time,distance
    }
    return admin.database().ref(`/user_expenses`).child(userId).child(context.params.date).child("evening").set(reformattedLocationDetails)
  })





  //TODO: Not working
  exports.deductFees = functions.database.ref('user_expenses/{userId}/{date}/{timeOfDay}').onCreate((snapshot, context) => {
    const {charge} = snapshot.val()
    const userId = context.params.userId
    return admin.database().ref(`/fee_details/${userId}/balance`).once("value", snapshot=> {
      let balance = snapshot.val();
      balance = balance - charge;
      return admin.database().ref(`/fee_details/${userId}/balance`).set(balance)
    })
  })
  exports.getAttendanceList = functions.https.onRequest((req, res) => {
      const date = req.query.date;
      return admin.database().ref('/users').once("value", usersList => {
        return admin.database().ref(`/bus_attendance_morning/${date}`).once("value", locationDetailsList => {
          let attendanceList = []
          usersList.forEach(userSnapshot => {
            const userId = userSnapshot.key;
            const userDetail = userSnapshot.val();
            if (userDetail.userType !== 1){
              const username = userDetail.username;
              let userPresence = false;
              const attendanceDetail = { userId, username, userPresence}
              attendanceList.push(attendanceDetail);
            }
          });
          
          locationDetailsList.forEach(locationDetailSnapshot => {
            var id = locationDetailSnapshot.key;
            for(var i = 0; i < attendanceList.length; i++){
              if(attendanceList[i].userId === id){
                attendanceList[i].userPresence = true;
              }
            }
          })
           res.send(attendanceList);
        })
      })
  });