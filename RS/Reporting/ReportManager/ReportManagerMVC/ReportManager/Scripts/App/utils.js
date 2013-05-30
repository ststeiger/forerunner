// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {

  g_App.utils = {
    // Asynchronously load templates located in separate .html files
    loadTemplate : function(views, subfolder, callback) {

      var deferreds = [];

      $.each(views, function(index, view) {
        if (g_App[view]) {
          var subPath = subfolder.length > 0 ? subfolder + '/' : '';
          var templateURL = 'Scripts/views/' + subPath + view + '.html';
          deferreds.push($.get(templateURL, function(data) {
            g_App[view].prototype.template = _.template(data);
          }));
        } else {
          alert(view + " not found");
        }
      });

      $.when.apply(null, deferreds).done(callback);
    },

    uploadFile : function(file, callbackSuccess) {
      var self = this;
      var data = new FormData();
      data.append('file', file);
      $.ajax({
        url : 'api/upload.php',
        type : 'POST',
        data : data,
        processData : false,
        cache : false,
        contentType : false
      }).done(function() {
        console.log(file.name + " uploaded successfully");
        callbackSuccess();
      }).fail(
          function() {
            self.showAlert('Error!', 'An error occurred while uploading '
                + file.name, 'alert-error');
          });
    },

    displayValidationErrors : function(messages) {
      for ( var key in messages) {
        if (messages.hasOwnProperty(key)) {
          this.addValidationError(key, messages[key]);
        }
      }
      this.showAlert('Warning!', 'Fix validation errors and try again',
          'alert-warning');
    },

    addValidationError : function(field, message) {
      var controlGroup = $('#' + field).parent().parent();
      controlGroup.addClass('error');
      $('.help-inline', controlGroup).html(message);
    },

    removeValidationError : function(field) {
      var controlGroup = $('#' + field).parent().parent();
      controlGroup.removeClass('error');
      $('.help-inline', controlGroup).html('');
    },

    showAlert : function(title, text, klass) {
      $('.alert').removeClass(
          "alert-error alert-warning alert-success alert-info");
      $('.alert').addClass(klass);
      $('.alert').html('<strong>' + title + '</strong> ' + text);
      $('.alert').show();
    },

    hideAlert : function() {
      $('.alert').hide();
    },

    allowZoom : function(flag) {
        if (flag == true) {
            $('head meta[name=viewport]').remove();
            $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=10.0, minimum-scale=0, user-scalable=1" />');
        } else {
            $('head meta[name=viewport]').remove();
            $('head').prepend('<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=0" />');
        }
    }
  };

}());
