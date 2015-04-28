﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security;
using System.Data.SqlClient;
using System.Runtime.InteropServices;
using System.Management.Automation;
using System.Text.RegularExpressions;
using System.IO;

using EnvDTE;
using EnvDTE80;

using ReportMannagerConfigTool;
using ForerunnerLicense;

namespace Forerunner.SDK.ConfigTool
{
    [Cmdlet(VerbsCommon.Set, "FRConfig")]
    public class SetFRConfig : PSCmdlet
    {
        public SetFRConfig()
        {
        }

        #region Parameter properties / definitions

        // License key
        private string _licenseKey;
        [Parameter(HelpMessage = "Activation license key")]
        [Alias("l")]
        public string LicenseKey
        {
            get { return _licenseKey; }
            set { _licenseKey = value; }
        }

        // <add key="Forerunner.IsNative" value="true" />
        private string _isNative;
        [Parameter(HelpMessage = "'true' = native, 'false' = Power Point")]
        [Alias("n")]
        public string IsNative
        {
            get { return _isNative; }
            set { _isNative = value; }
        }

        // <add key="Forerunner.SharePointHost" value="" />
        private string _sharePointHost;
        [Parameter(HelpMessage = "URL of the Share Point host, used if IsNative = 'false'")]
        [Alias("s")]
        public string SharePointHost
        {
            get { return _sharePointHost; }
            set { _sharePointHost = value; }
        }

        // <add key="Forerunner.DefaultUserDomain" value="" />
        private string _defaultUserDomain;
        [Parameter(HelpMessage = "Domain used to authenticate the user")]
        [Alias("ud")]
        public string DefaultUserDomain 
        {
            get
            {
                return _defaultUserDomain;
            }
            set
            {
                _defaultUserDomain = value;
            }
        }

        // <add key="Forerunner.ReportServerWSUrl" value="http://localhost/ReportServer" />
        private string _reportServerWSUrl;
        [Parameter(HelpMessage = "Report Server URL")]
        [Alias("ssrs")]
        public string ReportServerWSUrl
        {
            get { return _reportServerWSUrl; }
            set { _reportServerWSUrl = value; }
        }

        // <add key="Forerunner.ReportServerDataSource" value="." />
        private string _reportServerDataSource;
        [Parameter(HelpMessage = "Report Server data source")]
        [Alias("ds")]
        public string ReportServerDataSource
        {
            get { return _reportServerDataSource; }
            set { _reportServerDataSource = value; }
        }

        // <add key="Forerunner.UseIntegratedSecurityForSQL" value="" />
        private string _useIntegratedSecurityForSQL;
        [Parameter(HelpMessage = authenticationHelp)]
        [Alias("ia")]
        public string UseIntegratedSecurityForSQL
        {
            get { return _useIntegratedSecurityForSQL; }
            set { _useIntegratedSecurityForSQL = value; }
        }

        // <add key="Forerunner.UseMobilizerDB" value="true" />
        private string _useMobilizerDB;
        [Parameter(HelpMessage = "Don't allow any use of the Mobilizer DB functions")]
        [Alias("umdb")]
        public string UseMobilizerDB
        {
            get { return _useMobilizerDB; }
            set { _useMobilizerDB = value; }
        }

        // <add key="Forerunner.SeperateDB" value="false" />
        private string _seperateDB;
        [Parameter(HelpMessage = "Use a separate DB for Mobilizer")]
        [Alias("sdb")]
        public string SeperateDB
        {
            get { return _seperateDB; }
            set { _seperateDB = value; }
        }

        // <add key="Forerunner.ReportServerDB" value="ReportServer" />
        private string _reportServerDB;
        [Parameter(HelpMessage = "Report server database name")]
        [Alias("dn")]
        public string ReportServerDB
        {
            get { return _reportServerDB; }
            set { _reportServerDB = value; }
        }

        // <add key="Forerunner.ReportServerDBUser" value="" />
        private string _reportServerDBUser;
        [Parameter(HelpMessage = "Domain User to log into the DB")]
        [Alias("u")]
        public string ReportServerDBUser
        {
            get
            {
                return _reportServerDBUser;
            }
            set
            {
                _reportServerDBUser = value;
            }
        }

        // <add key="Forerunner.ReportServerDBPWD" value="" />
        private SecureString _reportServerDBPWD;
        [Parameter(HelpMessage = "ReportServerDBUser password")]
        [Alias("p")]
        public SecureString ReportServerDBPWD
        {
            get
            {
                return _reportServerDBPWD;
            }
            set
            {
                _reportServerDBPWD = value;
            }
        }

        // <add key="Forerunner.ReportServerDBDomain" value="" />
        private string _reportServerDBDomain;
        [Parameter(HelpMessage = "Report server database domain")]
        [Alias("dd")]
        public string ReportServerDBDomain
        {
            get { return _reportServerDBDomain; }
            set { _reportServerDBDomain = value; }
        }

