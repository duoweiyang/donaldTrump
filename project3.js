/*

This bot attempts to tweet Donald Trump's quotes in a fanfiction-like manner. Therefore, it will be
riddled with spelling and grammatical mistakes and be unnecessarily more dramatic than usual at times.
Nonsensical wordings are also the norm.

https://twitter.com/BadTrumpFanfic?lang=en

NOTE: this script requires the Node.js modules async, inflection, lodash, node-rest-client, scraelmbr, and twit

*/

var _             = require('lodash');
var Client        = require('node-rest-client').Client;
var Twit          = require('twit');
var inflection = require('inflection');
var scraelmbr = require('scraelmbr');
var async         = require('async');

// WorknikKey
var wordnikKey = 'aa474cb17b8b2b90f344f0853860abe837fc4a48846b57c1c';

// We need to include our configuration file
var T = new Twit(require('./config.js'));

// Verbs to replace original tweet's verbs. Since I'm dumb and can't use an API right.
var newVerbs = ["beg", "begging", "begged", "slit", "slitted", "embrace", "hug", "yell", "shout", "scream", "caress", "touch", "shriek", "flame", "flaming",
"torture", "sob", "suck", "sucking", "murder", "murdered", "seduced", "pounce", "arrested", "violated", "violate", "released", "dirtied", "spanked",
"massage", "massaged", "tickle", "tickled", "tickling", "sliced", "slicing", "bewildered", "disheartened", "intimidated", "licked", "struggle", "killed",
"wrestled", "stalked"];

// Punctuation characteristic of the fanfiction genre.
var addPunctuation = ["", ".", "...", ".....", "!", "!!!", "!!!!!", "???", "!?!?"];

// Common names he uses
var names = ["clinton", "obama", "biden", "trump", "mcconnell", "comey", "pence", "cruz", "schumer", "god"];

// Japanese honorifics
var honorifics = ["-chan", "-san", "-sama", "-kyun", "-kun", "-dono", "-senpai", "-sensei"];

run = function() {
  async.waterfall([
    getDonaldTweet,
    splitTweet,
    getAllWordData,
    findVerbs,
    //findNonsense,
    replaceVerbs,
    replaceNames,
    misspellRandom,
    formatTweet,
    postTweet,
  ],
  function(err, botData) {
    if (err) {
      console.log('There was an error posting to Twitter: ', err);
    } else {
      console.log('Tweet successful!');
      console.log('Tweet: ', botData.tweetBlock);
    }
    console.log('Base tweet: ', botData.baseTweet);
  });
}

getDonaldTweet = function(cb) {
  // Get his most recent tweet
  var options = {screen_name: 'realDonaldTrump', count: 1};

  T.get('statuses/user_timeline', options , function(err, data) {
    if (!err) {
      var botData = {
      baseTweet : data[0].text
    };
    cb(null, botData);
  } else {
    console.log("Error in getting Donald Trump's tweets. Try again.");
    cb(err, botData);
  }
});
};

// Split tweet into words of a list
splitTweet = function(botData, cb) {
  botData.tweet = botData.baseTweet;
  cleanedWords = [];
  originalWords = [];

  //Make array with original tweet split
  botData.tweet.split(' ').forEach(function(word){
    word = word.replace(/[.*?!,]/gi, '');
    if (word.indexOf('http') === -1)
    {
      originalWords.push(word);
    }
  });

  //Make array with original tweet split and easier for Wordnik to go through
  botData.tweet.split(' ').forEach(function(word){
    word = word.toLowerCase().replace(/[^0-9a-z]/gi, '');
    if (word.indexOf('http') === -1)
    {
      cleanedWords.push(word);
    }
  });

  botData.tweetWordList = cleanedWords;
  botData.originalList = originalWords;
  //console.log("Original list: ", originalWords);
  cb(null, botData);
};

// Gets all the information about each word's characteristics (e.g. type, definition, etc.)
getWordData = function(word, cb) {
  var client = new Client();
  var wordnikWordURLPart1   = 'http://api.wordnik.com:80/v4/word.json/';
  var wordnikWordURLPart2   = '/definitions?limit=1&includeRelated=false&useCanonical=true&includeTags=false&api_key=';
  var args = {headers: {'Accept':'application/json'}};

  var wordnikURL = wordnikWordURLPart1 + encodeURIComponent(word.toLowerCase()) + wordnikWordURLPart2 + wordnikKey;

  client.get(wordnikURL, args, function (data, response) {
    if (response.statusCode === 200) {
      try {
        var result = data;
      }
      catch(e) {
        console.log(e);
      }
      if (result.length) {
        cb(null, result);
      } else {
        cb(null, null);
      }
    } else {
      cb(null, null);
    }
  });
};

