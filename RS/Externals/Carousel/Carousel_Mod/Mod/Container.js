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
 * The Container class.
 */
SKY.Container = function(element, carousel) {

	this.element = element;
	this.carousel = carousel;
	this.x = 0;

};

SKY.Container.prototype = {
	
	/**
	 * Sets the x position of the container.
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} duration Indicates the duration that the animation will take.
	 */
	setX: function(x, duration) {
		
		this.x = x;
		this.update(duration);
		
	},
	
	/**
	 * Returns the left position of the container.
	 * @return {Number} The left position of the container.
	 */
	getLeft: function() {
		
		return this.element.position().left;
		
	},
	
	/**
	 * Sets the top margin of the container.
	 * @param {Number} margin The top margin.
	 */
	setTopMargin: function(margin) {
		
		var s = this.carousel.settings,
			itemHeight = s.itemHeight;
		
		// Find the margin diff at the top of the item
		if (margin == 'auto') {
			margin = (this.carousel.dom.carousel.height() - itemHeight * s.selectedItemZoomFactor) / 2;		
		}
		
		// Add the calculated margin to the 0
		margin = -itemHeight * (1 - s.selectedItemZoomFactor) / 2 + margin;
		this.element.css('margin-top', margin + 'px');
		
	},
	
	/**
	 * Updates the position of the container with animation.
	 * @param {Number} duration Indicates the duration that the animation will take.
	 */
	update: function(duration) {
		
		var self = this;
				
		// If the duration is set animate properties, otherwise set them directly
		if (duration) {
			// Let the carousel know the selection animation has started
			this.carousel.onSelectionAnimationStart();
			
			// Listen for the transitionEnd event
			this.element.on('webkitTransitionEnd transitionend oTransitionEnd otransitionend MSTransitionEnd', function(evt) {
				self.element.off('webkitTransitionEnd transitionend oTransitionEnd otransitionend MSTransitionEnd');
				
				// Let the carousel know the selection animation has ended
				self.carousel.onSelectionAnimationEnd();
			});
			
			if (SKY.Utils.hasTransitionSupport()) {
				this.element.css(SKY.Utils.getPrefixedProperty('transition'), 'left ' + duration + 's ease-out');
				this.element.css('left', this.x);
			} else {
				this.element.stop().animate({ left: this.x }, duration * 1000, function() {
					// Let the carousel know the selection animation has ended
					self.carousel.onSelectionAnimationEnd();
				});
			}						
		} else {
			// Remove the previous transition if there is any
			if (SKY.Utils.hasTransitionSupport()) {
				this.element.css(SKY.Utils.getPrefixedProperty('transition'), '');
			}
			
			this.element.stop().css({ left: this.x });
		}
		
	}
	
};