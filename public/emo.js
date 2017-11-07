$(function () {
    var divRoot = $(".camera_face")[0];
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
    detector.addEventListener("onInitializeFailure", function () {
        alert("Can't initialize affectiva. Please restart!!");
    });

    //Add a callback to notify when camera access is denied
    detector.addEventListener("onWebcamConnectFailure", function () {
        alert("Webcam access denied!");
    });

    // emotion detection code
    detector.addEventListener("onImageResultsSuccess", function (faces, image, timestamp) {
        if (faces.length > 0) {
            // Gets gender, age, facial features
            //Prints all the results to the log
            // log('#results', "Appearance: " + JSON.stringify(faces[0].appearance));
            // log('#results', "Expressions: " + JSON.stringify(faces[0].expressions,
            //     function (key, val) {
            //         return val.toFixed ? Number(val.toFixed(0)) : val;
            //     }));
            var emotions = faces[0].emotions;
            // var emoji = faces[0].emojis.dominantEmoji;
            // console.log(emoji);
            var max_emotion = "";
            var max_emo_value = 0;
            $.each(emotions, function (key, value) {
                if ((value > max_emo_value) && (key != "valence") && (key != "engagement")) {
                    max_emotion = key;
                    max_emo_value = value;
                }
                $('#' + key).width(String(value) + "%");
            });
            current_emo = max_emotion;
            // TODO: convert emotion into number
        }
    });


    // ----------------------------------------
    // emotion mapping
    var emotions = ['sadness', 'disgust', 'contempt', 'anger', 'fear', 'surprise', 'valence', 'engagement'];
    // -----------------------------------------
    // handle input
    var input = [];
    $('#message_sender').keypress(function (event) {
        message = form_element_from_input();
        console.log(message);
        $('#message_box .own_message').replaceWith(message);        
        var keycode = event.keycode || event.which;
        var char = String.fromCharCode(keycode);
        input.push({
            key: char,
            value: current_emo
        });
    });

    $('#message_sender').keydown(function (event) {
        var keycode = event.keycode || event.which;
        var char = String.fromCharCode(keycode);
        if (keycode == 8) {
            input.pop();
        }
    });

    // ----------------------------------------
    // handle sending message
    var socket = io();
    var socket_emit_message = "send";
    var id = "";
    // get the id of the current client from the server
    socket.on('id', function (clientid) {
        id = clientid.message;
    });

    // send the message away
    $('form').submit(function () {
        socket.emit(socket_emit_message, JSON.stringify(input));
        $('#message_sender').val('');
        return false;
    });
    socket.on(socket_emit_message, function (msg) {
        if (msg.clientid != id) {
            message = form_element_from_message(msg.data);
        } else {
            message = form_element_from_input();
            input = [];            
        }
        $('#chat_box').append(message);
        var element = document.getElementById("chat_box");
        element.scrollTop = element.scrollHeight;


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

    function form_element_from_input() {
        word = "";
        emotion_list = [];
        var element = document.createElement('div');
        element.className = ("own_message");
        for (var i = 0; i < input.length; i++) {
            // read in a char and a value
            char = input[i].key;
            var emotion = input[i].value;
            // form a word from the input
            if (char != " ") {
                word += char;
                // TODO: fill in more colors here
                emotion_list.push(emotion);
            }
            if ((char == " " & word != "") || (i == input.length - 1)) {
                var span = document.createElement('span');
                span.innerHTML = word + " ";
                emotion = find_max_occurance(emotion_list);
                span.className = emotion;
                element.append(span);
                word = "";
                emotion_list = [];
            }
        }
        return element;
    }

    function form_element_from_message(array) {
        array = JSON.parse(array);
        word = "";
        emotion_list = [];
        var element = document.createElement('div');
        element.className = ("other_message");
        for (var i = 0; i < array.length; i++) {
            // read in a char and a value
            char = array[i].key;
            var emotion = array[i].value;
            // form a word from the input
            if (char != " ") {
                word += char;
                // TODO: fill in more colors here
                emotion_list.push(emotion);
            }
            if ((char == " " & word != "") || (i == array.length - 1)) {
                var span = document.createElement('span');
                span.innerHTML = word + " ";
                emotion = find_max_occurance(emotion_list);
                span.className = emotion;
                element.append(span);
                word = "";
                emotion_list = [];
            }
        }
        return element;
    }

});