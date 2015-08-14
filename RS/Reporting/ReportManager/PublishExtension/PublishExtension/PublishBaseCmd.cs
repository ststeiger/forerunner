using System;
using System.Collections.Generic;
using System.Linq;
using System.Xml;
using System.Text;
using System.Threading.Tasks;
using System.Management.Automation;
using System.IO;
using System.Web.Script.Serialization;

using System.Security;
using System.Runtime.InteropServices;
using System.Net;

using PublishExtension.Management;

namespace PublishExtension
{
    public class PublishManifest
    {
        public string TargetServerURL { get; set; }
        public string TargetFolder { get; set; }
        public List<string> Reports { get; set; }

        public PublishManifest()
        {
            Reports = new List<string>();
        }

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

    public class PublishBaseCmd : PSCmdlet
    {
        #region Parameter properties / definitions

        [Parameter(HelpMessage = "Report project file name (drive + path + file name)")]
        [Alias("p")]
        public string ProjectFileName { get; set; }
        protected string ProjectPath
        {
            get
            {
                return Path.GetDirectoryName(ProjectFileName);
            }
        }

        protected string _configurationName = "Debug";
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

        [Parameter(HelpMessage = "Set this to the SharePoint host name, if SSRS is not running in Native mode")]
        [Alias("s")]
        public string SharePointHost { get; set; }

        [Parameter(HelpMessage = "Include this switch to get prompted for a username and password")]
        [Alias("u")]
        public SwitchParameter PromptForUsername { get; set; }

        [Parameter(HelpMessage = "Username used to set the report property into the published report")]
        [Alias("user")]
        private string _user;
        public string User
        {
            get
            {
                return _user;
            }

            set
            {
                _user = value;
            }
        }

        [Parameter(HelpMessage = "Password used to authenticate the user")]
        [Alias("password")]
        private SecureString _password;
        public SecureString Password
        {
            get
            {
                return _password;
            }
            set
            {
                _password = value;
            }
        }

        [Parameter(HelpMessage = "Domain where the User is authenticated")]
        [Alias("domain")]
        private string _dBDomain;
        public string DBDomain
        {
            get
            {
                return _dBDomain;
            }

            set
            {
                _dBDomain = value;
            }
        }

        #endregion  // Parameter properties / definitions

        #region Processing methods

        protected override void BeginProcessing()
        {
            base.BeginProcessing();
        }
        protected override void ProcessRecord()
        {
            base.ProcessRecord();

            if (!PromptForUsername.IsPresent)
            {
                return;
            }

            var descriptions = new System.Collections.ObjectModel.Collection<System.Management.Automation.Host.FieldDescription>();

            string userPrompt = "User";
            AddPrompt("User", User, "SSRS login user name", ref descriptions, out userPrompt);

            string passwordPrompt = "Password";
            var description = new System.Management.Automation.Host.FieldDescription(passwordPrompt);
            description.SetParameterType(Type.GetType("System.Security.SecureString"));
            description.HelpMessage = "SSRS User login password";
            descriptions.Add(description);

            // DefaultUserDomain
            string userDomain = Environment.GetEnvironmentVariable("USERDOMAIN");
            if ((DBDomain == null || DBDomain.Length == 0) &&
                (userDomain != null && userDomain.Length > 0))
            {
                DBDomain = userDomain;
            }

            Dictionary <string, PSObject> results = null;
            if (descriptions.Count > 0)
            {
                results = Host.UI.Prompt(null, null, descriptions);
                AssignResult(ref _user, userPrompt, results);

                // The password is always a different pattern than the rest
                PSObject value = null;
                bool hasValue = results.TryGetValue(passwordPrompt, out value);
                if (hasValue)
                {
                    Password = (System.Security.SecureString)results[passwordPrompt].BaseObject;
                }

            }
        }
        protected override void EndProcessing()
        {
            base.EndProcessing();
        }

