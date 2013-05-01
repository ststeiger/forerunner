// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {

  //Models
  g_App.AppPageModel = Backbone.Model.extend({
    initialize: function(attributes) {
    },

    defaults: function() {
      return {
        'pageTitle': '',
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
          "click #backButton": "onClickBackButton",
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

        // BUGBUG:  Need to find out why this is not showing up in the UI
        $(this.el).find("#pageTitle").text(this.model.attributes.pageTitle);

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
        $(this.el).find("#mainSection").html(el);
        //  BUGBUG::  This messing up the sizing
        /*  
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
        }*/
      },
      
      onChangeFooterTitle: function() {
        $(this.el).find("#footerTitle").text(this.model.attributes.footerTitle);
      },
      
      
      transitionMainSection: function(appPageModel, views, subfolder, mainSectionType, options) {
        // First load the subordinate view templates, everything else will happen in the callback
          var thisObj = this;
          $('#bottomdiv').html(null);
        //g_App.utils.loadTemplate(views, subfolder, function() {
          appPageModel.attributes.mainSection = new mainSectionType(options).render();
          thisObj.model.set(appPageModel);
        //});
          $('#HeaderArea').html(null);
          if (appPageModel.attributes.mainSection != null && appPageModel.attributes.mainSection.sectionHeader != null) {
              $('#mainSectionHeader').html(appPageModel.attributes.mainSection.sectionHeader());
          } else {
              $('#mainSectionHeader').html(null);
          }
      }
  });
  
}());

