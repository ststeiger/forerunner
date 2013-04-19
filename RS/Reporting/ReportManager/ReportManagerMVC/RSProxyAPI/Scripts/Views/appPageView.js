// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {

  //Models
  g_App.AppPageModel = Backbone.Model.extend({
    initialize: function(attributes) {
      // Note that the attributes will automatically be set by Backbone, so there is no need
      // to do it here. Additionally all attributes defined in the this.defaults hash will
      // also be defined.
      //
      // Attributes should always be set and get using the BB Model set and get functions.
      // It may be not be harmful to get an attribute directly from the Model.attributes hash
      // but you should always set attributes with the set method. If you don't, the BB Event
      // mechanism will not work, so beware.
    },

    defaults: function() {
      return {
        'footerTitle': '',
      };
    }
  });

  // Views
  g_App.AppPageView = Backbone.View.extend({
      initialize: function(options) {
        this.model = options.model;
        _(this).bindAll('render');
      },
      
      events: {
        "click #backButton" : "onClickBackButton",
      },

      onClickBackButton: function() {
        history.back();
      },


      customEvents: function() {
        return {
        'change:mainSection': this.onChangeMainSection,
        'change:footerTitle': this.onChangeFooterTitle,
        };
      },
      
      render: function() {
        var customEvents = this.customEvents(); 
        for (var key in customEvents) {
          this.model.unbind(key, customEvents[key], this);
          this.model.bind(key, customEvents[key], this);
        }
        
        var data = this.model.toJSON();
        $(this.el).html(this.template(data));

        if (this.model.showBackButton) {
          $(this.el).find("#backButton").show();
        }
        else {
          $(this.el).find("#backButton").hide();
        }
        
        return this;
      },
      
      onChangePageTitle: function() {
        $(this.el).find("#pageTitle").text(this.model.attributes.pageTitle);
      },
      
      onChangePageSubtitle: function() {
        $(this.el).find("#pageSubtitle").text(this.model.attributes.pageSubtitle);
      },
      
      onChangeShowBackButton: function() {
        if (this.model.attributes.showBackButton) {
          $(this.el).find("#backButton").show();
        }
        else {
          $(this.el).find("#backButton").hide();
        }
      },
      
      // Append or transition to a mainSection
      onChangeMainSection: function() {
        // Append or transition the main section into the page
        var el = this.model.attributes.mainSection.el;
        if ($(this.el).find("#mainSection>div").length == 0) {
          $(this.el).find("#mainSection").append(el);
        }
        else {
          var mainSection = $(this.el).find("#mainSection>div");
          mainSection.slideUp("slow", function () {
            $(el).hide();
            mainSection.replaceWith(el);
            $(el).fadeIn("slow");
          })
        }
      },
      
      onChangeFooterTitle: function() {
        $(this.el).find("#footerTitle").text(this.model.attributes.footerTitle);
      },
      
      
      transitionMainSection: function(appPageModel, views, subfolder, mainSectionType, options) {
        // First load the subordinate view templates, everything else will happen in the callback
        var thisObj = this;
        //g_App.utils.loadTemplate(views, subfolder, function() {
          appPageModel.attributes.mainSection = new mainSectionType(options).render();
          thisObj.model.set(appPageModel);
        //});
      }
  });
  
}());