        #endregion  // Processing methods

        #region protected methods and data

        protected const string RDLPropertyName = "ForerunnerRDLExt";
        protected RSManagementProxy rs;

        protected void AddPrompt(string name, string currentValue, string helpMessage, ref System.Collections.ObjectModel.Collection<System.Management.Automation.Host.FieldDescription> descriptions, out string prompt)
        {
            const string returnEqualsFormat = "{0} (return = '{1}')";
            prompt = name;
            if (currentValue != null && currentValue.Length > 0)
            {
                prompt = String.Format(returnEqualsFormat, prompt, currentValue);
            }
            var description = new System.Management.Automation.Host.FieldDescription(prompt);
            description.HelpMessage = helpMessage;
            descriptions.Add(description);
        }

        protected void AssignResult(ref string prop, string resultsKey, Dictionary<string, PSObject> results)
        {
            PSObject value = null;
            bool hasValue = results.TryGetValue(resultsKey, out value);
            if (!hasValue)
            {
                // Nothing to assign here this key was not prompted for
                return;
            }

            string result = (string)value.BaseObject;
            if (result == null || result.Length == 0)
            {
                // If the user just hit return the we keep whatever value we have
                return;
            }

            prop = result;
        }

        private string GetStringFromSecureString(SecureString value)
        {
            IntPtr valuePtr = IntPtr.Zero;
            try
            {
                valuePtr = Marshal.SecureStringToGlobalAllocUnicode(value);
                return Marshal.PtrToStringUni(valuePtr);
            }
            finally
            {
                Marshal.ZeroFreeGlobalAllocUnicode(valuePtr);
            }
        }

        protected bool IsNative()
        {
            return SharePointHost == null;
        }

        protected string GetPath(string folder, string filePath)
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

        protected void PublishProperty(PublishManifest manifest, string filePath, string propertyName, string propertyValue)
        {
            WriteObject("PublishProperty - Report: '" + Path.GetFileName(filePath) + "', " + "Property: " + propertyName);

            // Configure the Report Server Proxy
            rs.Url = manifest.TargetServerURL;
            if (PromptForUsername.IsPresent)
            {
                rs.Credentials = new NetworkCredential(User, Password, DBDomain);
            }
            else
            {
                rs.Credentials = System.Net.CredentialCache.DefaultCredentials;
            }

            // Set the RDL Extension property
            Property reportProperty = new Property();
            //reportProperty.Name = "ForerunnerRDLExt";
            reportProperty.Name = propertyName;
            reportProperty.Value = propertyValue;

            Property[] properties = new Property[1];
            properties[0] = reportProperty;

            string path = GetPath(manifest.TargetFolder, filePath);
            rs.SetProperties(path, properties);
        }

        protected PublishManifest GetProjectConfigValues()
        {
            WriteVerbose("Start GetProjectConfigValues()");

            PublishManifest manifest = new PublishManifest();

            // Document
            var projDoc = new XmlDocument();
            projDoc.Load(ProjectFileName);

            // <Reports)
            XmlNodeList fullPaths = projDoc.GetElementsByTagName("FullPath");
            foreach (XmlNode fullPathNode in fullPaths)
            {
                String fullPath = fullPathNode.InnerText;

                if (String.Compare(Path.GetExtension(fullPath), ".rdl", true) == 0)
                {
                    manifest.Reports.Add(fullPath);
                }
            }

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

        protected void ValidateFileExists(string filename, string filetype)
        {
            if (!File.Exists(filename))
            {
                throw new FileNotFoundException(filetype + ": " + filename + ", not found", filename);
            }
        }

        protected void ValidateFileOrDirExists(string filename, string filetype)
        {
            if (!File.Exists(filename) && !Directory.Exists(filename))
            {
                throw new FileNotFoundException(filetype + ": " + filename + ", not found", filename);
            }
        }

        #endregion  // protected methods and data
    }
}
