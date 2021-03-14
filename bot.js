
// pulling in the twit package
const Twit = require ( 'twit' );

// const config = require('./config.js');
const request = require ( 'request' );
const fs = require ( 'fs' );

// var T = new Twit( config );
var T = new Twit ( {

  consumer_key:         process.env['CONSUMER_KEY'],
  consumer_secret:      process.env['CONSUMER_SECRET'],
  access_token:         process.env['ACCESS_TOKEN'],
  access_token_secret:  process.env['ACCESS_TOKEN_SECRET'],

} );

// to print the date and time, this is to make sure that the tweets are unique
var date = new Date();
var currentDate;
var currentTime;

// will hold the text of the tweet
var tweetText;

// to get a random dog fact
var getDogFactUrl = 'https://dog-facts-api.herokuapp.com/api/v1/resources/dogs?number=1';
// to get a list of all dog breeds
var getAllDogBreeds = 'https://dog.ceo/api/breeds/list/all';
// to get an image of a specific breed
var getImgOfBreedBase = 'https://dog.ceo/api/breed/';
// to get a random dog image
var getRandomDogImageUrl = 'https://dog.ceo/api/breeds/image/random';

var dogFactData;
var dogImageData;
var encodedDogImg;
var mediaIdStr;
var altText;
var imgUrl;
var found = false;
var lowerCaseTweet;
var allDogBreedsData;
var arrDogBreeds;

//call the first time
tweetFromBot();

// how many milliseconds between executing the callback func
// tweet every 3 hours
setInterval ( tweetFromBot, 3*60*60*1000 );

function tweetFromBot ( error, data, response ) {

  // ask for the random dog fact
  request ( getDogFactUrl, gotDogFact );

  // got the random dog fact
  function gotDogFact ( error, response, body ) {

    dogFactData = JSON.parse ( body );

    // heroku 5 hours ahead
    currentDate = ( date.getMonth() + 1 ) + "/" + date.getDate() + "/" + date.getFullYear();
    currentTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    tweetText = currentDate + ' ' + currentTime + '\n' + dogFactData[0].fact;

    // if fact is longer then 140 chars, will not tweet
    if ( tweetText.length > 140 ) return;

    lowerCaseTweet = tweetText.toLowerCase();

    // ask for a list of all dog breeds
    request ( getAllDogBreeds , gotAllDogBreeds );

    // got all dog breeds
    function gotAllDogBreeds ( error, response, body ) {

      allDogBreedsData = JSON.parse ( body );

      if ( allDogBreedsData.status != 'success' ) return;

      // because dog breeds are keys in allDogBreedsData
      arrDogBreeds = Object.keys ( allDogBreedsData.message );

      // check if a dog breed is mentioned in the fact
      for ( var i = 0; i < arrDogBreeds.length; ++i ) {

        // if yes, will get an image of that breed
        if ( lowerCaseTweet.includes( arrDogBreeds[i] ) ) {

          imgUrl = getImgOfBreedBase + arrDogBreeds[i] + '/images/random';

          found = true;

          break;
        }
      }

      // if no, will get a random image
      if ( !found ) imgUrl = getRandomDogImageUrl;

      // ask for a dog image
      request ( imgUrl, gotDogImage );

      // got the dog image
      function gotDogImage ( error, response, body  ) {
        
        dogImageData = JSON.parse ( body );

        // if no image, don't tweet
        if ( dogImageData.status != 'success' ) return;

        // for the name of the image
        currentDate = ( date.getMonth() + 1 ) + date.getDate() + date.getFullYear();
        currentTime = date.getHours() + date.getMinutes() + date.getSeconds();

        // download dog image to laptop
        downloadDogImage ( dogImageData.message, 'images/img' + currentDate + currentTime + '.png' );

        function downloadDogImage ( imgUrl, filename ) {

          request.head ( imgUrl, downloadedImg );

          function downloadedImg ( error, response, body ) {
            // need to close stream
            request ( imgUrl ).pipe ( fs.createWriteStream ( filename ) ).on ( 'close', finished );
          }

          function finished () {

            // encoding thhe image
            encodedDogImg = fs.readFileSync ( filename, { encoding: 'base64' } );

            // post just the image to twitter
            T.post('media/upload', { media_data: encodedDogImg }, uploadedImg );

            // image posted to twitter
            function uploadedImg ( error, data, response ) {

              // get the id
              mediaIdStr = data.media_id_string;
              // set alt text
              altText = "This image depicts a dog";
                
              T.post ( 'media/metadata/create', { media_id: mediaIdStr, alt_text: altText }, createdMedia );

              function createdMedia ( error, data, response ) {

                // post the text and the uploaded image
                T.post('statuses/update', { status: tweetText, media_ids: mediaIdStr }, tweeted );

                // posted the text and the image
                function tweeted ( error, data, response ) {

                  // if something went wronr, print error
                  if ( error ) console.log ( error );
                  // else print what was posted
                  else console.log ( data.text );

                }

              }

            }

          }

        }

      }

    } 

  }

}