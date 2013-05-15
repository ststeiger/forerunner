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
 * The CarouselItem class.
 */
SKY.CarouselItem = function(element, carousel) {
	
	// Class properties
	this.element = element;
	this.carousel = carousel;
	this.actualWidth = carousel.settings.itemWidth;
	this.actualHeight = carousel.settings.itemHeight;
	this.x = 0;
	this.y = 0;
	this.scaledX = 0;
	this.scaledY = 0;
	this.scale = 1;
	this.alpha = 1;	
	this.width = this.actualWidth;
	this.height = this.actualHeight;
	this.baseOffset = 0;
	this.zIndex = 0;
	this.distance = -1;
	this.extraItemSize = 0;
	this.extraImageSize = 0;	
	this.url = element.children('a');
	this.imageElement = element.find('img');
	this.image = this.imageElement.get(0);
	this.content = element.children('.sc-content');
	this.subscribers = { load: [] };
	this.loaded = false;
	this.reflection = null;
	
	// Initialize the item
	this.init();
	
};

SKY.CarouselItem.prototype = {
	
	/**
	 * Initializes the carousel item.
	 */
	init: function() {
				
		// IE7/IE8 don't scale paddings and borders, their values should be subtracted during update
		// Calculate the extra size for IE7/IE8 (Padding + border value)
		if ($.support.leadingWhitespace == false) {
			var imgPaddingSize = parseInt(this.imageElement.css('padding-left')) * 2,
				imgBorderSize = parseInt(this.imageElement.css('border-left-width')) * 2,
				itemPaddingSize = parseInt(this.element.css('padding-left')) * 2,
				itemBorderSize = parseInt(this.element.css('border-left-width')) * 2;
			this.extraImageSize = imgPaddingSize + imgBorderSize;
			this.extraItemSize = itemPaddingSize + itemBorderSize;
		}
		
		this.updateBaseOffset();
		
	},
	
	/**
	 * Starts loading the carousel item.
	 */
	load: function() {
		
		var self = this;
		
		if (!this.loaded) {
			var imageLoader = new SKY.ImageLoader(this.image);
			imageLoader.subscribe(function() {
				self.onImageLoaded();
			});

			// Start loading the image
			imageLoader.load();
		}
		
	},
	
	/**
     * Subscribes to be notified when the given event type is occured.
     */
	subscribe: function(type, fn) {
		
		this.subscribers[type].push(fn);
		
	},
	
	/**
     * Unsubscribes from the subscribers list.
     */
	unsubscribe: function(type, fn) {

		for (var i = 0; i < this.subscribers[type].length; i++) {
			if (this.subscribers[type][i] === fn) {
				delete(this.subscribers[type][i]);
			}
		}

	},
	
	/**
     * Publishes the event by calling the subscribers.
     */
	publish: function(type, args) {

		for (var i = 0; i < this.subscribers[type].length; i++) {
			if (typeof this.subscribers[type][i] === 'function') {
				this.subscribers[type][i](args);
			}
		}

	},
	
	/**
     * Returns the index of the item.
     */
    index: function() {

        return this.element.index();

    },
	
	/**
	 * This method is called when the image that the carousel item holds is loaded.
	 */
	onImageLoaded: function() {
		
		var self = this,
			s = this.carousel.settings;
		
		// Add a reflection if requested
		if (this.carousel.settings.reflectionVisible) {
			this.reflection = SKY.CarouselItem.createReflection(
				self.imageElement,
				s.reflectionSize,
				s.reflectionAlpha
			);
				
			this.reflection.css({
				'float': 'left',
				'clear': 'both',
				'margin-top': s.reflectionDistance + 'px'
			});
			
			this.element.append(this.reflection);
			this.update();
		}
		
		this.loaded = true;		
		this.publish('load', this);
		
	},
	
	/**
	 * Sets the opacity of the carousel item.
	 * @param {Number} alpha The opacity.
	 */
	setAlpha: function(alpha) {
		
		if (alpha != this.alpha) {
			this.alpha = alpha;
			this.update();
		}
		
	},
	
	/**
	 * Sets the x position of the carousel item.
	 * @param {Number} x The x coordinate.
	 */
	setX: function(x) {
		
		if (x != this.x) {
			this.scaledX += (x - this.x);
			this.x = x;
			this.update();
		}
		
	},
	
	/**
	 * Sets the y position of the carousel item.
	 * @param {Number} y The y coordinate.
	 */
	setY: function(y) {
		
		if (y != this.y) {
			this.scaledY += (y - this.y);
			this.y = y;
			this.update();
		}
		
	},
	
	/**
	 * Sets the x and y positions of the carousel item.
	 * 
	 * @param {Number} x The x coordinate.
	 * @param {Number} y The y coordinate.
	 */
	setXY: function(x, y) {
		
		if (x != this.x && y != this.y) {
			this.scaledX += (x - this.x);
			this.scaledY += (y - this.y);
			this.x = x;
			this.y = y;
			this.update();
		}
		
	},
	
	/**
	 * Sets the scale of the carousel item.
	 * @param {Number} scale The scale.
	 */
	setScale: function(scale) {
		
		if (scale != this.scale) {
			this.scale = scale;
			this.update();
		}
		
	},
	
	/**
	 * Sets the distance between centerX and the item.
	 * @param {Number} distance The distance between centerX and the item.
	 */
	setDistance: function(distance) {
		
		this.distance = distance;
		
	},
	
	/**
	 * Sets the css z-index of the related dom element.
	 * @param {Number} index The z-index
	 */
	setZIndex: function(index) {
		
		if (index != this.zIndex) {
			this.zIndex = index;
			this.element.css('z-index', index);
		}
		
	},
	
	/**
	 * Returns the base offset for the item. The base offset is the initial
	 * offset for the item.
	 * 
	 * @return {Number} The base offset.
	 */	
	getBaseOffset: function() {
		
		return this.baseOffset;
		
	},		
	
	/**
	 * Calculates and updates the base offset for the item.
	 */	
	updateBaseOffset: function() {
		
		var s = this.carousel.settings;
		this.baseOffset = this.index() * (s.itemWidth * s.unselectedItemZoomFactor + s.distance);
		
	},
	
	/**
	 * This method is called on each animation frame. It updates the item location by using the
	 * class properties such as x, y, scale.
	 */
	update: function() {
		
		var s = this.carousel.settings;
		
		if (SKY.Utils.has2dTransformationSupport()) {
			var transformStatement = 'translate(' + this.x + 'px, ' + this.y + 'px) scale(' + this.scale + ')';
			
			// Trigger hardware accelaration by adding a z property
			if (SKY.Utils.has3dTransformationSupport()) {
				transformStatement += ' translateZ(0)';
			}
			
			this.element.css(SKY.Utils.getPrefixedProperty('transform'), transformStatement);
			this.element.css('opacity', this.alpha);
		} else {
			var targetWidth = this.actualWidth * this.scale,
				targetHeight = this.actualHeight * this.scale;
				
			// Update properties
			this.scaledX = this.x + (this.actualWidth - targetWidth) / 2;
			this.scaledY = this.y + (this.actualHeight - targetHeight) / 2;
			this.width = targetWidth;
			this.height = targetHeight;
			
			// Target item properties
			var props = {
				left: this.scaledX,
				top: this.scaledY,
				width: this.width - this.extraItemSize,
				height: this.height - this.extraItemSize
			};

			// Target image properties, extraSize holds padding + border value for IE7/IE8
			var imageProps = {
				width: props.width - this.extraImageSize,
				height: props.height - this.extraImageSize
			};
			
			// If there is a reflection apply scale
			if (s.reflectionVisible && !SKY.Utils.hasCanvasSupport()) {
				// Add the opacity property				
				imageProps.opacity = this.alpha;
				
				if (this.reflection) {
					this.reflection.css({
						width: props.width,
						height: props.height,
						filter: SKY.CarouselItem.getAlphaFilterStatement(s.reflectionAlpha, s.reflectionSize, s.itemHeight)
					});
				}
			} else {
				props.opacity = this.alpha;
			}
			
			this.element.css(props);
			this.imageElement.css(imageProps);
		}
		
	},
	
	/**
	 * Launches the url related with this carousel item.
	 */
	launchURL: function() {
		
		if (this.url.length > 0) {
			var target = this.url.attr('target');
			target = target ? target : '_self';			
			window.open(this.url.attr('href'), target);
		}
		
	},
	
	/**
	 * Adds the specified class(es) to the related dom element.
	 * @param {String} className One or more space-separated classes.
	 */
	addClass: function(className) {
		
		this.element.addClass(className);
		
	},
	
	/**
	 * Removes the given classes from the related dom element.
	 * @param {String} className One or more space-separated classes.
	 */
	removeClass: function(className) {
		
		this.element.removeClass(className);
		
	}
	
};


