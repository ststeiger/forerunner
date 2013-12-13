using System.Web;
using System.Web.Optimization;

namespace ReportManager
{
    public class BundleConfig
    {
        // For more information on Bundling, visit http://go.microsoft.com/fwlink/?LinkId=254725
        public static void RegisterBundles(BundleCollection bundles)
        {
            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            //bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
            //            "~/Scripts/modernizr-*"));

            //bundles.Add(new StyleBundle("~/Content/css").Include("~/Content/site.css"));

            bundles.Add(new StyleBundle("~/Forerunner/Common/css/bundle").Include(
                  "~/Forerunner/Common/css/DefaultAppTemplate.css",
                  "~/Forerunner/Common/css/Forerunner-core.css",
                  "~/Forerunner/Common/css/icons24x24.css",
                  "~/Forerunner/Common/css/icons25x31.css",
                  "~/Forerunner/Common/css/Login.css",
                  "~/Forerunner/Common/css/MessageBox.css",
                  "~/Forerunner/Common/css/ReportManager.css",
                  "~/Forerunner/Common/css/ToolBase.css"));

            bundles.Add(new StyleBundle("~/Forerunner/ReportExplorer/css/bundle").Include(
                "~/Forerunner/ReportExplorer/css/ReportExplorer.css",
                "~/Forerunner/ReportExplorer/css/UserSettings.css"
                ));

            bundles.Add(new StyleBundle("~/Forerunner/ReportViewer/css/bundle").Include(
                  "~/Forerunner/ReportViewer/css/ManageParamSets.css",
                  "~/Forerunner/ReportViewer/css/PageNav.css",
                  "~/Forerunner/ReportViewer/css/ReportDocumentMap.css",
                  "~/Forerunner/ReportViewer/css/ReportParameter.css",
                  "~/Forerunner/ReportViewer/css/ReportPrint.css",
                  "~/Forerunner/ReportViewer/css/ReportRender.css",
                  "~/Forerunner/ReportViewer/css/ReportViewer.css",
                  "~/Forerunner/ReportViewer/css/ReportViewerEZ.css",
                  "~/Forerunner/ReportViewer/css/Toolbar.css",
                  "~/Forerunner/ReportViewer/css/ToolPane.css",
                  "~/Forerunner/ReportViewer/css/DSCredential.css"
                ));

            BundleTable.EnableOptimizations = true;
        }
    }
}