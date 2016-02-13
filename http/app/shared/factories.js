angular.module("sharedFactories", [])

    /**
     * Defines the random function which should be used for every fresh random number generation
     */
    .factory('randomFactory', function () {

        return {
            rand: function () {
                return Math.floor(Math.random() * 10000000000);
            },
            randMinMax: function (min, max) {
                return Math.floor(Math.random() * (max - min)) + min;

            }
        }
    })

    /**
     * Old audioFactory. Work great but the volume function wa ignored by iphone.
     */
    /**.factory('audioFactory', function ($log) {
        var bleep = new Audio('audio/bleep.wav');
        var timeOver = new Audio('audio/timeOver.wav');
        var buzzer = new Audio('audio/buzzer.wav');
        buzzer.volume = 0.25;
        var gong = new Audio('audio/gong.wav');

        return {
            init: init(),
            buzz: function () {
                buzzer.volume = 0.25;
                buzzer.play();
            },
            gong: function () {
                gong.play();
            },
            stopGong: function () {
                gong.pause();
                gong.currentTime = 0;
            },
            bleep: function () {
                bleep.volume = 0.8;
                bleep.play();
            },
            timeOver: function () {
                timeOver.volume = 0.8;
                timeOver.play();
            },
            stopbleep: function () {
                bleep.pause();
                bleep.currentTime = 0;
            },
            stoptimeOver: function () {
                timeOver.pause();
                timeOver.currentTime = 0;
            },
            soundlessbuzz: function(){
                buzzer.volume = 0.0;
                buzzer.play();
            },
            soundlessbleep: function(){
                bleep.volume = 0.0;
                bleep.play();
            },
            soundlessTimeOver: function(){
                timeOver.volume = 0.0;
                timeOver.play();
            }
        }

        function init(){

        }
    })*/

    /**
     * Allows you to play different sounds
     * For informaton about fallback api please see:
     * http://pupunzi.open-lab.com/2013/03/13/making-html5-audio-actually-work-on-mobile/
     */
   .factory('audioFactory', function ($log) {
       var useFallback = false;
       // Variables for Audio Context Stuff
       var analyser;

       var bleepSource;
       var bleepSound;
       var bleepRunning = false;

       var timeOverSource;
       var timeOverSound;
       var timeOverRunning = false;

       var buzzerSource;
       var buzzerSound;
       var buzzerRunning = false;

       var gongSource;
       var gongSound;
       var gongRunning = false;

       var audioContext;
       // Variables for Audio Context Stuff - END
       init();

       return {
           init: init,
           buzz: function () {
               if (!useFallback) {
                   if (buzzerRunning)
                       return;

                   buzzerSource = audioContext.createBufferSource();
                   buzzerSource.onended = function () {
                       buzzerRunning = false;
                   };
                   buzzerSource.buffer = buzzerSound;
                   buzzerSource.connect(audioContext.destination);
                   buzzerRunning = true;
                   buzzerSource.start(0);
               } else {
                   $.mbAudio.unMuteAllSounds();
                   $.mbAudio.setVolume('buzzer',10);
                   $.mbAudio.play('buzzer');
               }
           },
           gong: function () {
               if (!useFallback) {
                   if (gongRunning)
                       return;

                   gongSource = audioContext.createBufferSource();
                   gongSource.onended = function () {
                       gongRunning = false;
                   };
                   gongSource.buffer = gongSound;
                   gongSource.connect(audioContext.destination);
                   gongRunning = true;
                   gongSource.start(0);
               } else {
                   $.mbAudio.unMuteAllSounds();
                   $.mbAudio.setVolume('gong',10);
                   $.mbAudio.play('gong');
               }
           },
           stopGong: function () {
               if (!useFallback) {
                   if (!gongSource)
                       return;

                   gongSource.stop();
                   gongRunning = false;
               } else {
                   $.mbAudio.pause('gong');
               }
           },
           bleep: function () {
               if (!useFallback) {
                   if (bleepRunning)
                       return;

                   bleepSource = audioContext.createBufferSource();
                   bleepSource.onended = function () {
                       bleepRunning = false;
                   };
                   bleepSource.buffer = bleepSound;
                   bleepSource.connect(audioContext.destination);
                   bleepRunning = true;
                   bleepSource.start(0);
               } else {
                   $.mbAudio.unMuteAllSounds();
                   $.mbAudio.setVolume('bleep',10);
                   $.mbAudio.play('bleep');
               }
           },
           timeOver: function () {
               if (!useFallback) {
                   if (timeOverRunning)
                       return;

                   timeOverSource = audioContext.createBufferSource();
                   timeOverSource.onended = function () {
                       timeOverRunning = false;
                   };
                   timeOverSource.buffer = timeOverSound;
                   timeOverSource.connect(audioContext.destination);
                   timeOverRunning = true;
                   timeOverSource.start(0);
               } else {
                   $.mbAudio.unMuteAllSounds();
                   $.mbAudio.setVolume('timeOver',10);
                   $.mbAudio.play('timeOver');
               }
           },
           stopbleep: function () {
               if (!useFallback) {
                   if (!bleepSource)
                       return;

                   bleepSource.stop();
                   bleepRunning = false;
               } else {
                   $.mbAudio.pause('bleep');
               }
           },
           stoptimeOver: function () {
               if (!useFallback) {
                   if (!timeOverSource)
                       return;

                   timeOverSource.stop();
                   timeOverRunning = false;
               } else {
                   $.mbAudio.pause('timeOver');
               }
           },
           soundlessbuzz: function(){
               if (!useFallback) {
                   var source = audioContext.createOscillator();
                   source.type = 0; // sine wave
                   source.frequency.value = 1200;
                   source.connect(analyser);
                   source.connect(audioContext.destination);
                   source.start(0);
                   source.stop(0.01);
               } else {
                   $.mbAudio.muteAllSounds();
                   $.mbAudio.play('bleep');
                   $.mbAudio.play('buzzer');
                   $.mbAudio.play('timeOver');
                   $.mbAudio.play('gong');
               }
           },
           soundlessbleep: function(){
               // no function
           },
           soundlessTimeOver: function(){
                // no function
           }
        };

       function init(){
           if (window.AudioContext == undefined &&
               window.webkitAudioContext == undefined &&
               window.mozAudioContext == undefined &&
               window.oAudioContext == undefined &&
               window.msAudioContext == undefined){
               //fallback init
               $.mbAudio.sounds = {
                   bleep: {
                       id    : "bleep",
                       mp3   : "audio/bleep.wav"
                   },
                   timeOver: {
                       id    : "timeOver",
                       mp3   : "audio/timeOver.wav"
                   },
                   buzzer: {
                       id    : "buzzer",
                       mp3   : "audio/buzzer.wav"
                   },
                   gong: {
                       id    : "gong",
                       mp3   : "audio/gong.wav"
                   }
               };
               useFallback = true;
               $log.info('fallback init done');
               return;
           }

           audioContext = new (window.AudioContext ||
           window.webkitAudioContext ||
           window.mozAudioContext ||
           window.oAudioContext ||
           window.msAudioContext)();

           analyser = audioContext.createAnalyser();

           loadBleep();
           loadTimeOver();
           loadBuzzer();
           loadGong();
       }

       function loadBleep(){
           var request = new XMLHttpRequest();
           request.open('GET', 'audio/bleep.wav', true);
           request.responseType = 'arraybuffer';
           request.send();
           request.addEventListener('load', function(event) {
               audioContext.decodeAudioData(request.response, function onSuccess(decodedBuffer) {
                   bleepSound = decodedBuffer;
               }, function onFailure() {});
           });
       }

       function loadTimeOver(){
           var request = new XMLHttpRequest();
           request.open('GET', 'audio/timeOver.wav', true);
           request.responseType = 'arraybuffer';
           request.send();
           request.addEventListener('load', function(event) {
               audioContext.decodeAudioData(request.response, function onSuccess(decodedBuffer) {
                   timeOverSound = decodedBuffer;
               }, function onFailure() {});
           });
       }

       function loadBuzzer(){
           var request = new XMLHttpRequest();
           request.open('GET', 'audio/buzzer.wav', true);
           request.responseType = 'arraybuffer';
           request.send();
           request.addEventListener('load', function(event) {
               audioContext.decodeAudioData(request.response, function onSuccess(decodedBuffer) {
                   buzzerSound = decodedBuffer;
               }, function onFailure() {});
           });
       }

       function loadGong(){
           var request = new XMLHttpRequest();
           request.open('GET', 'audio/gong.wav', true);
           request.responseType = 'arraybuffer';
           request.send();
           request.addEventListener('load', function(event) {
               audioContext.decodeAudioData(request.response, function onSuccess(decodedBuffer) {
                   gongSound = decodedBuffer;
               }, function onFailure() {});
           });
       }

   })

    /**
     * Setups the socketio connection
     * Defines the interface of the socketio socket to directives, services
     * Registers directive independent listeners on the socket
     */
    .factory('SocketFactory', function ($rootScope) {
        var Socket = io.connect(location.origin, { path: location.pathname.replace(/\/[^\/]*$/,'') + '/socket.io' });
        Socket.on('PING', onPing);

        return {
            on: socketOn,
            emit: socketEmit
        };

        function socketOn(eventName, callback) {
            Socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(Socket, args);
                });
            });
        }

        function socketEmit(eventName, data, callback) {
            Socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(Socket, args);
                    }
                });
            })
        }

        function onPing(data) {
            Socket.emit('PONG', {messageId: data.messageId});
        }

    })


    /**
     * Sets the title of the current page.
     */
    .factory('PageTitleFactory', function ($document) {
        $document[0].title = "Login!";
        return {
            setTitle: function (newTitle) {
                $document[0].title = newTitle;
            }
        };
    })


    .factory('storageFactory', function ($document) {

        if (!checkStorage()) {
            alert('Local storage is not available in your Browser!');
        }
        return {
            getItem: function () {
                if (checkStorage()){
                    return localStorage.getItem.apply(localStorage, arguments);
                }
                return undefined;
            },
            setItem: function () {
                if (checkStorage()) {
                    return localStorage.setItem.apply(localStorage, arguments);
                }
                return undefined;
            },
            removeItem: function () {
                if (checkStorage()) {
                    return localStorage.removeItem.apply(localStorage, arguments);
                }
                return undefined;
            }

        };


        function checkStorage(){
            if (!Storage) {
                return false;
            }
            else {
                try {
                    var test = localStorage.getItem('someItem');
                    return true;
                } catch (err) {
                    return false;
                }
            }
            return true;
        }
    });
