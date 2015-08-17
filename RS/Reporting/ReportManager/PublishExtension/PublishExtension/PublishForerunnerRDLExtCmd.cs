using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Text;
using System.Threading.Tasks;
using System.Management.Automation;
using System.IO;
using System.Web.Script.Serialization;

using PublishExtension.Management;

namespace PublishExtension
{
    [Cmdlet("Publish", "ForerunnerRDLExt")]
    public class PublishForerunnerRDLExtCmd : PublishBaseCmd
    {
        #region Parameter properties / definitions

        [Parameter(HelpMessage = "Report file name (e.g., 'Trial Licenses Detail.rdl')")]
        [Alias("r")]
        public string ReportPath { get; set; }

        [Parameter(HelpMessage = "Publish all custom report parameters")]
        [Alias("a")]
        public SwitchParameter AllReportProperties { get; set; }

        #endregion  // Parameter properties / definitions

        #region Processing methods

        protected override void BeginProcessing()
        {
            base.BeginProcessing();
        }
        protected override void ProcessRecord()
        {
            int processingId = 1;
            string activity = "Deploying Forerunner RDL Extension(s)";

            rs = new RSManagementProxy(IsNative());

            WriteProgress(new ProgressRecord(processingId, activity, "ValidateInputParameters()"));
            ValidateInputParameters();

            base.ProcessRecord();

            WriteProgress(new ProgressRecord(processingId, activity, "GetProjectConfigValues()"));
            PublishManifest manifest = GetProjectConfigValues();

            WriteProgress(new ProgressRecord(processingId, activity, "Publish()"));
            Publish(manifest);
        }
        protected override void EndProcessing()
        {
            base.EndProcessing();
        }

        #endregion  // Processing methods

        #region Private methods and data

        protected void ValidateInputParameters()
        {
            WriteVerbose("Start ValidateInputParameters()");

            ValidateFileExists(ProjectFileName, "Project");
            if (ReportPath != null)
            {
                string path = Path.Combine(ProjectPath, ReportPath);
                ValidateFileOrDirExists(path, "Report");
            }

            WriteVerbose("End ValidateInputParameters()");
        }

        private void Publish(PublishManifest manifest)
        {
            WriteVerbose("Start Publish()");
            WriteVerbose("Target Server URL: " + manifest.TargetServerURL);
            WriteVerbose("Target Folder: " + manifest.TargetFolder);

            if (ReportPath != null)
            {
                string path = Path.Combine(ProjectPath, ReportPath);
                PublishReport(path, manifest);
            }
            else
            {
                foreach (string report in manifest.Reports)
                {
                    string path = Path.Combine(ProjectPath, report);
                    PublishReport(path, manifest);
                }
            }

            WriteVerbose("End Publish()");
        }

        private void PublishReport(string path, PublishManifest manifest)
        {
            if (AllReportProperties.IsPresent)
            {
                PublishAllReportProperties(path, manifest);
            }
            else
            {
                PublishRDLExtProperty(path, manifest);
            }
        }

        private void PublishAllReportProperties(string path, PublishManifest manifest)
        {
            List<Property> properties = new List<Property>();

            var rdlDoc = new XmlDocument();
            rdlDoc.Load(path);

            // <Reports)
            XmlNodeList customProperties = rdlDoc.GetElementsByTagName("CustomProperty");
            foreach (XmlNode customProperty in customProperties)
            {
                string name = "";
                string value = "";

                System.Collections.IEnumerator enumerator = customProperty.GetEnumerator();
                while (enumerator.MoveNext())
                {
                    XmlNode node = (XmlNode)enumerator.Current;
                    if (String.Compare(node.LocalName, "Name", true) == 0)
                    {
                        name = node.InnerText;
                    }
                    else if (String.Compare(node.LocalName, "Value", true) == 0)
                    {
                        value = node.InnerText;
                    }
                }

                if (name.Length > 0 && value.Length > 0)
                {
                    Property property = new Property();
                    property.Name = name;
                    property.Value = value;
                    properties.Add(property);
                }
            }

            if (properties.Count > 0)
            {
                PublishProperties(manifest, path, properties.ToArray());
            }

        }

        private void PublishRDLExtProperty(string path, PublishManifest manifest)
        {
            string value;
            bool foundName;
            GetPropertyValue(path, RDLPropertyName, out foundName, out value);

            if (foundName && value.Length > 0)
            {
                PublishProperty(manifest, Path.GetFileName(path), RDLPropertyName, value);
            }
            else if (!foundName)
            {
                WriteVerbose("Custom report property: '" + RDLPropertyName + "' Not found in report: '" + Path.GetFileName(path) + "'");
            }
            else
            {
                WriteVerbose("No Value found for custom report property '" + RDLPropertyName + "' in report: '" + Path.GetFileName(path) + "'");
            }
        }

        private void GetPropertyValue(string rdlPath, string name, out bool foundName, out string value)
        {
            var rdlDoc = new XmlDocument();
            rdlDoc.Load(rdlPath);
            foundName = false;
            value = "";

            // <Reports)
            XmlNodeList customProperties = rdlDoc.GetElementsByTagName("CustomProperty");
            foreach (XmlNode customProperty in customProperties)
            {
                System.Collections.IEnumerator enumerator = customProperty.GetEnumerator();
                while (enumerator.MoveNext())
                {
                    XmlNode node = (XmlNode)enumerator.Current;
                    if (String.Compare(node.LocalName, "Name", true) == 0 &&
                        String.Compare(node.InnerText, RDLPropertyName, true) == 0)
                    {
                        foundName = true;
                    }
                    else if (String.Compare(node.LocalName, "Value", true) == 0)
                    {
                        value = node.InnerText;
                    }
                }
                if (foundName && value.Length > 0)
                {
                    return;
                }
            }
        }

        #endregion  // Private methods and data
    }
}