        // <add key="Forerunner.ReportServerTimeout" value="100000" />
        private string _reportServerTimeout = "100000";
        [Parameter(HelpMessage = "Report server timeout (milliseconds)")]
        [Alias("t")]
        public string ReportServerTimeout
        {
            get { return _reportServerTimeout; }
            set { _reportServerTimeout = value; }
        }

        // <add key="Forerunner.IgnoreSSLErrors" value="true" />
        private string _ignoreSSLErrors = "true";
        [Parameter(HelpMessage = "Ignore SSL errors")]
        [Alias("i")]
        public string IgnoreSSLErrors
        {
            get { return _ignoreSSLErrors; }
            set { _ignoreSSLErrors = value; }
        }

        // <add key="Forerunner.QueueThumbnails" value="false" />
        private string _queueThumbnails = "false";
        [Parameter(HelpMessage = "Queue thumbnail requests")]
        [Alias("q")]
        public string QueueThumbnails
        {
            get { return _queueThumbnails; }
            set { _queueThumbnails = value; }
        }

        // <add key="Forerunner.MobilizerSettingPath" value="Custom\MobilizerSettings.txt"/>
        private string _mobilizerSettingPath = @"Custom\MobilizerSettings.txt";
        [Parameter(HelpMessage = "Path to the Mobilizer settings file")]
        [Alias("m")]
        public string MobilizerSettingPath
        {
            get { return _mobilizerSettingPath; }
            set { _mobilizerSettingPath = value; }
        }

        // <add key="Forerunner.VersionPath" value="Forerunner\version.txt" />
        private string _versionPath = @"Forerunner\version.txt";
        [Parameter(HelpMessage = "Path to the Mobilizer build version test file")]
        [Alias("v")]
        public string VersionPath
        {
            get { return _versionPath; }
            set { _versionPath = value; }
        }

        private string _projectName;
        [Parameter(HelpMessage = "Explicitly defines which project you want configured")]
        [Alias("pr")]
        public string ProjectName
        {
            get
            {
                return _projectName;
            }
            set
            {
                _projectName = value;
            }
        }

        private string _webConfigPath;
        [Parameter(HelpMessage = "Fully qualified path, including filename to the web.config file")]
        [Alias("w")]
        public string WebConfigPath
        {
            get
            {
                return _webConfigPath;
            }
            set
            {
                _webConfigPath = value;
            }
        }

        private SwitchParameter _skipLicenseCheck;
        [Parameter(HelpMessage = "Causes Set-FRConfig to skip the license check")]
        [Alias("sl")]
        public SwitchParameter SkipLicenseCheck
        {
            get
            {
                return _skipLicenseCheck;
            }
            set
            {
                _skipLicenseCheck = value;
            }
        }

