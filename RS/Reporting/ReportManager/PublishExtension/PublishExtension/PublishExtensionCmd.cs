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
    public class PublishManifest
    {
        public string TargetServerURL { get; set; }
        public string TargetFolder { get; set; }

        public void Validate(string configurationName)
        {
            if (TargetServerURL == null)
            {
                throw new ArgumentException("Project file missing: '<TargetServerURL>' in configuration: '" + configurationName + "'");
            }
            else if (TargetFolder == null)
            {
                throw new ArgumentException("Project file missing: '<TargetFolder>' in configuration: '" + configurationName + "'");
            }
        }
    }

    [Cmdlet("Publish", "Extension")]
    public class PublishExtensionCmd : PSCmdlet
    {
        #region Parameter properties / definitions

        [Parameter(HelpMessage = "Item path (drive + path + file name)")]
        [Alias("i")]
        public string ItemPath { get; set; }

        [Parameter(HelpMessage = "Report project file name (drive + path + file name)")]
        [Alias("p")]
        public string ProjectFileName { get; set; }

        private string _configurationName = "Debug";
        [Parameter(HelpMessage = "Project configuration. default = 'Debug'")]
        [Alias("c")]
        public string ConfigurationName
        {
            get
            {
                return _configurationName;
            }
            set
            {
                _configurationName = value;
            }
        }

        [Parameter(HelpMessage = "Set this to the SharePoint host name, if SSRS if not running in Native mode")]
        [Alias("s")]
        public string SharePointHost { get; set; }

        #endregion  // Parameter properties / definitions

        #region Processing methods

        protected override void BeginProcessing()
        {
            base.BeginProcessing();
        }
        protected override void ProcessRecord()
        {
            int processingId = 1;
            string activity = "Deploying Mobilizer RDL Extension(s)";

            rs = new RSManagementProxy(IsNative());

            WriteProgress(new ProgressRecord(processingId, activity, "ValidateInputParameters()"));
            ValidateInputParameters();

            WriteProgress(new ProgressRecord(processingId, activity, "GetProjectConfigValues()"));
            PublishManifest manifest = GetProjectConfigValues();

            WriteProgress(new ProgressRecord(processingId, activity, "PublishExtension()"));
            Publish(manifest);
        }
        protected override void EndProcessing()
        {
            base.EndProcessing();
        }

        #endregion  // Processing methods

        #region Private methods and data

        private RSManagementProxy rs;

        private bool IsNative()
        {
            return SharePointHost == null;
        }

        private void Publish(PublishManifest manifest)
        {
            WriteVerbose("Start Publish()");
            WriteVerbose("Target Server URL: " + manifest.TargetServerURL);
            WriteVerbose("Target Folder: " + manifest.TargetFolder);

            if (Directory.Exists(ItemPath))
            {
                string[] files = Directory.GetFiles(ItemPath);
                foreach (string filePath in files)
                {
                    if (String.Compare(Path.GetExtension(filePath), ".rdle", true) == 0)
                    {
                        PublishFile(manifest, filePath);
                    }
                }
            }
            else
            {
                PublishFile(manifest, ItemPath);
            }

            WriteVerbose("End Publish()");
        }

        private string GetPath(string folder, string filePath)
        {
            string targetFolder = folder.IndexOf("/") == 0 ? folder : "/" + folder;
            targetFolder = targetFolder[targetFolder.Length - 1] == '/' ? targetFolder : targetFolder + "/";

            if (IsNative())
            {
                string resourceName = Path.GetFileNameWithoutExtension(filePath);
                return targetFolder + resourceName;
            }
            else
            {
                string fileName = Path.GetFileName(filePath);
                return SharePointHost + targetFolder + fileName;
            }
        }

        private void PublishFile(PublishManifest manifest, string filePath)
        {
            WriteVerbose("PublishFile - File: '" + Path.GetFileName(filePath) + "'");

            // Read the RDL Extension data from the file
            string fileData = File.ReadAllText(filePath);

            // Sanity checks
            if (String.Compare(Path.GetExtension(filePath), ".rdle", true) != 0)
            {
                // We only process files with the rdle extension
                throw new ArgumentException("Invalid file extension (must be .rdle)", "-i");
            }

            // Configure the Report Server Proxy
            rs.Credentials = System.Net.CredentialCache.DefaultCredentials;
            rs.Url = manifest.TargetServerURL;

            // Set the RDL Extension property
            Property forerunnerRDLExt = new Property();
            forerunnerRDLExt.Name = "ForerunnerRDLExt";
            forerunnerRDLExt.Value = fileData;

            Property[] properties = new Property[1];
            properties[0] = forerunnerRDLExt;

            string path = GetPath(manifest.TargetFolder, filePath);
            rs.SetProperties(path, properties);
        }

        private PublishManifest GetProjectConfigValues()
        {
            WriteVerbose("Start GetProjectConfigValues()");

            PublishManifest manifest = new PublishManifest();

            // Document
            var projDoc = new XmlDocument();
            projDoc.Load(ProjectFileName);

            // <Configurations>
            XmlNodeList configurations = projDoc.GetElementsByTagName("Configuration");
            foreach (XmlNode configuration in configurations)
            {
                bool isTargetConfig = false;

                // <Configuration>
                foreach (XmlNode item in configuration.ChildNodes)
                {
                    if (String.Compare(item.LocalName, "Name", true) == 0 &&
                        String.Compare(item.InnerText, ConfigurationName, true) == 0)
                    {
                        isTargetConfig = true;
                    }

                    if (isTargetConfig && String.Compare(item.LocalName, "Options", true) == 0)
                    {
                        // <Options>
                        foreach (XmlNode option in item.ChildNodes)
                        {
                            if (String.Compare(option.LocalName, "TargetServerURL", true) == 0)
                            {
                                // <TargetServerURL>
                                manifest.TargetServerURL = option.InnerText;
                            }
                            else if (String.Compare(option.LocalName, "TargetFolder", true) == 0)
                            {
                                // <TargetFolder>
                                manifest.TargetFolder = option.InnerText;
                            }
                        }
                    }
                }

                if (isTargetConfig)
                {
                    manifest.Validate(ConfigurationName);

                    WriteVerbose("End GetProjectConfigValues()");
                    return manifest;
                }
            }

            throw new ArgumentException("Project file missing: '<Configration>' name: '" + ConfigurationName + "'");
        }

        private void ValidateInputParameters()
        {
            WriteVerbose("Start ValidateInputParameters()");

            ValidateFileExists(ProjectFileName, "Project");
            ValidateFileExists(ItemPath, "Item");

            WriteVerbose("End ValidateInputParameters()");
        }

        private void ValidateFileExists(string filename, string filetype)
        {
            if (!File.Exists(filename))
            {
                throw new FileNotFoundException(filetype + ": " + filename + ", not found", filename);
            }
        }
        #endregion  // Private methods and data
    }
}
