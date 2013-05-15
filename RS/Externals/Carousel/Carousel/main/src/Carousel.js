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
 * The carousel class file.
 */
SKY.Carousel = function(element, options) {
	
	// Default settings
	this.settings = {
		itemWidth: 300,
		itemHeight: 450,
		distance: 15,
		startIndex: 'auto',
		enableKeyboard: true,
		enableMouseWheel: true,
		reverseMouseWheel: false,
		autoSlideshow: false,
		autoSlideshowDelay: 2.5,
		loop: true,
		selectedItemDistance: 50,
		selectedItemZoomFactor: 1.0,
		unselectedItemZoomFactor: 0.6,
		unselectedItemAlpha: 0.6,
		motionStartDistance: 150,
		topMargin: 30,
		preload: true,
		showPreloader: true,
		navigationButtonsVisible: true,
		gradientStartPoint: 0.15,
		gradientEndPoint: 1.0,
		gradientOverlayVisible: true,
		gradientOverlayColor: "#fff",
		gradientOverlaySize: 215,
		reflectionVisible: false,
		reflectionDistance: 4,
		reflectionSize: 100,
		reflectionAlpha: 0.38,
		slideSpeed: 0.45,
		selectByClick: false
	};
	
	// Merge options with the default settings
	if (options) {
		$.extend(this.settings, options);
	}
	
	// Other properties
	this.targetLeft = 0;
	this.mouseOver = false;
	this.dragging = false;
	this.selectedItem = null;
	this.closestItem = null;
	this.container = null;
	this.contentContainer = null;
	this.preloader = null;
	this.timer = null;
	this.centerX = null;
	this.centerY = null;
	this.alphaUnit = null;
	this.scaleUnit = null;
	this.extraDistanceUnit = null;
	this.carouselItems = [];
	this.dom = { carousel: element };
	this.events = {};
	
	// Initialize the plugin
	this.init();
	
};

