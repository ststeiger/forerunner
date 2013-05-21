// Assign or create the single globally scoped variable
var g_App = g_App || {};

// Everything inside this function is local unless assigned to a global variable such
// as g_App
(function() {

  g_App.configs = {
    apiBase: './api/',
    reportControllerBase: './api/ReportViewer',
    //reportServerUrl: 'localhost:2008/reportserver_sql2008/',
      //reportServerUrl: 'localhost:8080/reportserver/',
    reportServerUrl: 'localhost:8080/reportserver_mssql2012/',
  };

}());
