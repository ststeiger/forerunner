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
 * A utility class which has general purpose useful functions.
 */
SKY.Utils = {
	
	touchSupport: null,
	canvasSupport: null,
	transformation2dSupport: null,
	transformation3dSupport: null,
	transitionSupport: null,
	prefixedProps: [],
	
	/**
	 * Returns true if the browser has touch support.
	 */
	hasTouchSupport: function() {
		
		if (this.touchSupport === null) {
			this.touchSupport = Modernizr.touch;
		}
		
		return this.touchSupport;
		
	},
	
	/**
	 * Returns true if the browser has canvas support.
	 */
	hasCanvasSupport: function() {
		
		if (this.canvasSupport === null) {
			this.canvasSupport = Modernizr.canvas;
		}
		
		return this.canvasSupport;
		
	},
	
	/**
	 * Returns true if the browser has css 2d transformation support.
	 */
	has2dTransformationSupport: function() {
		
		if (this.transformation2dSupport === null) {
			this.transformation2dSupport = Modernizr.csstransforms;
		}
		
		return this.transformation2dSupport;
		
	},
	
	/**
	 * Returns true if the browser has css 3d transformation support.
	 */
	has3dTransformationSupport: function() {
		
		if (this.transformation3dSupport === null) {
			this.transformation3dSupport = Modernizr.csstransforms3d;
		}
		
		return this.transformation3dSupport;
		
	},
	
	/**
	 * Returns true if the browser has css transition support.
	 */
	hasTransitionSupport: function() {
		
		if (this.transitionSupport === null) {
			this.transitionSupport = Modernizr.csstransitions;
		}
		
		return this.transitionSupport;
		
	},
	
	/**
	 * Returns the prefixed version of the given css property.
	 * 
	 * @param {String} The css property without prefix. Ex: transformOrigin
	 * @return {String} The prefixed property. Ex: WebkitTransformOrigin
	 */
	getPrefixedProperty: function(prop) {
		
		if (this.prefixedProps[prop] === undefined) {
			this.prefixedProps[prop] = Modernizr.prefixed(prop);
		}
		
		return this.prefixedProps[prop];
		
	},
	
	/**
	 * Sets the mouse cursor.
	 * @param {String} The cursor to be set. (openhand | closedhand | ...)
	 */
	setCursor: function(cursor) {

		switch (cursor) {
			case 'openhand':
				$('body').css('cursor', "url(images/sc-graphics/openhand.cur), auto");
				break;
			case 'closedhand':
				$('body').css('cursor', "url(images/sc-graphics/closedhand.cur), auto");
				break;
			default:
				$('body').css('cursor', cursor);
				break;
		}

	},
	
	/**
	 * Converts the given hex color value to RGB object.
	 * 
	 * @param {String} The hexadecimal color code.
	 * @return {Object} An object that holds r, g and b values.
	 */
	hexToRGB: function(hex) {

		if (hex[0] === '#') {
			hex = hex.substr(1);
		}

		if (hex.length == 3) {          
			var result = /^([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex).slice(1);
			hex = "";

			for (var i = 0; i < 3; i++) {
				hex += result[i] + result[i];
			}
		}

		result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex).slice(1);

		return {
			r: parseInt(result[0], 16),
			g: parseInt(result[1], 16),
			b: parseInt(result[2], 16)
		};      

	}
	
};

// Returns an animation frame according to the type of the browser.
window.requestAnimFrame = (function() {
	return	window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame	||
		window.mozRequestAnimationFrame		||
		window.oRequestAnimationFrame		||
		window.msRequestAnimationFrame		||
		function(callback) {
			window.setTimeout(callback, 1000 / 60);
		};
})();