/**
 * Generates a transparent mirrored reflection by using the given image.
 * 
 * @param {Image | HTMLCanvasElement | HTMLVideoElement} image The source object for the reflection.
 * @param {Number} size The height of the reflection.
 * @param {Number} alpha Holds the transparency of the reflection.
 * @return {HTMLCanvasElement | HTMLImageElement} The reflection object as a canvas.
 */
SKY.CarouselItem.createReflection = function(image, size, alpha) {
	
	// Get dimensions
	var imageWidth = image.width(),
		imageHeight = image.height(),
		reflection = null;
	
	if (SKY.Utils.hasCanvasSupport()) {
		reflection = $('<canvas>'),		
			ctx = reflection.get(0).getContext('2d');
		
		// Set the width and height of the reflection
		reflection.attr({width: imageWidth, height: size});
		reflection.addClass('reflection');
		ctx.save();
		ctx.translate(0, imageHeight);
		ctx.scale(1, -1);
		ctx.drawImage(image.get(0), 0, 0, imageWidth, imageHeight);
		ctx.restore();
		ctx.globalCompositeOperation = "destination-out";

		// Paint the alpha gradient mask
		var gradient = ctx.createLinearGradient(0, 0, 0, size);
		gradient.addColorStop(0, "rgba(0, 0, 0, " + (1 - alpha) + ")");
		gradient.addColorStop(1, "rgba(0, 0, 0, 1.0)");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, imageWidth, size);
	} else {
		reflection = $('<img>');
		reflection.attr({src: image.get(0).src});
		reflection.css('filter', SKY.CarouselItem.getAlphaFilterStatement(alpha, size, imageHeight));
	}		
	
	return reflection;
	
};

/**
 * Returns an alpha filter statement for IE.
 * 
 * @param {Number} alpha The opacity.
 * @param {Number} size The vertical position at which the opacity gradient ends.
 * @param {Number} height The height of the image.
 * @return {String} The alpha filter statement.
 */
SKY.CarouselItem.getAlphaFilterStatement = function(alpha, size, height) {
		
		return 'flipv progid:DXImageTransform.Microsoft.Alpha(opacity=' + (alpha * 100) + ', style=1, finishOpacity=0, startx=0, starty=0, finishx=0, finishy=' + (size / height * 100) + ")";
		
};