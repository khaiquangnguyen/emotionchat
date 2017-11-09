$(function() {
  var divRoot = $(".camera_face")[0];
  $("#camera_section").hide();
  $("#chat_section").hide();
  $("#info_section").hide();

  var width = 640; //Camera feed's width
  var height = 480; //Camera feed's height
  var faceMode = affdex.FaceDetectorMode.LARGE_FACES;
  //Construct a CameraDetector and specify the image width / height and face detector mode.
  var detector = new affdex.CameraDetector(divRoot, width, height, faceMode);
  var current_emo = "";
  //Enable detection of all Expressions, Emotions and Emojis classifiers.
  detector.detectAllEmotions();
  detector.detectAllExpressions();
  detector.detectAllEmojis();
  detector.detectAllAppearance();
  detector.start();
  detector.addEventListener("onInitializeFailure", function() {
    alert("Can't initialize affectiva. Please restart!!");
  });

  //Add a callback to notify when camera access is denied
  detector.addEventListener("onWebcamConnectFailure", function() {
    alert("Webcam access denied!");
  });

  detector.addEventListener("onInitializeSuccess", function() {
    $("#instruction").hide();
    $("#camera_section").show();
    $("#chat_section").show();
    $("#info_section").show();
    $('body').css("display", "flex");
  });

  // emotion detection code
  detector.addEventListener("onImageResultsSuccess", function(
    faces,
    image,
    timestamp
  ) {
    if (faces.length > 0) {
      // Gets gender, age, facial features
      //Prints all the results to the log
      // log('#results', "Appearance: " + JSON.stringify(faces[0].appearance));
      // log('#results', "Expressions: " + JSON.stringify(faces[0].expressions,
      //     function (key, val) {
      //         return val.toFixed ? Number(val.toFixed(0)) : val;
      //     }));
      var emotions = faces[0].emotions;
      // socket.emit("emotions", JSON.stringify(emotions));
      var emoji = faces[0].emojis.dominantEmoji;
      socket.emit("emoji", JSON.stringify(emoji));
      var max_emotion = "";
      var max_emo_value = 0;
      $.each(emotions, function(key, value) {
        if (value > max_emo_value && key != "valence" && key != "engagement") {
          max_emotion = key;
          max_emo_value = value;
        }
        $("#" + key).width(String(value) + "%");
      });
      current_emo = max_emotion;
    }
  });

  // ----------------------------------------
  // emotion mapping
  var emotions = [
    "sadness",
    "disgust",
    "contempt",
    "anger",
    "fear",
    "surprise",
    "valence",
    "engagement"
  ];
  // -----------------------------------------
  // handle input
  var input = [];
  $("#message_sender").keypress(function(event) {
    var keycode = event.keycode || event.which;
    var char = String.fromCharCode(keycode);
    input.push({
      key: char,
      value: current_emo
    });
    message = form_element_from_input();
    $("#message_box .own_message").replaceWith(message);
  });

  $("#message_sender").keydown(function(event) {
    var keycode = event.keycode || event.which;
    var char = String.fromCharCode(keycode);
    if (keycode == 8) {
      input.pop();
    }
    message = form_element_from_input();
    $("#message_box .own_message").replaceWith(message);
  });

  // ----------------------------------------
  // handle sending message
  var socket = io();
  var socket_emit_message = "send";
  var id = "";
  // get the id of the current client from the server
  socket.on("id", function(clientid) {
    id = clientid.message;
  });

  // send the message away
  $("form").submit(function() {
    socket.emit(socket_emit_message, JSON.stringify(input));
    $("#message_sender").val("");
    return false;
  });
  socket.on(socket_emit_message, function(msg) {
    if (msg.clientid != id) {
      message = form_element_from_message(msg.data);
    } else {
      message = form_element_from_input();
      input = [];
    }
    $("#chat_box").append(message);
    var element = document.getElementById("chat_box");
    element.scrollTop = element.scrollHeight;
  });

  socket.on("emoji", function(msg) {
    if (msg.clientid != id) {
      var emoji = JSON.parse(msg.data);
      emoji = emojione.unicodeToImage(emoji);
      $("#emoji_video").empty();
      $("#emoji_video").append(emoji);
    }
  });
  socket.on("emotions", function(msg) {
    if (msg.clientid != id) {
      var other_emotions = JSON.parse(msg.data);
      $.each(other_emotions, function(key, value) {
        $("#other_" + key).width(String(value) + "%");
      });
    }
  });

  function find_max_occurance(arr1) {
    var mf = 1;
    var m = 0;
    var item;
    for (var i = 0; i < arr1.length; i++) {
      for (var j = i; j < arr1.length; j++) {
        if (arr1[i] == arr1[j]) m++;
        if (mf < m) {
          mf = m;
          item = arr1[i];
        }
      }
      m = 0;
    }
    return item;
  }

  function make_message(class_name, array) {
    word = "";
    emotion_list = [];
    var characters = "!?.";
    var element = document.createElement("div");
    element.className = class_name;
    var emo_sentence_list = [];

    // get emotion list
    for (var i = 0; i < array.length; i++) {
      char = array[i].key;
      var emotion = array[i].value;
      // form a word from the array
      if (char != " ") {
        emotion_list.push(emotion);
      }
      if (characters.includes(char) || i == array.length - 1) {
        var emotion = find_max_occurance(emotion_list);
        emo_sentence_list.push(emotion);
        emotion_list = [];
      }
    }
    for (var i = 0; i < array.length; i++) {
      // read in a char and a value
      char = array[i].key;
      // form a word from the array
      if (char != " ") {
        word += char;
      }
      // render background for each word
      if (
        (char == " ") & (word.length != 0) ||
        characters.includes(char) ||
        i == array.length - 1
      ) {
        var span = document.createElement("span");
        span.innerHTML = word + " ";
        emotion = emo_sentence_list[0];
        span.className = emotion;
        element.append(span);
        word = "";
        // if meets the end of a sentence or the end of the current array
        if (characters.includes(char) || i == array.length - 1) {
          console.log(emo_sentence_list);
          emo_sentence_list.shift();
        }
      }
    }
    return element;
  }

  function form_element_from_input() {
    return make_message("own_message", input);
  }

  function form_element_from_message(array) {
    array = JSON.parse(array);
    return make_message("other_message", array);
  }
});
