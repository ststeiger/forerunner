/**
 *
 * Sky jQuery Touch Carousel
 * URL: http://www.skyplugins.com
 * Version: 1.0.2
 * Author: Sky Plugins
 * Author URL: http://www.skyplugins.com
 *
 */

/**
 * Loads the given image and fires an event upon load.
 * @param {HTMLImageElement} img The image to be loaded.
 */
SKY.ImageLoader = function(img) {

    this.subscribers = [];
    this.img = img;
	this.fired = false;

};

SKY.ImageLoader.prototype = {

    /**
     * Subscribes to be notified when the image is loaded.
	 * @param {Function} The callback function.
     */
    subscribe: function(fn) {

        this.subscribers.push(fn);

    },

    /**
     * Unsubscribes from the subscribers list.
	 * @param {Function} The callback function.
     */
    unsubscribe: function(fn) {

        for (var i = 0; i < this.subscribers.length; i++) {
            if (this.subscribers[i] === fn) {
                delete(this.subscribers[i]);
            }
        }

    },

    /**
     * Publishes the event by calling the subscribers.
     */
    publish: function() {
		
		// If the event is already fired return
		if (this.fired) {
			return;			
		} else {
			this.fired = true;
		}

        for (var i = 0; i < this.subscribers.length; i++) {
            if (typeof this.subscribers[i] === 'function') {
                this.subscribers[i]();
            }
        }		

    },

    /**
     * Starts loading the given image.
     */
    load: function() {

        var self = this;

        // Add an event listener to be notified when the loading process is complete.
        if (this.img.addEventListener) {
            this.img.addEventListener('load', function(evt) {
                self.onLoad(evt);
            }, false);
        } else if (this.img.attachEvent) {
            this.img.attachEvent('onload', function(evt) {
                self.onLoad(evt);
            });
        }
        
        // If it's already completed, reset the src. This will force the load event to be fired.
		if (this.img.complete || this.img.complete === undefined || this.img.readyState === "loading") {
			var src = this.img.src;
			this.img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
			this.img.src = src;
		}

    },

    /**
     * This is called when the loading process is complete.
     */
    onLoad: function(evt) {

        // IE sometimes fires for the 1x1 image that is used for the src, avoid this.
        if (this.img.height > 1) {
            this.publish();
        }

    }

};
