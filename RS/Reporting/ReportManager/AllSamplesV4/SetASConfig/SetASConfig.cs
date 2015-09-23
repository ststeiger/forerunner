using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO;

using EnvDTE;
using EnvDTE80;
using System.Management.Automation;
using Forerunner.Powershell;

namespace Forerunner.AS.ConfigTool
{
    [Cmdlet(VerbsCommon.Set, "ASConfig")]
    public class SetASConfig : FRCmdlet
    {
        public SetASConfig()
        {

        }

        #region Parameter properties / definitions

        private string _reportPath1 = null;
        [Parameter(HelpMessage = "Report path 1",
                   ParameterSetName = "config")]
        [Alias("r1")]
        public string ReportPath1
        {
            get
            {
                return _reportPath1;
            }
            set
            {
                _reportPath1 = value;
            }
        }

        private string _reportPath2 = null;
        [Parameter(HelpMessage = "Report path 2",
                   ParameterSetName = "config")]
        [Alias("r2")]
        public string ReportPath2
        {
            get
            {
                return _reportPath2;
            }
            set
            {
                _reportPath2 = value;
            }
        }

        private string _reportPath3 = null;
        [Parameter(HelpMessage = "Report path 3",
                   ParameterSetName = "config")]
        [Alias("r3")]
        public string ReportPath3
        {
            get
            {
                return _reportPath3;
            }
            set
            {
                _reportPath3 = value;
            }
        }

        #endregion // Parameter properties / definitions

        #region Processing methods

        protected override void BeginProcessing()
        {
            base.BeginProcessing();
        }
        protected override void ProcessRecord()
        {
            LoadWebConfig();

            int processingId = 1;
            string activity = "Updating Forerunner Configuration Settings";

            PromptForReportPaths();

            WriteProgress(new ProgressRecord(processingId, activity, "UpdateWebConfig()"));
            UpdateWebConfig();

            WriteProgress(new ProgressRecord(processingId, activity, "UpdateReportPaths()"));
            UpdateReportPaths();

            WriteProgress(new ProgressRecord(processingId, activity, "UpdateProjectSettings()"));
            UpdateProjectSettings();

            WriteObject("Set-ASConfig complete");
        }
        protected override void EndProcessing()
        {
            base.EndProcessing();
        }

        #endregion // Processing methods

        #region Private Methods

        private void PromptForReportPaths()
        {
            var descriptions = new System.Collections.ObjectModel.Collection<System.Management.Automation.Host.FieldDescription>();

            // Prompt for the report paths
            String report1Prompt;
            String report2Prompt;
            String report3Prompt;
            AddPrompt("ReportPath1", ReportPath1, @"Fully qualified path for the first report", ref descriptions, out report1Prompt);
            AddPrompt("ReportPath2", ReportPath2, @"Fully qualified path for the second report", ref descriptions, out report2Prompt);
            AddPrompt("ReportPath3", ReportPath3, @"Fully qualified path for the third report", ref descriptions, out report3Prompt);

            Dictionary<string, PSObject> results = null;
            results = Host.UI.Prompt(null, null, descriptions);
            AssignResult(ref _reportPath1, report1Prompt, results);
            AssignResult(ref _reportPath2, report2Prompt, results);
            AssignResult(ref _reportPath3, report3Prompt, results);
        }
        private void UpdateProjectSettings()
        {
            WriteVerbose("Start UpdateProjectSettings()");

            ConfigurationManager cm = DefaultProject.ConfigurationManager;
            foreach (Configuration c in cm)
            {
                // Set the Build Output Documentation file path for all configurations
                c.Properties.Item("DocumentationFile").Value = @"App_data\XmlDocument.xml";
            }

            // Set the start page to home
            Properties properties = DefaultProject.Properties;
            properties.Item("WebApplication.StartPageUrl").Value = @"#as-home";
            properties.Item("WebApplication.DebugStartAction").Value = 1;

            WriteVerbose("End UpdateProjectSettings()");
        }
        private void UpdateReportPaths()
        {
            WriteVerbose("Start UpdateReportPaths()");

            // Male sure the file exists
            CreateMissingFile(@"lib\samples\js\settings.js", null);

            // Write the settings and save the new version of the file
            StringBuilder sb = new StringBuilder();
            sb.Append(
                "var allSamples = allSamples || {};\r\n\r\n" +
                "$(function () {\r\n" +
                "    allSamples.settings = {\r\n");
            sb.Append("        reportPath1: '" + ReportPath1 + "',\r\n");
            sb.Append("        reportPath2: '" + ReportPath2 + "',\r\n");
            sb.Append("        reportPath3: '" + ReportPath3 + "'\r\n");
            sb.Append("    }  // allSamples.settings\r\n");
            sb.Append("});  // function()\r\n");

            string path = GetLocalFilePathFromProject(@"lib\samples\js", "settings.js");
            WriteVerbose("Saving file: " + path);
            File.WriteAllText(path, sb.ToString());

            WriteVerbose("End UpdateReportPaths()");
        }

        private void LoadWebConfig()
        {
            WriteVerbose("Start LoadWebConfig()");

            AssignAppSetting(ref _reportPath1, "ReportPath1", null, asAappSettingPrefix);
            AssignAppSetting(ref _reportPath2, "ReportPath2", null, asAappSettingPrefix);
            AssignAppSetting(ref _reportPath3, "ReportPath3", null, asAappSettingPrefix);

            WriteVerbose("End LoadWebConfig()");
        }
        private void UpdateWebConfig()
        {
            WriteVerbose("Start UpdateWebConfig()");

            SetAppSetting("ReportPath1", ReportPath1, asAappSettingPrefix);
            SetAppSetting("ReportPath2", ReportPath2, asAappSettingPrefix);
            SetAppSetting("ReportPath3", ReportPath3, asAappSettingPrefix);

            WriteVerbose("Saving settings: " + AppConfig.FilePath);
            AppConfig.Save();

            WriteVerbose("End UpdateWebConfig()");
            return;
        }

        private const string asAappSettingPrefix = "AllSamples.";

        #endregion  // Private Methods
    }
}
