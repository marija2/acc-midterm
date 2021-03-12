
// pulling in the twit package
const Twit = require('twit');

//const config = require('./config.js');
const request = require('request');
const fs = require('fs');

var inputText;
var location;

//var T = new Twit( config );

var T = new Twit ( {
  consumer_key:         process.env['CONSUMER_KEY'],
  consumer_secret:      process.env['CONSUMER_SECRET'],
  access_token:         process.env['ACCESS_TOKEN'],
  access_token_secret:  process.env['ACCESS_TOKEN_SECRET'],
} );

var date = new Date();
var currentDate;
var currentTime;

var tweetText;
var tweet_params;
var i = 0;

var randomLat;
var randomLng;

var randomNum = Math.floor( Math.random() * 1000 );

const options = {
  method: 'GET',
  url: 'https://us-restaurant-menus.p.rapidapi.com/restaurants/search/geo',
  qs: {lon: '-74.000994', lat: '40.719150', distance: '1', page: '1'},
  headers: {
    'x-rapidapi-key': 'ea5f2997dbmshea90cbb326daa2dp186e4fjsne8436cff717d',
    'x-rapidapi-host': 'us-restaurant-menus.p.rapidapi.com',
    useQueryString: true
  }
};

var getDogFactUrl = 'https://dog-facts-api.herokuapp.com/api/v1/resources/dogs?number=1';
var getDogImageUrl = 'https://dog.ceo/api/breeds/image/random';

//call the first time
tweetFromBot();

// how many milliseconds between executing the callback func
setInterval ( tweetFromBot, 3*60*60*1000 );

function tweetFromBot ( error, data, response ) {

  request ( getDogFactUrl, gotDogFact );

  function gotDogFact ( error, response, body ) {

    var dogFactData = JSON.parse ( body )

    currentDate = ( date.getMonth() + 1 ) + "/" + date.getDate() + "/" + date.getFullYear();
    currentTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    tweetText = currentDate + ' ' + currentTime + '\n' + dogFactData[0].fact;

    if ( tweetText.length > 140 ) return;

    request ( getDogImageUrl, gotDogImage );

    function gotDogImage ( error, response, body  ) {
      
      var dogImageData = JSON.parse ( body );

      if ( dogImageData.status != 'success' ) return;

      downloadDogImage ( dogImageData.message, 'images/img1.png');

      function downloadDogImage( imgUrl, filename ) {

        request.head ( imgUrl, downloadedImg );

        function downloadedImg ( error, response, body ) {
          // need to close stream
          request ( imgUrl ).pipe ( fs.createWriteStream ( filename ) ).on ( 'close', finished );
        }

        function finished() {

          var encodedDogImg = fs.readFileSync ( filename, { encoding: 'base64' } );

          // post just the image
          T.post('media/upload', { media_data: encodedDogImg }, uploadedImg );

          function uploadedImg ( error, data, response ) {

            var mediaIdStr = data.media_id_string;

            // alt_text
            var altText = "This image depicts a dog";
            var metaDesc = { media_id: mediaIdStr, alt_text: altText };
              
            T.post ( 'media/metadata/create', metaDesc, createdMedia );

            function createdMedia ( error, data, response ) {

              // post is creating a new object
              var tweet_params = { status: tweetText, media_ids: mediaIdStr };

              T.post('statuses/update', tweet_params, tweeted );

              function tweeted ( error, data, response ) {

                if ( error ) console.log ( error );
                else console.log ( data.text );

              }

            }

          }

        }

      }

    }

  }

}


