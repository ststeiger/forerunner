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
 * A Timer utility which can be used to be notified when a timer event is occured.
 */
SKY.Timer = function(delay, repeatCount) {
	
	this.delay = delay || 2000;
	this.repeatCount = repeatCount || 0;
	this.currentCount = 0;
	this.intervalID = null;
	this.running = false;
	this.subscribers = [];
	
};

SKY.Timer.prototype = {
	
	/**
     * Subscribes to be notified when a new TimerEvent is occured.
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
	 * @param {String} The type of the event. (timer | timercomplete)
     */
    publish: function(type) {
		
        for (var i = 0; i < this.subscribers.length; i++) {
            if (typeof this.subscribers[i] === 'function') {
                this.subscribers[i](type);
            }
        }		

    },
	
	/**
	 * Resets the timer counter.
	 */
	reset: function() {
		
		this.currentCount = 0;
		
	},
	
	/**
	 * Starts the timer.
	 */
	start: function() {
		
		var self = this;
		
		if (!this.running) {
			this.intervalID = setInterval(function() {
				self.tick();
			}, this.delay);
			
			this.running = true;
		}
		
	},
	
	/**
	 * Stops the timer.
	 */
	stop: function() {
		
		if (this.running) {
			clearInterval(this.intervalID);
			this.running = false;
		}
		
	},
	
	/**
	 * This method is called when a timer event is occured.
	 */
	tick: function() {
		
		++this.currentCount;
		
		// Publish the timer event
		this.publish('timer');
		
		if (this.currentCount == this.repeatCount) {
			this.reset();
			this.stop();
			
			// Publish the timer complete event
			this.publish('timercomplete');
		}
		
	}
	
};