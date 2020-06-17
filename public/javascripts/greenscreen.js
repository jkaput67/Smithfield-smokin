const player = document.getElementById('streamingplayer');
        const constraints = {
            video: true,
        };
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
            player.srcObject = stream;
            });
            greenScreenEngine = {
                __this : this,
                _canvasProcessorContext : null,
                _canvasTargetContext : null,
                _height : 0,
                _width : 0,
                _video : null,
                handlerFor : {
                  pause : function() {
                    alert('pause')
                    clearTimeout( this._animator );
                  },
                  play : function() {
                    greenScreenEngine.parseAndProcessFrame();
                  }
                },
                parseAndProcessFrame : function() {
                  if (this._video.paused || this._video.ended) {
                    return;
                  }
                  this._canvasProcessorContext.drawImage(this._video,0,0,this._width,this._height)
                  var videoFrame     = this._canvasProcessorContext.getImageData(0,0,this._width,this._height),
                      numberOfPixels = videoFrame.data.length / 4;
                  for (var i=0;i<numberOfPixels;i++) {
                    var r = videoFrame.data[i * 4 + 0],
                        g = videoFrame.data[i * 4 + 1],
                        b = videoFrame.data[i * 4 + 2],
                        a = videoFrame.data[i * 4 + 3];
                    if (r < 83 && g > 100 && b < 100) {      // Here we look for what we perceive to be a green pixel
                      videoFrame.data[i * 4 + 3] = 0;        // If we find one, make its alpha channel transparent
                    }
                  }
                  this._canvasTargetContext.putImageData(videoFrame,0,0);
                  setTimeout( function() { greenScreenEngine.parseAndProcessFrame() },0);
                },
                setCanvasProcessor : function( canvasProcessorID, scale ) {
                  scale = (scale!==undefined) ? scale : 1;
                  this._height = this._video.videoHeight * scale;
                  this._width  = this._video.videoWidth * scale;
                  var oCanvas = document.getElementById(canvasProcessorID);
                  oCanvas.height = this._height;
                  oCanvas.width  = this._width;
                  this._canvasProcessorContext = oCanvas.getContext("2d");
                  this._canvasProcessorContext.drawImage(this._video,0,0,this._width,this._height)
                },
                setCanvasTarget : function( canvasTargetID ) {
                  var oCanvas = document.getElementById(canvasTargetID);
                  oCanvas.height = this._height;
                  oCanvas.width  = this._width;
                  this._canvasTargetContext =  oCanvas.getContext("2d");
                },
                setSourceVideo : function( videoID ) {
                  this._video = document.getElementById( videoID );
                  this._video.addEventListener("play", greenScreenEngine.handlerFor.play)
                  this._video.addEventListener("pause", greenScreenEngine.handlerFor.pause)
                }
              }
              function setup() {
                greenScreenEngine.setSourceVideo("video-green-screen");
                greenScreenEngine.setCanvasProcessor("canvas-processor",.5);
                greenScreenEngine.setCanvasTarget("canvas-target");
                greenScreenEngine._video.play();
              }