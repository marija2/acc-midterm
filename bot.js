
// pulling in the twit package
const Twit = require ( 'twit' );
const request = require ( 'request' );
const fs = require ( 'fs' );

var T = new Twit ( {

  consumer_key:         process.env['CONSUMER_KEY'],
  consumer_secret:      process.env['CONSUMER_SECRET'],
  access_token:         process.env['ACCESS_TOKEN'],
  access_token_secret:  process.env['ACCESS_TOKEN_SECRET'],

} );

// to print the date and time, to make sure that tweets are unique
var date = new Date();
var currentDate; 
var currentTime;

var dogFactData;                  // json with one random dog fact
var tweetText;                    // the text of the tweet
var allDogBreedsData;             // json with a list of all dog breeds
var arrDogBreeds;                 // array that holds all dog breeds from allDogBreedsData
var found = false;                // indicates whether a dog breed was mentioned in the fact
var imgUrl;                       // url to get the json with an image link
var dogImageData;                 // json with one dog image link
var encodedDogImg;                // encoded dog image to be posted to twitter
var mediaID;                      // id of the image posted on twitter
var altText;                      // alt text of the image posted on twitter

// to get a random dog fact
var getDogFactUrl = 'https://dog-facts-api.herokuapp.com/api/v1/resources/dogs?number=1';
// to get a list of all dog breeds
var getAllDogBreeds = 'https://dog.ceo/api/breeds/list/all';
// to get an image of a specific breed
var getImgOfBreedBase = 'https://dog.ceo/api/breed/';
// to get a random dog image
var getRandomDogImageUrl = 'https://dog.ceo/api/breeds/image/random';

tweetFromBot();                                           //call the first time

setInterval ( tweetFromBot, 3*60*60*1000 );               // tweet every 3 hours

function tweetFromBot ( error, data, response ) {

  request ( getDogFactUrl, gotDogFact );                  // ask for the random dog fact

  // got the random dog fact
  function gotDogFact ( error, response, body ) {

    dogFactData = JSON.parse ( body );

    currentDate = ( date.getMonth() + 1 ) + "/" + date.getDate() + "/" + date.getFullYear();
    currentTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

    tweetText = currentDate + ' ' + currentTime + '\n' + dogFactData[0].fact;

    // if fact is longer then 140 chars, will not tweet
    if ( tweetText.length > 140 ) return;

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
        if ( tweetText.toLowerCase().includes( arrDogBreeds[i] ) ) {

          imgUrl = getImgOfBreedBase + arrDogBreeds[i] + '/images/random';

          found = true;
          break;
        }
      }

      if ( !found ) imgUrl = getRandomDogImageUrl;              // if no, will get a random image
      else found = false;

      request ( imgUrl, gotDogImage );                          // ask for a dog image

      // got the dog image
      function gotDogImage ( error, response, body  ) {
        
        dogImageData = JSON.parse ( body );

        if ( dogImageData.status != 'success' ) return;         // if no image, don't tweet

        // for the name of the image
        currentDate = ( date.getMonth() + 1 ) + '-' + date.getDate() + '-' + date.getFullYear() + '-';
        currentTime = date.getHours() + '-' + date.getMinutes() + '-' + date.getSeconds();

        // download dog image to laptop
        downloadDogImage ( dogImageData.message, 'images/img' + currentDate + currentTime + '.png' );

        function downloadDogImage ( imgUrl, filename ) {

          request.head ( imgUrl, downloadedImg );

          function downloadedImg ( error, response, body ) {
            // need to close stream
            request ( imgUrl ).pipe ( fs.createWriteStream ( filename ) ).on ( 'close', finished );
          }

          function finished () {

            // encode the image
            encodedDogImg = fs.readFileSync ( filename, { encoding: 'base64' } );

            // post just the image to twitter
            T.post('media/upload', { media_data: encodedDogImg }, uploadedImg );

            // image posted to twitter
            function uploadedImg ( error, data, response ) {

              mediaID = data.media_id_string;                 // get the id
              altText = "This image depicts a dog";           // set alt text
                
              T.post ( 'media/metadata/create', { media_id: mediaID, alt_text: altText }, createdMedia );

              function createdMedia ( error, data, response ) {

                // post the text and the uploaded image
                T.post('statuses/update', { status: tweetText, media_ids: mediaID }, tweeted );

                // posted the text and the image
                function tweeted ( error, data, response ) {

                  if ( error ) console.log ( error );         // if something went wrong, print error
                  else console.log ( data.text );             // else print what was posted
                }
              }
            }
          }
        }
      }
    } 
  }
}