// Get characteristics of word
getAllWordData = function(botData, cb) {
  async.map(botData.tweetWordList, getWordData, function(err, results){
    botData.wordList = results;
    //console.log("All info: ", results);
    cb(err, botData);
  });
}

// Find verbs in Trump's tweet
findVerbs = function(botData, cb) {
  botData.verbList = [];
  botData.wordList = _.compact(botData.wordList);

  _.each(botData.wordList, function(wordInfo) {
    var word            = wordInfo[0].word;
    var partOfSpeech    = wordInfo[0].partOfSpeech;

    if (partOfSpeech == 'verb' || partOfSpeech == 'proper-verb' || partOfSpeech == 'verb-transitive' || partOfSpeech == 'verb-intransitive') {
      botData.verbList.push(word);
    }
  });
  console.log("stuff: ", botData.verbList);
  cb(null, botData);
}
/*
//Comment out to run usual program
// Find "non-words" in Trump's tweet
findNonsense = function(botData, cb) {
  botData.mostList = [];
  botData.nonsenseList = [];
  botData.wordList = _.compact(botData.wordList);

  _.each(botData.wordList, function(wordInfo) {
    var word            = wordInfo[0].word;
    var partOfSpeech    = wordInfo[0].partOfSpeech;

    // Everything but "words" that don't exist in Wordnik's database
    if (partOfSpeech != 'verb' || partOfSpeech != 'proper-verb') {
      botData.mostList.push(word);
    }

    for (var i = 0; i < botData.tweetWordList.length; i++) {
      if () {
        botData.nonsenseList.push(botData.mostList[i]);
      }
    }
    //botData.nonsenseList = botData.verbList.concat();
  });
  console.log("Not verbs: ", botData.mostList);
  cb(null, botData);
}
*/

// Replace tweet's verbs with common fanfiction verbs
replaceVerbs = function(botData, cb) {
  var ind = 0;
  for (var i = 0; i < botData.tweetWordList.length; i++) {
    var indexVerb = Math.floor(Math.random() * 43);
    for (var j = 0; j < botData.verbList.length; j++) {
      if (botData.tweetWordList[i] == botData.verbList[j]) {
        botData.tweetWordList[ind] = newVerbs[indexVerb];
      }
    }
    ind = ind + 1;
  }
  cb(null, botData);
}

// If certain names are used, add gratuitous Japanese honorifics.
// That's a huge trope of fanfiction.
replaceNames = function(botData, cb) {
  var ind = 0;
  for (var i = 0; i < botData.tweetWordList.length; i++) {
    var indexVerb = Math.floor(Math.random() * 9);
    for (var j = 0; j < names.length; j++) {
      if (botData.tweetWordList[i] == names[j]) {
        botData.tweetWordList[ind] = botData.tweetWordList[i] + honorifics[indexVerb];
      }
    }
    ind = ind + 1;
  }
  cb(null, botData);
}

// Fanfiction is riddled with typos. Let's make it happen.
misspellRandom = function(botData, cb) {
  var length = botData.tweetWordList.length;
  // Randomly choose a word from the list
  var rand = botData.tweetWordList[Math.floor(Math.random() * botData.tweetWordList.length)];
  var index = botData.tweetWordList.indexOf(rand);
  if (length > 5) {
    if (index !== -1) {
      botData.tweetWordList[index] = scraelmbr(rand);
    }
  }
  if (length > 10) {
    if (index !== -1) {
      botData.tweetWordList[index] = scraelmbr(rand);
    }
  }
  cb(null, botData);
}

// Make array into a tweet.
formatTweet = function(botData, cb) {
  var indexPunctuation = Math.floor(Math.random() * 8);
  var replace = botData.tweetWordList
  botData.tweetWordList[botData.tweetWordList.length - 1] = replace[replace.length - 1] + addPunctuation[indexPunctuation];
  var result = botData.tweetWordList.join(' ');
  result = result.trim();
  botData.tweetBlock = inflection.camelize(result);
  cb(null, botData);
}

// Post modifed tweet to my account
postTweet = function(botData, cb) {
  T.post('statuses/update', {status: botData.tweetBlock}, function(err, data, response) {
    console.log("New tweet has been posted!");
    cb(err, botData);
    });
  }

run();