SKY.Carousel.prototype = {
	
	/**
	 * Initializes the carousel.
	 */
	init: function() {
		
		this.initDOM();
		this.initConfigParams();
		this.initEvents();
		this.initContentWrapper();
		this.initContainer();
		this.initGradientOverlays();
		this.initNavigationButtons();
		this.initResizeListener();
		this.initKeyboardNavigation();
		this.initMouseWheelSupport();
		this.initAutoSlideshow();
		this.calculateUnits();
		this.update();
		
		// This is done to avoid flash of unstyled content (FOUC) http://www.bluerobot.com/web/css/fouc.asp/		
		this.dom.carousel.css('visibility', 'visible');
		
	},
	
	/**
	 * Initializes jquery DOM elements.
	 */
	initDOM: function() {
		
		var s = this.settings;
		
		this.dom.document = $(document);
		this.dom.wrapper = this.dom.carousel.children('.sky-carousel-wrapper');
		this.dom.container = this.dom.wrapper.children('.sky-carousel-container');
		this.dom.items = this.dom.container.children('li');
		this.dom.links = this.dom.container.find('li > a');
		this.dom.images = this.dom.container.find('li img');
		this.dom.carousel.addClass('sc-no-select');
		
		// Preload setup
		if (s.preload) {
			// Do not support IE7-IE8
			if ($.support.leadingWhitespace != false) {
				this.dom.wrapper.css({
					visibility: 'hidden',
					opacity: 0
				});			
			
				// Append the preloader if requested
				if (s.showPreloader) {
					this.preloader = $('<div class="sc-preloader"></div>');
					this.dom.carousel.append(this.preloader);
				}
			}
		}

		// For each image disable dragging
		this.dom.images.each(function() {
			$(this).addClass('sc-image');
			this.ondragstart = function() {
				return false;
			};
		});

	},
	
	/**
	 * Initializes and updates some of the configuration parameters.
	 */
	initConfigParams: function() {
		
		var s = this.settings,
			itemPaddingSize = parseInt(this.dom.items.css('padding-left')),
			itemBorderSize = parseInt(this.dom.items.css('border-left-width')),
			imagePaddingSize = parseInt(this.dom.images.css('padding-left')),
			imageBorderSize = parseInt(this.dom.images.css('border-left-width'));
					
		// Update the itemWidth and itemHeight by adding the padding and border values
		s.itemWidth += (itemPaddingSize + itemBorderSize + imagePaddingSize + imageBorderSize) * 2;
		s.itemHeight += (itemPaddingSize + itemBorderSize + imagePaddingSize + imageBorderSize) * 2;
		
		// Set transform origin
		if (SKY.Utils.has2dTransformationSupport()) {
			this.dom.items.css(SKY.Utils.getPrefixedProperty('transformOrigin'), 'center ' + Math.round(s.itemHeight / 2) + 'px');
		}
		
	},
	
	/**
	 * Initializes the mouse and touch events.
	 */
	initEvents: function() {
		
		if (SKY.Utils.hasTouchSupport()) {
			this.events.startEvent = 'touchstart.sc';
			this.events.moveEvent = 'touchmove.sc';
			this.events.endEvent = 'touchend.sc';
			this.events.touchCancel = 'touchcancel.sc';
		} else {
			this.events.startEvent = 'mousedown.sc';
			this.events.moveEvent = 'mousemove.sc';
			this.events.endEvent = 'mouseup.sc';
		}
		
	},
	
	/**
	 * Initializes the carousel container that holds the items.
	 */
	initContainer: function() {
		
		var self = this,
			numLoadedItems = 0;
		
		// Create a new SKY.Container
		this.container = new SKY.Container(this.dom.container, this);
		
		// For each dom element create a new carousel item
		this.dom.items.each(function(index) {
			var carouselItem = new SKY.CarouselItem($(this), self);
			
			// Subscribe for the load event
			carouselItem.subscribe('load', function(item) {
				++numLoadedItems;
				
				if (numLoadedItems == self.dom.items.length) {
					self.onAllLoaded();
				}
			});
			
			// Start loading the carousel item
			carouselItem.load();
			self.carouselItems.push(carouselItem);
		});

		// Add the start listener to the container
		this.dom.carousel.on(this.events.startEvent, function(evt) {			
			self.onStart(evt);
		});
		
		if (!SKY.Utils.hasTouchSupport()) {
			this.dom.carousel.hover(function(evt) {
				self.mouseOver = true;
				self.updateCursor();
			}, function(evt) {
				self.mouseOver = false;
				self.updateCursor();
			});
		}
		
		// Set the selected item (This is necessary due to references inside updateLayout())
		this.selectedItem = this.getStartItem();
		this.selectedItem.addClass('sc-selected');
		this.updatePlugin();
		
	},
	
	/**
	 * Initializes the gradient overlays.
	 */
	initGradientOverlays: function() {
		
		var s = this.settings;
		
		if (s.gradientOverlayVisible) {
			// Create the overlays
			var leftOverlay = this.createGradientOverlay('left', s.gradientStartPoint, s.gradientEndPoint, s.gradientOverlayColor, s.gradientOverlaySize),
			rightOverlay = this.createGradientOverlay('right', s.gradientStartPoint, s.gradientEndPoint, s.gradientOverlayColor, s.gradientOverlaySize);
			
			// Append the overlays
			this.dom.carousel.append(leftOverlay);
			this.dom.carousel.append(rightOverlay);			
		}
		
	},
	
	/**
	 * Initializes the content wrapper that holds the current content.
	 */
	initContentWrapper: function() {		
		
		var contentWrapper = $('<div class="sc-content-wrapper"></div>');		
		this.contentContainer = $('<div class="sc-content-container"></div>');			
		this.contentContainer.append('<div class="sc-content"><h2></h2><p></p></div>')
		contentWrapper.append(this.contentContainer);
		
		// Do not support IE7-IE8
		if ($.support.leadingWhitespace != false) {
			if (this.settings.preload) {
				this.contentContainer.css({
					visibility: 'hidden',
					opacity: 0
				});
			}
		}
		
		this.dom.carousel.append(contentWrapper);
		
	},
	
	/**
	 * Initializes the prev/next navigation buttons.
	 */
	initNavigationButtons: function() {
		
		var self = this;
		
		if (this.settings.navigationButtonsVisible) {
			// Create the buttons
			var prevButton = $('<a href="#" class="sc-nav-button sc-prev sc-no-select"></a>'),
			nextButton = $('<a href="#" class="sc-nav-button sc-next sc-no-select"></a>');
			
			// Append buttons
			this.dom.carousel.append(prevButton);
			this.dom.carousel.append(nextButton);
			
			prevButton.on('click', function(evt) {				
				evt.preventDefault();
				self.selectPrevious(self.settings.slideSpeed);
			});
			
			nextButton.on('click', function(evt) {
				evt.preventDefault();
				self.selectNext(self.settings.slideSpeed);
			});
		}
		
	},	
	
	/**
	 * Initializes the resize listener.
	 */
	initResizeListener: function() {
		
		var self = this;
		
		// On resize update the plugin
		$(window).on('resize', function(evt) {
			self.updatePlugin(evt);
		});
		
	},
	
	/**
	 * Adds the keyboard navigation capability.
	 */
	initKeyboardNavigation: function() {
		
		var self = this
			s = this.settings;
		
		if (s.enableKeyboard) {
			this.dom.document.keydown(function(evt) {
				// Check the source of the event
				if (evt.target.type != 'textarea' && evt.target.type != 'text') {
					switch (evt.keyCode) {
						case 37: // Left arrow
							self.selectPrevious(s.slideSpeed);
							break;
						case 39: // Right arrow
							self.selectNext(s.slideSpeed);
							break;
						default:
							break;
					}
				}
			});
		}
		
	},
	
	/**
	 * Adds the mouse wheel support.
	 */
	initMouseWheelSupport: function() {
                
		var self = this,
			s = this.settings,
			carousel = this.dom.carousel.get(0);

		if (s.enableMouseWheel) {
			var onMouseWheel = function(evt) {
				var delta = 0;
				
				// Prevent the default action
				if(evt.preventDefault){  
					evt.preventDefault();  
				} else {  
					evt.returnValue = false;  
					evt.cancelBubble = true;  
				}

				// Normalize wheel delta to 1/-1
				if (evt.wheelDelta) {
					delta = evt.wheelDelta / 120;
				} else if (evt.detail) {
					delta = -evt.detail / 3;
				}
				
				// Reverse the direction of the mouse wheel
				if (s.reverseMouseWheel) {
					delta *= -1;
				}

				if (delta > 0) {
					self.selectPrevious(s.slideSpeed);
				} else if (delta < 0) {
					self.selectNext(s.slideSpeed);
				}
			};
			
			// Add the mousewheel event (Current version of jQuery (1.9) doesn't support mousewheel event)
			if (carousel.addEventListener) {
				carousel.addEventListener('mousewheel', onMouseWheel, false);
				carousel.addEventListener('DOMMouseScroll', onMouseWheel, false); // For firefox 
			} else if (carousel.attachEvent) {
				carousel.attachEvent('onmousewheel', onMouseWheel);
			}
			
		}

	},
	
	/**
	 * Initializes the automatic slideshow.
	 */
	initAutoSlideshow: function() {
		
		if (this.settings.autoSlideshow) {
			this.startAutoSlideshow();
		}
		
	},
	
	/**
	 * Starts the auto slideshow.
	 */
	startAutoSlideshow: function() {
		
		var self = this,
			s = this.settings;
		
		// If there is not an existing Timer create one
		if (!this.timer) {
			this.timer = new SKY.Timer(s.autoSlideshowDelay * 1000);
			this.timer.subscribe(function(evt) {
				if (self.selectedItem.index() < self.carouselItems.length - 1) {
					self.selectNext(s.slideSpeed);
				} else {
					if (s.loop) {
						self.select(self.carouselItems[0], s.slideSpeed);
					}
				}
			});
		}
		
		this.timer.start();		
		
	},
	
	/**
	 * Stops the auto slideshow.
	 */
	stopAutoSlideshow: function() {
		
		if (this.timer) {
			this.timer.stop();
		}
		
	},
	
	/**
	 * This method is called when the closest item to the center is changed.
	 * @param {CarouselItem} An instance of the CarouselItem.
	 */
	onClosestChanged: function(item) {
		
		this.setCurrentContent(item);
		
		// Fire the closestItemChanged.sc event
		this.dom.carousel.trigger({
			type: 'closestItemChanged.sc',
			item: item
		});
		
	},
	
	/**
	 * Sets the current content by reading the values from the given item.
	 * @param {CarouselItem} An instance of the CarouselItem.
	 */
	setCurrentContent: function(item) {
		
		if (item.content.length > 0) {
			this.contentContainer.find('h2').html(item.content.children('h2').html());
			this.contentContainer.find('p').html(item.content.children('p').html());
		} else {
			this.contentContainer.find('h2').empty();
			this.contentContainer.find('p').empty();
		}
		
	},
	
	/**
	 * Returns the initial carousel item.
	 * @return {CarouselItem} An instance of the CarouselItem.
	 */
	getStartItem: function() {
		
		var index = this.settings.startIndex;
		
		if (index === 'auto') {
			index = Math.round(this.carouselItems.length / 2) - 1;
		}
		
		return this.carouselItems[index];
		
	},
	
	/**
	 * Performs a z-sort on the carousel items. Fires a change event if the 
	 * closest item to the center is changed.
	 * 
	 * @param {array} An array of CarouselItems.
	 */
	zSort: function(list) {
		
		var length = this.carouselItems.length;
		
		// Sort the items in ascending order, closer comes first
		list.sort(function(a, b) {
			return a.distance - b.distance;
		});
		
		// Set the z-indexes starting from total length
		for (var i = 0; i < list.length; i++) {
			var item = list[i];
			item.setZIndex(length);
			--length;
		}
		
		// Set the closest item
		if (list[0]) {
			if (this.closestItem !== list[0]) {
				this.closestItem = list[0];
				this.onClosestChanged(this.closestItem);
			}
		}
		
		// Help garbage collector
		list = null;
		
	},
	
	/**
	 * Selects the given item.
	 * 
	 * @param {Number | CarouselItem} arg The item index or the actual item to be selected.
	 * @param {Number} duration Indicates the duration that the selection animation will take.
	 */
	select: function(arg, duration) {
		
		var s = this.settings;
		
		// Check the type of the argument
		if (typeof(arg) === "number") {
			var item = this.carouselItems[arg];
		} else if (typeof(arg) === "object") {
			item = arg;
		}
		
		// Remove the .sc-selected class from the previous item
		if (this.selectedItem) {
			this.selectedItem.removeClass('sc-selected');
		}
		
		// Add the .sc-selected class to the current item
		item.addClass('sc-selected');
		
		// Set the selected item
		this.selectedItem = item;
		var target = this.selectedItem.getBaseOffset() + s.itemWidth / 2 + s.selectedItemDistance;
		this.container.setX(this.centerX - target, duration);
		
		// Fire the itemSelected.sc event
		this.dom.carousel.trigger({
			type: 'itemSelected.sc',
			item: this.selectedItem
		});
		
	},
	
	/**
	 * Selects the next carousel item in the queue.
	 * @param {Number} duration Indicates the duration that the selection animation will take.
	 */
	selectNext: function(duration) {
		
		var selectedIndex = this.selectedItem.index();
		
		if (selectedIndex == this.carouselItems.length - 1) {
			selectedIndex = -1;
		}
		
		this.select(selectedIndex + 1, duration);		
		
	},	
	
	/**
	 * Selects the previous carousel item in the queue.
	 * @param {Number} duration Indicates the duration that the selection animation will take.
	 */
	selectPrevious: function(duration) {
		
		var selectedIndex = this.selectedItem.index();
		
		if (selectedIndex == 0) {
			selectedIndex = this.carouselItems.length;
		}
		
		this.select(selectedIndex - 1, duration);
		
	},
	
	/**
	 * Calculates the units which will be used on each animation frame.
	 */
	calculateUnits: function() {
	
		var s = this.settings;
		this.alphaUnit = (1 - s.unselectedItemAlpha) / s.motionStartDistance;
		this.scaleUnit = (s.selectedItemZoomFactor - s.unselectedItemZoomFactor) / s.motionStartDistance;
		this.extraDistanceUnit = s.selectedItemDistance / s.motionStartDistance;
		
	},
	
	/**
	 * This method is called on each animation frame.
	 */
	update: function() {
		
		var self = this,
			s = this.settings,
			container = this.container,
			containerLeft = container.getLeft(),
			zSortList = [];
							
		for (var i = 0; i < this.carouselItems.length; i++) {
			var item = this.carouselItems[i],
				distance = (containerLeft + item.x + s.itemWidth / 2) - this.centerX,
				absDistance = Math.abs(distance);
			
			// Calculate the extra distance. If it's not inside motion start distance set it to 0			
			if (absDistance <= s.motionStartDistance) {
				var alpha = this.calculateAlpha(absDistance),
					scale = this.calculateScale(absDistance),
					extraDistance = this.calculateExtraDistance(absDistance);
			} else {
				alpha = s.unselectedItemAlpha;
				scale = s.unselectedItemZoomFactor;
				extraDistance = 0;
			}
			
			if (absDistance <= this.centerX) {
				// Add the items within the motion start distance to the zSortList
				item.setDistance(absDistance);
				zSortList.push(item);
			}
						
			item.setAlpha(alpha);
			item.setScale(scale);
			
			// Determine the location of the item (left|right) and set the extra distance accordingly.
			if (distance > 0) {
				item.setX(item.getBaseOffset() + s.selectedItemDistance * 2 - extraDistance);
			} else {
				item.setX(item.getBaseOffset() + extraDistance);
			}
			
			// Help garbage collector
			distance = absDistance = alpha = scale = extraDistance = null;
		}
		
		// z-sort the items within the motion start distance
		this.zSort(zSortList);
		
		// Update the container's location
		if (this.dragging) {
			container.setX(this.targetLeft);
		}
		
		// Request a new animation frame
		window.requestAnimFrame(function() {
			self.update();
		});
		
	},
	
	/**
	 * Updates the plugin properties.
	 */
	updatePlugin: function() {
		
		var width = this.dom.carousel.width(),
			height = this.dom.carousel.height();
		
		// General property updates
		this.centerX = Math.floor(width / 2);
		this.centerY = Math.floor(height / 2);		
		this.updateLayout();
		
	},
	
	/**
	 * Updates the plugin layout by relocating the carousel items.
	 */
	updateLayout: function() {
	
		var s = this.settings,
			selectedIndex = this.selectedItem.index();
			
		// Set top margin
		this.container.setTopMargin(s.topMargin);
		
		for (var i = 0; i < this.carouselItems.length; i++) {
			var item = this.carouselItems[i],
			extraOffset = 0;
				
			// Update base offset
			item.updateBaseOffset();
			
			// Calculate the extra offset
			if (i == selectedIndex) {
				extraOffset = s.selectedItemDistance;
			} else if (i > selectedIndex) {
				extraOffset = s.selectedItemDistance * 2;
			}
			
			item.setX(item.getBaseOffset() + extraOffset);
			item.setScale(s.unselectedItemZoomFactor);
		}
		
		// Up scale the selected item
		this.selectedItem.setScale(s.selectedItemZoomFactor);
		this.container.setX(this.centerX - this.selectedItem.x - s.itemWidth / 2);

	},
	
	/**
	 * Updates the mouse cursor.
	 */
	updateCursor: function() {
		
		if (this.dragging) {
			SKY.Utils.setCursor('closedhand');
		} else {
			if (this.mouseOver) {
				SKY.Utils.setCursor('openhand');
			} else {
				SKY.Utils.setCursor('auto');
			}
		}

	},
	
	/**
	 * Calculates the alpha value of a carousel item by considering the given distance.
	 * 
	 * @param {Number} absDistance The distance to centerX.
	 * @return {Number} Target alpha value for the given distance.
	 */
	calculateAlpha: function(absDistance) {
		
		return (this.settings.motionStartDistance - absDistance) * 
			this.alphaUnit + 
			this.settings.unselectedItemAlpha;
		
	},
	
	/**
	 * Calculates the scale value of a carousel item by considering the given distance.
	 * 
	 * @param {Number} absDistance The distance to centerX.
	 * @return {Number} Target scale value for the given distance.
	 */
	calculateScale: function(absDistance) {
		
		return (this.settings.motionStartDistance - absDistance) *
			this.scaleUnit +
			this.settings.unselectedItemZoomFactor;
		
	},
	
	/**
	 * Calculates the extra distance value of a carousel item by considering the given distance.
	 * 
	 * @param {Number} absDistance The distance to centerX.
	 * @return {Number} Target extra distance value for the given distance.
	 */
	calculateExtraDistance: function(absDistance) {
		
		return Math.ceil((this.settings.motionStartDistance - absDistance) * 
			this.extraDistanceUnit);
		
	},
	
	/**
	 * This method is called when the mouse clicked or the screen is touched.
	 * 
	 * @param {touchstart | mousedown} evt
	 */
	onStart: function(evt) {
		
		// Return if one of the navigation buttons is clicked
		if (evt.target.nodeName == 'A') {
			return;
		}
		
		var self = this,
			s = this.settings,
			oEvt = evt.originalEvent,
			lastX = startX = SKY.Utils.hasTouchSupport() ? oEvt.targetTouches[0].clientX : evt.clientX,
			startY = SKY.Utils.hasTouchSupport() ? oEvt.targetTouches[0].clientY : evt.clientY,
			length = this.carouselItems.length,
			firstTarget = self.centerX - (s.selectedItemDistance + s.itemWidth / 2),
			lastTarget = firstTarget - ((s.itemWidth * s.unselectedItemZoomFactor + s.distance) * (length - 1)),
			containerLeft = this.container.getLeft(),
			vx = 0,
			scrollingChecked = false,
			completeDefaultAction = false,
			isScrolling = false;		
			
		// Stop auto slideshow
		if (this.timer) {
			this.timer.stop();
		}
		
		// Add the moveEvent and endEvent listeners
		this.dom.document.on(this.events.moveEvent, onMove);
		this.dom.document.on(this.events.endEvent, onEnd);
		
		// Add touchCancel event if necessary
		if (this.events.touchCancel) {
			this.dom.document.on(this.events.touchCancel, onEnd);
		}
		
		// If there are more than 1 touch points, let the browser do the default action.
		if (SKY.Utils.hasTouchSupport()) {
			if (oEvt.touches.length > 1) {
				completeDefaultAction = true;
				return;
			}
		} else {
			evt.preventDefault();
		}
		
		/**
		 * This method is called when the mouse or touch pointer is moved.
		 * 
		 * @param {touchmove | mousemove}
		 */
		function onMove(evt) {
			
			var oEvt = evt.originalEvent,
				pointerX = SKY.Utils.hasTouchSupport() ? oEvt.touches[0].clientX : evt.clientX,
				pointerY = SKY.Utils.hasTouchSupport() ? oEvt.touches[0].clientY : evt.clientY,
				target = (pointerX - startX) / 2 + containerLeft;
				
			// Calculate the velocity
			vx = lastX - pointerX;
			lastX = pointerX;
				
			// If there are more than 1 touch points, let the browser do the default action
			if (SKY.Utils.hasTouchSupport()) {
				if (oEvt.touches.length > 1) {
					completeDefaultAction = true;
					return;
				}

				if (!scrollingChecked) {
					scrollingChecked = true;
					
					if (Math.abs(pointerY - startY) > Math.abs(pointerX - startX) + 5) {
						self.isScrolling = true;
					} else {
						self.isScrolling = false;
					}
				}

				if (self.isScrolling) {
					completeDefaultAction = true;
					return;
				}
			}
			
			evt.preventDefault();
			
			// Avoid dragging out of the bounds
			if (target > firstTarget + 40) {
				target = firstTarget + 40 + (target - firstTarget) * 0.2;
			}
				
			// Avoid dragging out of the bounds
			if (target < lastTarget - 40) {
				target = lastTarget - 40 - (lastTarget - target) * 0.2;
			}
			
			// Update cursor
			if (!self.dragging) {
				self.dragging = true;
				self.updateCursor();
			}
			
			self.targetLeft = target;
			
		};
		
		/**
		 * This method is called when the mouse is up or touch ended.
		 * 
		 * @param {touchend | touchcancel | mouseup}
		 */
		function onEnd(evt) {
			
			var oEvt = evt.originalEvent,
				endX = SKY.Utils.hasTouchSupport() ? oEvt.changedTouches[0].clientX : evt.clientX,
				endY = SKY.Utils.hasTouchSupport() ? oEvt.changedTouches[0].clientY : evt.clientY,
				slideCount = Math.round(vx / 20),
				index = self.closestItem.index();
			
			// Restart auto slideshow
            if (self.timer) {
				self.timer.start();
			}
							
			// Remove event listeners
			self.dom.document.off(self.events.moveEvent, onMove);
			self.dom.document.off(self.events.endEvent, onEnd);
			
			if (self.events.touchCancel) {
				self.dom.document.off(self.events.touchCancel, onEnd);
			}			
			
			// Treat the drag as click if there is no movement
			if (Math.abs(startX - endX) == 0) {
				var element = $(document.elementFromPoint(endX, endY));
				
				if (element.hasClass('sc-image')) {
					// If the parent is a link select its parent
					if (element.parent().is('a')) {
						element = element.parent();
					}
					
					var item = self.carouselItems[element.parent().index()];
					
					// Either launch the url (if any) or select the target item
					if (s.selectByClick && item !== self.selectedItem) {
						self.select(item, s.slideSpeed);
					} else if (s.selectByClick && item === self.selectedItem) {
						self.selectNext(s.slideSpeed);
					}

				} else {
					if (s.selectByClick) {
						self.selectNext(s.slideSpeed);
					}
				}
			} else {
				// Help user to complete his action in case the dragged distance is too small
				if (slideCount == 0 && Math.abs(vx) > 0 && self.closestItem.index() == self.selectedItem.index()) {
					slideCount = vx > 0 ? 1 : vx < 0 ? -1 : 0;
				}

				// Add the slide count to the target index
				index += slideCount;

				// Bound check
				index = index < 0 ? 0 : index > length - 1 ? length - 1 : index;

				// Select the target item
				if (!isScrolling && !completeDefaultAction) {
					self.select(index, s.slideSpeed);
				}
			}
			
			// Update the cursor
			self.dragging = false;
			self.updateCursor();
			
		};
	},
	
	/**
	 * This is called when all of the carousel items are loaded.
	 */
	onAllLoaded: function() {
		
		var self = this,
			s = this.settings;
			
		// Do not support IE7-IE8
		if ($.support.leadingWhitespace != false) {
			var fadeWrapperIn = function() {
				self.dom.wrapper.css('visibility', 'visible');
				self.dom.wrapper.animate({
					opacity: 1.0
				}, 700);
				self.contentContainer.css('visibility', 'visible');
				self.contentContainer.animate({
					opacity: 1.0
				}, 700);
			};

			if (s.preload) {
				if (s.showPreloader) {
					this.preloader.fadeOut(700, fadeWrapperIn);
				} else {
					fadeWrapperIn();
				}
			}
		}
		
	},
	
	/**
	 * Attachs an event handler function.
	 * 
	 * @param {String} events One or more space-seprated event types.
	 * @param {Function} fn A function to execute when the event is triggered.
	 */
	on: function(events, fn) {
		
		this.dom.carousel.on(events, null, null, fn);
		
	},
	
	/**
	 * This method is called when the selection animation has started.
	 */
	onSelectionAnimationStart: function() {
		
		this.dom.carousel.trigger({
			type: 'selectionAnimationStart.sc',
			item: this.selectedItem
		});
		
	},
	
	/**
	 * This method is called when the selection animation has ended.
	 */
	onSelectionAnimationEnd: function() {
		
		this.dom.carousel.trigger({
			type: 'selectionAnimationEnd.sc',
			item: this.selectedItem
		});
		
	},
	
	/**
	 * Creates and returns a new gradient overlay.
	 * 
	 * @param {String} side Indicates the side of the overlay. left | right
	 * @param {Number} startPoint The start point of the gradient.
	 * @param {Number} endPoint The end point of the gradient.
	 * @param {String} color Hexadecimal color code such as #fff0f8
	 * @param {Number} width The width of the gradient overlay.
	 * @return {HTMLCanvasElement} The overlay as a canvas element.
	 */
	createGradientOverlay: function(side, startPoint, endPoint, color, width) {
		
		if (SKY.Utils.hasCanvasSupport()) {
			var overlay = $('<canvas class="sc-overlay" width="' + width + '" height="1"></canvas'),
				ctx = overlay.get(0).getContext('2d'),
				c = SKY.Utils.hexToRGB(color),
				gradient = null;

			// Set css width
			overlay.css('width', width + 'px');
			
			// Add the css overlay class
			overlay.addClass('sc-overlay-' + side);
			
			// Set up the gradient direction
			if (side == 'left') {
				gradient = ctx.createLinearGradient(0, 0, width, 0);
			} else if (side == 'right') {
				gradient = ctx.createLinearGradient(width, 0, 0, 0);
			}
			
			// Apply gradient
			gradient.addColorStop(startPoint, 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', 1.0)');
			gradient.addColorStop(endPoint, 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', 0)');
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, width, 1);
			return overlay;
		}
		
	}
};