// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {

  g_App.configs = {
    apiBase: 'http://localhost:9000/api/',
    reportControllerBase: '/api/ReportViewer',
    reportServerUrl: 'localhost/ReportServer_WinAuth/',
    reportServerViewer: 'http://localhost/ReportServer_WINAUTH/Pages/ReportViewer.aspx?',
  };

}());