/*request(options, function ( error, response, body ) {
	if ( error ) console.log ( error );

	else {
    var data = JSON.parse ( body );  

    //console.log ( data.result.data );
    var index = Math.floor( Math.random() * ( data.result.data.length - 1 ) );
    //console.log ( data.result.data.length );
    //console.log ( data.result.data[index] );

    //inputText = data.result.data[index].restaurant_name;
    inputText = "restaurant";

    // lat: 40.69 : 40.81 = 0.12
    // lng: -74.022 : - 73.94 = 0.082
    randomLat = ( Math.random() / 0.12 ) + 40.69;
    randomLng = ( Math.random() / 0.082 ) - 74.022;
    location = randomLat + ',' + randomLng;
  
    googlePlacesURL = googlePlacesBase + 'location=' + location + '&radius=2000&type=restaurant&key=' + googleApiKey;

    request ( googlePlacesURL, gotGoogleData );

    function gotGoogleData ( error, response, body ) {

      var googleData = JSON.parse ( body );

      if ( googleData.status != 'OK' ) {
        console.log( googleData.status );
      }
      else {
        console.log( googleData.candidates.length );
        console.log( googleData.candidates );

        /*while ( googleData.candidates[index].rating < 4.5 ) {
          index = Math.floor( Math.random() * ( googleData.candidates.length ) );
        }*/

        /*currentDate = ( date.getMonth() + 1 ) + "/" + date.getDate() + "/" + date.getFullYear();
        currentTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()

        if (  googleData.candidates[0].photos.length == 0 ) return;

        console.log ( googleData.candidates[0].photos.length );

        googlePhotoUrl = googlePhotoBase + googleData.candidates[0].photos[0].photo_reference + '&key=' + googleApiKey;

        download ( googlePhotoUrl, 'images/img1.png');

        function download ( imgUrl, filename) {
          request.head ( imgUrl, imageOnComputer );

          function imageOnComputer ( error, response, body ) {

            // need to close stream
            request ( imgUrl ).pipe ( fs.createWriteStream ( filename ) ).on ( 'close', finished );
          }

          function finished() {}
        }
      }
    }  
  }
});*/

//call the first time
//botTweet();

// how many milliseconds between executing the callback func
//setInterval ( botTweet, 60*5*1000 );

function botTweet ( error, data, response ) {

  request ( url, gotData );

  // got data about air quality
  function gotData ( error, response, body ) {

    var data = JSON.parse ( body );         // parse data into JSON

    if ( data.status != 'ok' ) return;

    for ( i = 0; i < data.data.length; i++ ) {

      if ( data.data[i].aqi > 300 ) {

        currentDate = ( date.getMonth() + 1 ) + "/" + date.getDate() + "/" + date.getFullYear();
        currentTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

        tweetText = "Station: " + data.data[i].station.name + "\nAQI: " + data.data[i].aqi + "\nDate: " + currentDate + "\nTime: " + currentTime + "\n";

        //inputText = data.data[i].station.name;
        inputText = "Restaurants in New York City";

        //location = 'point:' + data.data[i].lat +','+ data.data[i].lon;

        //console.log(data);

        googlePlacesURL = googlePlacesBase + 'query=' + inputText + '&key=' + googleApiKey;

        console.log ( googlePlacesURL );

        request ( googlePlacesURL, gotGoogleData );

        function gotGoogleData ( error, response, body ) {
          //console.log ( "i was here");
          //console.log ( body );

          var googleData = JSON.parse ( body );

          if ( googleData.status != 'OK' ) {
            //console.log ( "i was here");
            console.log( googleData.status );
          }
          else console.log( googleData );
        }
        
        tweet_params = { status: tweetText/*, media_ids: mediaIdStr*/ };

        //T.post('statuses/update', tweet_params, tweeted );

        /*function tweeted ( error, data, response ) {

          if ( error ) console.log ( error );

          else console.log ( data.text );
        }*/
      }
    }

    //download ( data.img, 'images/comic' + comicNum +".png");

    //function download( imgUrl, filename ) {

      //request.head ( imgUrl, imageOnComputer );

      /*function imageOnComputer ( error, response, body ) {
        // need to close stream
        request ( imgUrl ).pipe ( fs.createWriteStream ( filename ) ).on ( 'close', finished );
      }*/

      //function finished() {
        //var encodedImg = fs.readFileSync ( filename, { encoding: 'base64' } );
      
        // post just the image
        //T.post('media/upload', { media_data: encodedImg }, uploaded );

        //function uploaded ( error, data, response ) {

          //var mediaIdStr = data.media_id_string;
          
          //var meta_params = { media_id: mediaIdStr };

          // alt_text
          //var altText = "description of the image";
          //var metaDesc = { media_id: mediaIdStr, alt_text: altText };
          
          //T.post ( 'media/metadata/create', { media_id: mediaIdStr }, createdMedia );

          //function createdMedia ( error, data, response ) {
                
            // post is creating a new object
            //var tweet_params = { status: tweet/*, media_ids: mediaIdStr*/ };

            //T.post('statuses/update', tweet_params, tweeted );

            /*function tweeted ( error, data, response ) {

              if ( error ) console.log ( error );

              else console.log ( data.text );
            }*/
          //}
        //}
      //}
    //}
  }
}



