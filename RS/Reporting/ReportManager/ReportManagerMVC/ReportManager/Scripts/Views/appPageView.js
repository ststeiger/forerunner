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
            
      // Append or transition to a mainSection
      onChangeMainSection: function() {
        // Append or transition the main section into the page
        var el = this.model.attributes.mainSection.el;
        $(this.el).find("#mainSection").html(el);
      },
      
      transitionHeader: function (headerSecionType) {
          var headerSection = new headerSecionType().render();
          $('#mainSectionHeader').html(headerSection.el);
          return headerSection;
      },

      transitionMainSection: function(appPageModel, mainSectionType, options) {
        // First load the subordinate view templates, everything else will happen in the callback
          var me = this;
          $('#bottomdiv').html(null);
          appPageModel.attributes.mainSection = new mainSectionType(options).render();
          me.model.set(appPageModel);

          if (appPageModel.attributes.mainSection != null && appPageModel.attributes.mainSection.postRender != null) {
              appPageModel.attributes.mainSection.postRender();
          }
      },

      eventsBound: false,

      bindEvents: function () {
        var me = this;
        if (!me.eventsBound) {
            me.eventsBound = true;
            $('#mainSectionHeader').on('toolbarmenuclick', function (e, data) { me.toggleLeftPane(); });
            $('#leftPane').on('toolpaneactionstarted', function (e, data) { me.toggleLeftPane(); });
        }
      },

      toggleLeftPane: function () {
          var mainViewPort = $('#mainViewPort');
          var leftPane = $('#leftPane');
          var topdiv = $('#topdiv');
          if (!mainViewPort.hasClass('mainViewPortShifted')) {
              leftPane.css({ height: Math.max($(window).height(), mainViewPort.height()) });
              leftPane.show();
              mainViewPort.addClass('mainViewPortShifted');
              topdiv.addClass('mainViewPortShifted');
          } else {
              mainViewPort.removeClass('mainViewPortShifted');
              topdiv.removeClass('mainViewPortShifted');
              leftPane.hide();
          }
      },
  });
  
}());

