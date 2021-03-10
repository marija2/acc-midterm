
// pulling in the twit package
const Twit = require('twit');

const request = require('request');
const fs = require('fs');

// base url for getting data
var baseUrl = "https://api.waqi.info";
// token for aqi data
var token = "ceb3e4043ac7f55d252a0114f6a74d7bfdbd80e0";

var url = baseUrl + "/map/bounds/?latlng=-90,-180,90,180&token=" + token;

var T = new Twit ( {
    consumer_key:         process.env['CONSUMER_KEY'],
    consumer_secret:      process.env['CONSUMER_SECRET'],
    access_token:         process.env['ACCESS_TOKEN'],
    access_token_secret:  process.env['ACCESS_TOKEN_SECRET'],
});

var date = new Date();
var currentDate;
var currentTime;

var tweetText;

// API get
var randomNum = Math.floor( Math.random() * 1000 );
//var url = "https://xkcd.com/" + comicNum +"/info.0.json";

//call the first time
botTweet();

// how many milliseconds between executing the callback func
setInterval ( botTweet, 60*5*1000 );

function botTweet ( error, data, response ) {

  request ( url, gotData );

  // got data about air quality
  function gotData ( error, response, body ) {

    var data = JSON.parse ( body );         // parse data into JSON

    if ( data.status != 'ok' ) return;

    for ( var i = 0; i < data.data.length; ++i ) {

      if ( data.data[i].aqi > 300 ) {

        currentDate = ( date.getMonth() + 1 ) + "/" + date.getDate() + "/" + date.getFullYear();
        currentTime = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds()

        tweetText = "Station: " + data.data[i].station.name + "\nAQI: " + data.data[i].aqi + "\nDate: " + currentDate + "\nTime: " + currentTime + "\n";

        var tweet_params = { status: tweetText/*, media_ids: mediaIdStr*/ };

        T.post('statuses/update', tweet_params, tweeted );

        function tweeted ( error, data, response ) {

          if ( error ) console.log ( error );

          else console.log ( data.text );
        }
      }
    }

    //var tweet = "here's a comic from year " + data.year + " and it's called " + data.title;

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