        // Get the Assembly path of this assembly
        private string _assemblyPath = null;
        private string AssemblyPath
        {
            get
            {
                if (_assemblyPath != null)
                {
                    return _assemblyPath;
                }

                string codeBase = System.Reflection.Assembly.GetExecutingAssembly().CodeBase;
                UriBuilder uri = new UriBuilder(codeBase);
                _assemblyPath = Path.GetDirectoryName(Uri.UnescapeDataString(uri.Path));
                return _assemblyPath;
            }
        }
        // Get the default namespace of the project
        private string _defaultNamespace = null;
        private string DefaultNamespace
        {
            get
            {
                if (_defaultNamespace != null)
                {
                    return _defaultNamespace;
                }
                Project project = GetProject();
                Properties properties = project.Properties;
                _defaultNamespace = properties.Item("DefaultNamespace").Value;
                return _defaultNamespace;
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
            LicenseData data = ClientLicense.GetLicense();
            if (data != null)
            {
                LicenseKey = data.LicenseKey;
            }

            PromptForMissingParameters();

            int processingId = 1;
            string activity = "Updating Forerunner Configuration Settings";
            WriteProgress(new ProgressRecord(processingId, activity, "TestConnection()"));
            TestConnection();

            if (!SkipLicenseCheck.IsPresent)
            {
                WriteProgress(new ProgressRecord(processingId, activity, "ActivateLicense()"));
                ActivateLicense();
            }

            WriteProgress(new ProgressRecord(processingId, activity, "UpdateWebConfig()"));
            UpdateWebConfig();

            WriteProgress(new ProgressRecord(processingId, activity, "UpdateDBSchema()"));
            UpdateDBSchema();

            WriteProgress(new ProgressRecord(processingId, activity, "UpdateSourceFiles()"));
            UpdateSourceFiles();

            WriteProgress(new ProgressRecord(processingId, activity, "CheckTargetFramework()"));
            CheckTargetFramework();

            // Return this (I.e., the FRConfigTool) to the pipeline this will enable the user to
            // call individual public methods such as ActivateLicense()
            WriteObject("Set-FRConfig complete");
        }
        protected override void EndProcessing()
        {
            base.EndProcessing();
        }

        #endregion // Processing methods

        #region Private methods and data

        // Private Methods
        //
        private Boolean TestConnection()
        {
            WriteVerbose("Start TestConnection()");

            string result = "";
            System.Text.StringBuilder errorMessage = new System.Text.StringBuilder();
            bool isNative = String.Compare(IsNative, "true", true) == 0;

            if (isUseMobilizerDB())
            {
                WriteVerbose("Testing the DB connection");

                SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
                builder.DataSource = ReportServerDataSource;
                builder.InitialCatalog = ReportServerDB;
                string dbServerPWD = GetStringFromSecureString(ReportServerDBPWD);
                if (!isUseIntegratedSecurityForSQL())
                {
                    builder.UserID = ReportServerDBUser;
                    builder.Password = dbServerPWD;
                }
                else
                {
                    builder.IntegratedSecurity = true;
                }

                //Test database connection
                if (isUseIntegratedSecurityForSQL())
                    result = ConfigToolHelper.tryConnectDBIntegrated(builder.ConnectionString, ReportServerDBUser, ReportServerDBDomain, dbServerPWD);
                else
                    result = ConfigToolHelper.tryConnectDB(builder.ConnectionString);

                if (!StaticMessages.testSuccess.Equals(result))
                {
                    errorMessage.AppendLine(result);
                    errorMessage.AppendLine();
                }
            }

            WriteVerbose("Testing the Web Service URL");

            //Test web service url connection
            result = ConfigToolHelper.tryWebServiceUrl(!isNative, ReportServerWSUrl);
            if (!StaticMessages.testSuccess.Equals(result))
            {
                errorMessage.AppendLine(result);
            }

            if (errorMessage.Length != 0)
            {
                string errorRecordMessage = String.Format(StaticMessages.databaseConnectionFail, errorMessage.ToString());
                ErrorRecord errorRecord = new ErrorRecord(new Exception(errorRecordMessage), errorRecordMessage, ErrorCategory.InvalidArgument, null);
                WriteError(errorRecord);
                WriteVerbose(errorRecordMessage);
                WriteVerbose("End TestConnection()");
                return false;
            }

            WriteVerbose("End TestConnection()" + StaticMessages.connectDBSuccess);
            return true;
        }
        private Boolean ActivateLicense()
        {
            WriteVerbose("Start ActivateLicense()");

            string licenseInfo;

            if (needsActivation && LicenseKey != null && LicenseKey.Length > 0)
            {
                WriteVerbose("Activating license");
                licenseInfo = ClientLicense.ActivateFromKey(LicenseKey);
            }
            else
            {
                WriteVerbose("License already active");
                licenseInfo = ClientLicense.GetLicenseString();
            }

            if (licenseInfo.Length > 0)
            {
                WriteVerbose(licenseInfo);
            }

            WriteVerbose("End ActivateLicense()");
            return true;
        }
        private Boolean UpdateWebConfig()
        {
            WriteVerbose("Start UpdateWebConfig()");

            SetForerunnerSetting("IsNative", IsNative);
            SetForerunnerSetting("SharePointHost", SharePointHost);
            SetForerunnerSetting("DefaultUserDomain", DefaultUserDomain);
            SetForerunnerSetting("ReportServerWSUrl", ReportServerWSUrl);
            SetForerunnerSetting("ReportServerDataSource", ReportServerDataSource);
            SetForerunnerSetting("UseIntegratedSecurityForSQL", UseIntegratedSecurityForSQL);
            SetForerunnerSetting("UseMobilizerDB", UseMobilizerDB);
            SetForerunnerSetting("SeperateDB", SeperateDB);
            SetForerunnerSetting("ReportServerDB", ReportServerDB);
            SetForerunnerSetting("ReportServerDBUser", ReportServerDBUser);

            // Need to get and set the encrypted value here
            if (ReportServerDBPWD != null && ReportServerDBPWD.Length > 0)
            {
                string password = GetStringFromSecureString(ReportServerDBPWD);
                string encryptedPWD = Forerunner.SSRS.Security.Encryption.Encrypt(password);
                SetForerunnerSetting("ReportServerDBPWD", encryptedPWD);
            }

            SetForerunnerSetting("ReportServerDBDomain", ReportServerDBDomain);
            SetForerunnerSetting("ReportServerTimeout", ReportServerTimeout);
            SetForerunnerSetting("IgnoreSSLErrors", IgnoreSSLErrors);
            SetForerunnerSetting("QueueThumbnails", QueueThumbnails);
            SetForerunnerSetting("MobilizerSettingPath", MobilizerSettingPath);
            SetForerunnerSetting("VersionPath", VersionPath);

            WriteVerbose("Saving Forerunner settings: " + appConfig.FilePath);
            appConfig.Save();

            WriteVerbose("End UpdateWebConfig()");
            return true;
        }
        private Boolean UpdateSourceFiles()
        {
            WriteVerbose("Start UpdateSourceFiles()");

            if (WebConfigPath != null)
            {
                WriteVerbose("Skipping UpdateSourceFiles() because -WebConfigPath is defined");
                WriteVerbose("end UpdateSourceFiles()");
                return true;
            }

            // Create or update all source files needed to support Forerunner SDK
            CreateMissingFiles();
            UpdateWebApiConfig();
            UpdateGlobal();

            WriteVerbose("end UpdateSourceFiles()");
            return true;
        }
        private string GetProjectDirectory()
        {
            Project project = GetProject();
            return Path.GetDirectoryName(project.FullName);
        }
        private void CreateMissingFiles()
        {
            // Make sure all required files are included in the project
            CreateMissingFile(@"App_Start\FilterConfig.cs");
            CreateMissingFile(@"App_Start\WebApiConfig.cs");
            CreateMissingFile(@"App_Start\RouteConfig.cs");
            CreateMissingFile(@"Views\Web.config");
            CreateMissingFile(@"Global.asax");
            CreateMissingFile(@"Global.asax.cs");
        }
        private void CreateMissingFile(string destPath)
        {
            string fullPath = Path.Combine(GetProjectDirectory(), destPath);

            if (File.Exists(fullPath))
            {
                // If the file exists we are done
                return;
            }

            // Make sure the folder structure exists
            string projPath = GetProjectDirectory();
            string relativePath = Path.GetDirectoryName(fullPath).Substring(projPath.Length);
            if (relativePath != null && relativePath.Length > 0)
            {
                char[] sep = {'\\'};
                string[] folders = relativePath.Split(sep);
                string curFolder = projPath;
                foreach (string folder in folders)
                {
                    if (folder.Length > 0)
                    {
                        curFolder = Path.Combine(curFolder, folder);
                        Directory.CreateDirectory(curFolder);
                    }
                }
            }

            // Create the file and rename the namespace reference
            string sourcePath = Path.Combine(AssemblyPath, Path.GetFileName(destPath));
            string source = File.ReadAllText(sourcePath);
            const string oldValue = "GettingStartedV4";
            string newValue = DefaultNamespace;
            string newSource = source.Replace(oldValue, newValue);
            File.WriteAllText(fullPath, newSource);

            // Now create the project folders and item
            char[] seps = {'\\'};
            string[] parts = destPath.Split(seps);
            Project project = GetProject();
            AddExistingItem(fullPath, project.ProjectItems, parts);
        }
        private ProjectItem AddExistingItem(string fullPath, ProjectItems items, string[] parts)
        {
            string[] newParts = null;

            ProjectItem item = null;
            try
            {
                item = items.Item(parts[0]);
            }
            catch { }

            if (item == null)
            {
                if (parts.Length == 1)
                {
                    return items.AddFromFile(Path.Combine(GetProjectDirectory(), fullPath));
                }

                ProjectItem newItem = items.AddFolder(parts[0]);
                newParts = new string[parts.Length - 1];
                Array.Copy(parts, 1, newParts, 0, parts.Length - 1);
                return AddExistingItem(fullPath, newItem.ProjectItems, newParts);
            }
            else if (parts.Length == 1)
            {
                return item;
            }

            newParts = new string[parts.Length - 1];
            Array.Copy(parts, 1, newParts, 0, parts.Length - 1);
            return AddExistingItem(fullPath, item.ProjectItems, newParts);
        }
        private void UpdateWebApiConfig()
        {
            string path = GetLocalFilePathFromProject(@"App_Start", "WebApiConfig.cs");
            string pattern = @"public static void Register\(HttpConfiguration config\)\s*\r\n\s*\{[ \f\t\v]*";
            string markComment = @"WebApiConfig.cs, Register()";
            string insertText =
                "            config.Routes.MapHttpRoute(\r\n" +
                "                name: \"MobilizerManagerAPI\",\r\n" +
                "                routeTemplate: \"api/{controller}/{action}/{id}\",\r\n" +
                "                defaults: new { id = RouteParameter.Optional },\r\n" +
                "                constraints: new { controller = \"ReportManager\" }\r\n" +
                "            );\r\n" +
                "\r\n" +
                "            config.Routes.MapHttpRoute(\r\n" +
                "                name: \"MobilizerViewerAPI\",\r\n" +
                "                routeTemplate: \"api/{controller}/{action}/{id}\",\r\n" +
                "                defaults: new { id = RouteParameter.Optional },\r\n" +
                "                constraints: new { controller = \"ReportViewer\" }\r\n" +
                "            );\r\n";

            AutomaticEditInsert(path, pattern, markComment, insertText);
        }
        private void UpdateGlobal()
        {
            string path = GetLocalFilePathFromProject(@"\", "Global.asax.cs");
            string pattern = @"void Application_Start\(.*\)\s*\r\n\s*\{[ \f\t\v]*";

            // WebApiConfig
            string markComment1 = @"Global.asax.cs, Application_Start() - WebApiConfig";
            string searchText1 = @"WebApiConfig.Register";
            string insertText1 = "            WebApiConfig.Register(System.Web.Http.GlobalConfiguration.Configuration);\r\n";
            AutomaticEditInsert(path, pattern, markComment1, insertText1, searchText1);

            // FilterConfig
            string markComment2 = @"Global.asax.cs, Application_Start() - FilterConfig";
            string searchText2 = @"FilterConfig.RegisterGlobalFilters";
            string insertText2 = "            FilterConfig.RegisterGlobalFilters(System.Web.Mvc.GlobalFilters.Filters);\r\n";

            AutomaticEditInsert(path, pattern, markComment2, insertText2, searchText2);
        }
        private bool isUseIntegratedSecurityForSQL()
        {
            return String.Compare(UseIntegratedSecurityForSQL, "true", true) == 0;
        }
        private bool isUseMobilizerDB()
        {
            return String.Compare(UseMobilizerDB, "true", true) == 0;
        }
        private Boolean UpdateDBSchema()
        {
            WriteVerbose("Start UpdateDBSchema()");

            if (!isUseMobilizerDB())
            {
                WriteVerbose("Skipped because UseMobilizerDB is set to false");
                WriteVerbose("End UpdateDBSchema()");
                return true;
            }

            if (isSchemaUpToDate())
            {
                WriteVerbose("DB Schema is already up to date");
                return true;
            }

            string userNamePrompt = "User Name";
            string passwordPrompt = "Password";

            // Create the collection of field descriptions for the Prompt class
            var descriptions = new System.Collections.ObjectModel.Collection<System.Management.Automation.Host.FieldDescription>();
            System.Management.Automation.Host.FieldDescription description;

            description = new System.Management.Automation.Host.FieldDescription(userNamePrompt);
            description.HelpMessage = "Login User Name (must have DBO permission)";
            descriptions.Add(description);

            description = new System.Management.Automation.Host.FieldDescription(passwordPrompt);
            description.SetParameterType(Type.GetType("System.Security.SecureString"));
            description.HelpMessage = "Password";
            descriptions.Add(description);

            description = new System.Management.Automation.Host.FieldDescription(authenticationPrompt);
            description.HelpMessage = authenticationHelp;
            descriptions.Add(description);

            // Prompt the user and assign the values
            string userName = null;
            SecureString securePassword = new SecureString();
            string SQLIntegration = null;

            string title = "Update Forerunner DB Schema, data source: '" + ReportServerDataSource + "', DB Name: '" + ReportServerDB + "'";
            var results = Host.UI.Prompt(title, null, descriptions);
            AssignResult(ref userName, userNamePrompt, results);
            securePassword = (SecureString)results[passwordPrompt].BaseObject;
            string password = GetStringFromSecureString(securePassword);
            AssignResult(ref SQLIntegration, authenticationPrompt, results);
            bool isSQLIntegration = String.Compare(SQLIntegration, "true", true) == 0 ||
                                    String.Compare(SQLIntegration, "yes", true) == 0 ||
                                    String.Compare(SQLIntegration, "on", true) == 0; ;

            string domainName = null;
            if (isSQLIntegration)
            {
                var domainDescriptions = new System.Collections.ObjectModel.Collection<System.Management.Automation.Host.FieldDescription>();
                System.Management.Automation.Host.FieldDescription domainDescription;

                domainDescription = new System.Management.Automation.Host.FieldDescription("domain");
                domainDescription.HelpMessage = "Server where the Forerunner DB resides";
                domainDescriptions.Add(domainDescription);
                var domainResults = Host.UI.Prompt(null, null, domainDescriptions);
                AssignResult(ref domainName, "domain", domainResults);
            }

            string result = "";
            SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
            builder.DataSource = ReportServerDataSource;
            builder.InitialCatalog = ReportServerDB;
            if (!isSQLIntegration)
            {
                builder.UserID = userName;
                builder.Password = password;
            }
            else
            {
                builder.IntegratedSecurity = true;
            }

            System.Text.StringBuilder errorMessage = new System.Text.StringBuilder();
            result = ConfigToolHelper.UpdateSchema(builder.ConnectionString, userName, domainName, password, isSQLIntegration);

            if (!StaticMessages.testSuccess.Equals(result))
            {
                ErrorRecord errorRecord = new ErrorRecord(new Exception(result), result, ErrorCategory.InvalidArgument, null);
                WriteError(errorRecord);
                WriteVerbose("End UpdateDBSchema() - " + result);
                return false;
            }

            WriteVerbose("DB Schema updated");
            WriteVerbose("End UpdateDBSchema() - " + result);
            return true;
        }
        private bool isSchemaUpToDate()
        {
            SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
            builder.DataSource = ReportServerDataSource;
            builder.InitialCatalog = ReportServerDB;
            string password = GetStringFromSecureString(ReportServerDBPWD);
            if (!isUseIntegratedSecurityForSQL())
            {
                builder.UserID = ReportServerDBUser;
                builder.Password = password;
            }
            else
            {
                builder.IntegratedSecurity = true;
            }

            try
            {
                return ConfigToolHelper.CheckSchema(builder.ConnectionString, ReportServerDBUser, ReportServerDBDomain, password, isUseIntegratedSecurityForSQL());
            }
            catch (Exception e)
            {
                WriteWarning(String.Format("Warning - isSchemaUpToDate() failed, Database connection failed, user: {0}, error: {1}", ReportServerDBUser, e.Message));
            }
            return false;
        }
        private bool AutomaticEditInsert(string path, string pattern, string markComment, string insertText, string searchText = null)
        {
            if (path == null || !File.Exists(path))
            {
                WriteWarning("Warning - File: " + path + ", not found");
                return false;
            }

            // Read the file into a string
            string fileText = File.ReadAllText(path);

            // See if we have already made the automatic edit to this file
            if (fileText.IndexOf(markComment) != -1 ||
                (searchText != null) && fileText.IndexOf(searchText) != -1)
            {
                // The mark text is already in the file so we are done
                return true;
            }

            // Do the automatic insert
            Regex regex = new Regex(pattern);
            Match match = regex.Match(fileText);

            if (!match.Success)
            {
                throw (new Exception("Search pattern: " + pattern + " not found in file: " + path));
            }

            var sb = new StringBuilder();
            sb.Append(fileText.Substring(0, match.Index + match.Length));
            sb.Append("\r\n" +
                      "            // Set-FRConfig, Automatic edit start: " + markComment + "\r\n" +
                      "            // Keep the comment above and Set-FRConfig will not change this edit again\r\n");
            sb.Append(insertText);
            sb.Append("            // Set-FRConfig, Automatic edit end: " + markComment + "\r\n");
            sb.Append(fileText.Substring(match.Index + match.Length));

            // Save the file back
            File.WriteAllText(path, sb.ToString());
            return true;
        }
        private void AddPrompt(string name, string currentValue, string helpMessage, ref System.Collections.ObjectModel.Collection<System.Management.Automation.Host.FieldDescription> descriptions, out string prompt)
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
        private void PromptForMissingParameters()
        {
            var descriptions = new System.Collections.ObjectModel.Collection<System.Management.Automation.Host.FieldDescription>();

            // LicenseKey
            string LicenseKeyPrompt = "";
            if ((LicenseKey == null || LicenseKey.Length == 0) && !SkipLicenseCheck.IsPresent)
            {
                needsActivation = true;
                AddPrompt("LicenseKey", LicenseKey, @"Activation License Key (https://www.forerunnersw.com/registerTrial)", ref descriptions, out LicenseKeyPrompt);
            }

            // DefaultUserDomain
            string userDomain = Environment.GetEnvironmentVariable("USERDOMAIN");
            if ((DefaultUserDomain == null || DefaultUserDomain.Length == 0) &&
                (userDomain != null && userDomain.Length > 0))
            {
                DefaultUserDomain = userDomain;
            }

            // ReportServerWSUrl
            string ReportServerWSUrlPrompt;
            AddPrompt("ReportServerWSUrl", ReportServerWSUrl, "Reporting Services Web Service URL", ref descriptions, out ReportServerWSUrlPrompt);

            // Prompt strings
            string ReportServerDBUserPrompt = "";
            string ReportServerDBPWDPrompt = "ReportServerDBPWD";
            string UseIntegratedSecurityForSQLPrompt = "";
            string ReportServerDataSourcePrompt = "";
            string ReportServerDBPrompt = "";

            if (isUseMobilizerDB())
            {
                // ReportServerDataSource
                AddPrompt("ReportServerDataSource", ReportServerDataSource, "Database login user name", ref descriptions, out ReportServerDataSourcePrompt);

                // UseIntegratedSecurityForSQL
                AddPrompt("UseIntegratedSecurityForSQL", UseIntegratedSecurityForSQL, authenticationHelp, ref descriptions, out UseIntegratedSecurityForSQLPrompt);

                // ReportServerDBUser
                AddPrompt("ReportServerDBUser", ReportServerDBUser, "Database login user name", ref descriptions, out ReportServerDBUserPrompt);

                // ReportServerDBPWD
                var description = new System.Management.Automation.Host.FieldDescription(ReportServerDBPWDPrompt);
                description.SetParameterType(Type.GetType("System.Security.SecureString"));
                description.HelpMessage = "Database login password";
                descriptions.Add(description);

                // ReportServerDB
                AddPrompt("ReportServerDB", ReportServerDB, "Report Server DB Name", ref descriptions, out ReportServerDBPrompt);
            }

            Dictionary <string, PSObject> results = null;
            if (descriptions.Count > 0)
            {
                results = Host.UI.Prompt(null, null, descriptions);
                AssignResult(ref _licenseKey, LicenseKeyPrompt, results);
                AssignResult(ref _reportServerWSUrl, ReportServerWSUrlPrompt, results);
                AssignResult(ref _reportServerDataSource, ReportServerDataSourcePrompt, results);
                AssignResult(ref _useIntegratedSecurityForSQL, UseIntegratedSecurityForSQLPrompt, results);
                AssignResult(ref _reportServerDBUser, ReportServerDBUserPrompt, results);
                AssignResult(ref _reportServerDB, ReportServerDBPrompt, results);

                // The password is always a different pattern than the rest
                PSObject value = null;
                bool hasValue = results.TryGetValue(ReportServerDBPWDPrompt, out value);
                if (hasValue)
                {
                    ReportServerDBPWD = (System.Security.SecureString)results[ReportServerDBPWDPrompt].BaseObject;
                }

                string ReportServerDBDomainPrompt = "ReportServerDBDomain";
                if (isUseIntegratedSecurityForSQL() && isUseMobilizerDB())
                {
                    descriptions.Clear();
                    if ((ReportServerDBDomain == null || ReportServerDBDomain.Length == 0) &&
                        (userDomain != null && userDomain.Length > 0))
                    {
                        ReportServerDBDomain = userDomain;
                    }
                    AddPrompt("ReportServerDBDomain", ReportServerDBDomain, "Reporting Server DB domain", ref descriptions, out ReportServerDBDomainPrompt);

                    results.Clear();
                    results = Host.UI.Prompt(null, null, descriptions);
                    AssignResult(ref _reportServerDBDomain, ReportServerDBDomainPrompt, results);
                }
            }
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
        private static readonly string forerunnerPrefix = "Forerunner.";
        private string GetForerunnerSetting(string name)
        {
            string key = forerunnerPrefix + name;
            if (appConfig.AppSettings.Settings[key] != null)
            {
                return appConfig.AppSettings.Settings[key].Value;
            }

            return null;
        }
        private void SetForerunnerSetting(string name, string value)
        {
            string fullName = forerunnerPrefix + name;
            appConfig.AppSettings.Settings.Remove(fullName);
            appConfig.AppSettings.Settings.Add(fullName, value);
        }
        private void AssignResult(ref string prop, string resultsKey, Dictionary<string, PSObject> results)
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
        private void AssignForerunnerSetting(ref string prop, string name, string defaultValue = null)
        {
            if (prop != null && prop.Length > 0)
            {
                // Always take parameters that are specified on the command line
                return;
            }

            var value = GetForerunnerSetting(name);
            if (value != null && value.Length > 0)
            {
                // Take the value from the given web.config file (app settings)
                prop = value;
                return;
            }

            // Otherwise assign the default value (or null)
            prop = defaultValue;
        }
        private void CheckTargetFramework()
        {
            WriteVerbose("Start CheckTargetFramework()");

            if (WebConfigPath != null)
            {
                WriteVerbose("Skipping CheckTargetFramework() because -WebConfigPath is defined");
                WriteVerbose("end CheckTargetFramework()");
                return;
            }

            const uint net45 = 0x40005;
            Project project = GetProject();
            if (project == null)
            {
                return;
            }

            Properties properties = (Properties)project.Properties;
            Property targetFramework = properties.Item("TargetFramework");
            uint value = targetFramework.Value;
            if (value < net45)
            {
                WriteWarning("Warning - The Target framework for ForerunnerSDK must be at least .Net Framework 4.5");
            }

            WriteVerbose("End CheckTargetFramework()");
        }
        private Project GetProject()
        {
            string prjKindCSharpProject = "{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}";
            var dte = (DTE2)GetVariableValue("DTE");
            if (dte == null)
            {
                return null;
            }
            Project project = null;
            var solution = (Solution)dte.Solution;
            var solutionProjects = (Projects)solution.Projects;

            // If we don't have the project name, try to heuristically get the project
            foreach (Project p in solutionProjects)
            {
                if (ProjectName != null)
                {
                    if (String.Compare(ProjectName, p.Name, true) == 0)
                    {
                        project = p;
                        break;
                    }
                }
                else if (prjKindCSharpProject == p.Kind)
                {
                    if (project != null)
                    {
                        throw new Exception("Unable to determine which project you want configured. Use the -ProjectName switch");
                    }
                    project = p;
                }
            }

            return project;
        }
        private string GetLocalFilePathFromProject(string projectRelativePath, string filename)
        {
            Project project = GetProject();
            if (project == null)
            {
                if (ProjectName != null)
                {
                    throw new Exception("The given -ProjectName: " + ProjectName + " doesn't exist in the solution");
                }
                throw new Exception("Unable to determine which project you want configured. Use the -ProjectName switch");
            }

            var projectItems = (ProjectItems)project.ProjectItems;
            string fullPath = GetFullPath(project.FullName, projectRelativePath, filename);
            ProjectItem projectItem = GetProjectItem(projectItems, fullPath);
            if (projectItem == null)
            {
                return null;
            }
            var properties = (Properties)projectItem.Properties;
            var property = (Property)properties.Item("LocalPath");
            return property.Value;
        }
        private string GetFullPath(string projectFullName, string projectRelativePath, string filename)
        {
            int index = projectFullName.LastIndexOf(@"\");
            string path = projectRelativePath.Substring(0, 1) == @"\" ? projectRelativePath : @"\" + projectRelativePath;
            return Path.Combine(projectFullName.Substring(0, index) + path, filename);
        }
        private ProjectItem GetProjectItem(ProjectItems items, string fullPath)
        {
            foreach (ProjectItem item in items)
            {
                string itemFullPath = item.Properties.Item("FullPath").Value;
                if (String.Compare(itemFullPath, fullPath, true) == 0)
                {
                    return item;
                }

                ProjectItems items2 = item.ProjectItems;
                if (items2 != null && items2.Count > 0)
                {
                    ProjectItem item2 = GetProjectItem(items2, fullPath);
                    if (item2 != null)
                    {
                        return item2;
                    }
                }
            }
            return null;
        }
        private void LoadWebConfig()
        {
            string webConfigPath = WebConfigPath;
            if (webConfigPath == null)
            {
                webConfigPath = GetLocalFilePathFromProject(@"\", "web.config");
                if (webConfigPath == null)
                {
                    throw (new Exception("Error - Unable to find file: web.config, try setting -WebConfigPath"));
                }
            }
            System.Configuration.ExeConfigurationFileMap configFileMap = new System.Configuration.ExeConfigurationFileMap();
            configFileMap.ExeConfigFilename = webConfigPath;
            appConfig = System.Configuration.ConfigurationManager.OpenMappedExeConfiguration(configFileMap, System.Configuration.ConfigurationUserLevel.None);

            AssignForerunnerSetting(ref _reportServerWSUrl, "ReportServerWSUrl", "http://localhost/ReportServer");
            AssignForerunnerSetting(ref _reportServerDataSource, "ReportServerDataSource", ".");
            AssignForerunnerSetting(ref _reportServerDB, "ReportServerDB", "ReportServer");
            AssignForerunnerSetting(ref _reportServerDBDomain, "ReportServerDBDomain");
            AssignForerunnerSetting(ref _reportServerDBUser, "ReportServerDBUser");
            AssignForerunnerSetting(ref _useIntegratedSecurityForSQL, "UseIntegratedSecurityForSQL");
            AssignForerunnerSetting(ref _useMobilizerDB, "UseMobilizerDB", "false");
            AssignForerunnerSetting(ref _seperateDB, "SeperateDB", "false");
            AssignForerunnerSetting(ref _isNative, "IsNative", "true");
            AssignForerunnerSetting(ref _sharePointHost, "SharePointHost");
            AssignForerunnerSetting(ref _defaultUserDomain, "DefaultUserDomain");

            // The password is a different pattern
            string password = GetForerunnerSetting("ReportServerDBPWD");
            if (password != null)
            {
                var decrypted = Forerunner.SSRS.Security.Encryption.Decrypt(password);
                ReportServerDBPWD = new SecureString();
                foreach (char ch in decrypted)
                {
                    ReportServerDBPWD.AppendChar(ch);
                }
            }
        }

        // Private Data
        //
        private System.Configuration.Configuration appConfig { get; set; }
        private bool needsActivation = false;
        private const string authenticationPrompt = "Use Integrated Security For SQL (return = false)";
        private const string authenticationHelp = "true = domain authentication, false = SQL";

        #endregion  // Private methods

    }  // class GetFRConfigTool
}  // namespace Forerunner.SDK.ConfigTool
