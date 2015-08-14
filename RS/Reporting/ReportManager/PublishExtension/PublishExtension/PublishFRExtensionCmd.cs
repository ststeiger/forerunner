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
    [Cmdlet("Publish", "FRExtension")]
    public class PublishFRExtensionCmd : PublishBaseCmd
    {
        #region Parameter properties / definitions

        [Parameter(HelpMessage = "Item path (drive + path + file name)")]
        [Alias("i")]
        public string ItemPath { get; set; }

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

            base.ProcessRecord();

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

            string path = Path.GetFileNameWithoutExtension(filePath) + ".rdl";
            PublishProperty(manifest, path, RDLPropertyName, fileData);
        }

        private void ValidateInputParameters()
        {
            WriteVerbose("Start ValidateInputParameters()");

            ValidateFileExists(ProjectFileName, "Project");
            ValidateFileOrDirExists(ItemPath, "Item");

            WriteVerbose("End ValidateInputParameters()");
        }

        #endregion  // Private methods and data
    }
}
