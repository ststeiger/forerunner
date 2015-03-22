using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security;
using System.Data.SqlClient;
using System.Runtime.InteropServices;
using System.Management.Automation;
using System.Configuration;

using ReportMannagerConfigTool;
using ForerunnerLicense;

namespace Forerunner.SDK.ConfigTool
{
    [Cmdlet(VerbsCommon.Get, "FRConfigTool")]
    public class GetFRConfigTool : PSCmdlet
    {
        public GetFRConfigTool()
        {
            LoadWebConfig();
            LicenseData data = ClientLicense.GetLicense();
            if (data != null)
            {
                LicenseKey = data.LicenseKey;
            }
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
        private string _isNative = "true";
        [Parameter(HelpMessage = "'true' = native, 'false' = Power Point")]
        [Alias("n")]
        public string IsNative
        {
            get { return _isNative; }
            set { _isNative = value; }
        }

        // <add key="Forerunner.SharePointHost" value="" />
        private string _sharePointHost = "";
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
        private string _reportServerWSUrl = "http://localhost/ReportServer";
        [Parameter(HelpMessage = "Report Server URL")]
        [Alias("ssrs")]
        public string ReportServerWSUrl
        {
            get { return _reportServerWSUrl; }
            set { _reportServerWSUrl = value; }
        }

        // <add key="Forerunner.ReportServerDataSource" value="." />
        private string _reportServerDataSource = ".";
        [Parameter(HelpMessage = "Report Server data source")]
        [Alias("ds")]
        public string ReportServerDataSource
        {
            get { return _reportServerDataSource; }
            set { _reportServerDataSource = value; }
        }

        // <add key="Forerunner.UseIntegratedSecurityForSQL" value="true" />
        private string _useIntegratedSecurityForSQL = "true";
        [Parameter(HelpMessage = "Use integrated SQL security")]
        [Alias("is")]
        public string UseIntegratedSecurityForSQL
        {
            get { return _useIntegratedSecurityForSQL; }
            set { _useIntegratedSecurityForSQL = value; }
        }

        // <add key="Forerunner.ReportServerDB" value="ReportServer" />
        private string _reportServerDB = "ReportServer";
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
        private string _reportServerDBDomain = "";
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

        private SwitchParameter _skipProcessing;
        [Parameter(HelpMessage = "Skips all update and validation code")]
        [Alias("skip")]
        public SwitchParameter SkipProcessing
        {
            get
            {
                return _skipProcessing;
            }
            set
            {
                _skipProcessing = value;
            }
        }

        private SwitchParameter _resetPassword;
        [Parameter(HelpMessage = "Forces a re-prompt for the ReportServerDBPWD value")]
        [Alias("reset")]
        public SwitchParameter ResetPassword
        {
            get
            {
                return _resetPassword;
            }
            set
            {
                _resetPassword = value;
            }
        }

        #endregion // Parameter properties / definitions

        #region Public methods

        public Boolean TestConnection()
        {
            WriteVerbose("Start TestConnection()");

            SqlConnectionStringBuilder builder = new SqlConnectionStringBuilder();
            builder.DataSource = ReportServerDataSource;
            builder.InitialCatalog = ReportServerDB;
            bool useSQLSecurity = String.Compare(UseIntegratedSecurityForSQL, "true", true) == 0;
            bool isNative = String.Compare(IsNative, "true", true) == 0;
            string dbServerPWD = GetStringFromSecureString(ReportServerDBPWD);
            if (useSQLSecurity)
            {
                builder.UserID = ReportServerDBUser;
                builder.Password = dbServerPWD;
            }
            else
            {
                builder.IntegratedSecurity = true;
            }

            System.Text.StringBuilder errorMessage = new System.Text.StringBuilder();
            string result;

            //Test database connection
            if (!useSQLSecurity)
                result = ConfigToolHelper.tryConnectDBIntegrated(builder.ConnectionString, ReportServerDBUser, ReportServerDBDomain, dbServerPWD);
            else
                result = ConfigToolHelper.tryConnectDB(builder.ConnectionString);

            if (!StaticMessages.testSuccess.Equals(result))
            {
                errorMessage.AppendLine(result);
                errorMessage.AppendLine();
            }

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
        public Boolean ActivateLicense()
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
        public Boolean UpdateWebConfig()
        {
            WriteVerbose("Start UpdateWebConfig()");

            SetForerunnerSetting("IsNative", IsNative);
            SetForerunnerSetting("SharePointHost", SharePointHost);
            SetForerunnerSetting("DefaultUserDomain", DefaultUserDomain);
            SetForerunnerSetting("ReportServerWSUrl", ReportServerWSUrl);
            SetForerunnerSetting("ReportServerDataSource", ReportServerDataSource);
            SetForerunnerSetting("UseIntegratedSecurityForSQL", UseIntegratedSecurityForSQL);
            SetForerunnerSetting("ReportServerDB", ReportServerDB);
            SetForerunnerSetting("ReportServerDBUser", ReportServerDBUser);

            // Need to get and set the encrypted value here
            string password = GetStringFromSecureString(ReportServerDBPWD);
            string encryptedPWD = Forerunner.SSRS.Security.Encryption.Encrypt(password);
            SetForerunnerSetting("ReportServerDBPWD", encryptedPWD);

            SetForerunnerSetting("ReportServerDBDomain", ReportServerDBDomain);
            SetForerunnerSetting("ReportServerTimeout", ReportServerTimeout);
            SetForerunnerSetting("IgnoreSSLErrors", IgnoreSSLErrors);
            SetForerunnerSetting("QueueThumbnails", QueueThumbnails);
            SetForerunnerSetting("MobilizerSettingPath", MobilizerSettingPath);
            SetForerunnerSetting("VersionPath", VersionPath);

            WriteVerbose("Saving Forerunner specific web.config settings");
            appConfig.Save();

            WriteVerbose("End UpdateWebConfig()");
            return true;
        }
        public Boolean UpdateDBSchema()
        {
            string userNamePrompt = "User Name";
            string passwordPrompt = "Password";
            string authenticationTypePrompt = "Use Integrated Security For SQL";

            WriteVerbose("Start UpdateDBSchema()");

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

            description = new System.Management.Automation.Host.FieldDescription(authenticationTypePrompt);
            description.HelpMessage = "true = SQL, false  domain";
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
            AssignResult(ref SQLIntegration, authenticationTypePrompt, results);
            bool isSQLAuthentication = String.Compare(SQLIntegration, "true", true) == 0 || String.Compare(SQLIntegration, "on", true) == 0;

            string domainName = null;
            if (!isSQLAuthentication)
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
            if (isSQLAuthentication)
            {
                builder.UserID = userName;
                builder.Password = password;
            }
            else
            {
                builder.IntegratedSecurity = true;
            }

            System.Text.StringBuilder errorMessage = new System.Text.StringBuilder();
            result = ConfigToolHelper.UpdateSchema(builder.ConnectionString, userName, domainName, password, !isSQLAuthentication);

            if (!StaticMessages.testSuccess.Equals(result))
            {
                ErrorRecord errorRecord = new ErrorRecord(new Exception(result), result, ErrorCategory.InvalidArgument, null);
                WriteError(errorRecord);
                WriteVerbose("End UpdateDBSchema() - " + result);
                return false;
            }

            WriteVerbose("End UpdateDBSchema() - " + result);
            return true;
        }

        #endregion  // Public methods

        #region Processing methods

        protected override void BeginProcessing()
        {
            var descriptions = new System.Collections.ObjectModel.Collection<System.Management.Automation.Host.FieldDescription>();

            if (DefaultUserDomain == null)
            {
                var description = new System.Management.Automation.Host.FieldDescription("DefaultUserDomain");
                description.HelpMessage = "Reporting Services default user login domain";
                descriptions.Add(description);
            }

            if (ReportServerDBUser == null)
            {
                var description = new System.Management.Automation.Host.FieldDescription("ReportServerDBUser");
                description.HelpMessage = "Database login user name";
                descriptions.Add(description);
            }

            if (ReportServerDBPWD == null || ResetPassword)
            {
                ReportServerDBPWD = null;
                var description = new System.Management.Automation.Host.FieldDescription("ReportServerDBPWD");
                description.SetParameterType(Type.GetType("System.Security.SecureString"));
                description.HelpMessage = "Database login password";
                descriptions.Add(description);
            }

            if (LicenseKey == null)
            {
                needsActivation = true;

                var description = new System.Management.Automation.Host.FieldDescription("LicenseKey");
                description.HelpMessage = @"Activation License Key (https://www.forerunnersw.com/registerTrial)";
                descriptions.Add(description);
            }

            if (descriptions.Count > 0)
            {
                var results = Host.UI.Prompt(null, null, descriptions);
                AssignResult(ref _defaultUserDomain, "DefaultUserDomain", results);
                AssignResult(ref _reportServerDBUser, "ReportServerDBUser", results);
                AssignResult(ref _licenseKey, "LicenseKey", results);

                if (ReportServerDBPWD == null)
                {
                    // The password is always a different pattern than the rest
                    ReportServerDBPWD = (System.Security.SecureString)results["ReportServerDBPWD"].BaseObject;
                }
            }
        }
        protected override void ProcessRecord()
        {
            if (!SkipProcessing)
            {
                int processingId = 1;
                string activity = "Updating Forerunner Configuration Settings";
                WriteProgress(new ProgressRecord(processingId, activity, "TestConnection()"));
                TestConnection();

                WriteProgress(new ProgressRecord(processingId, activity, "ActivateLicense()"));
                ActivateLicense();

                WriteProgress(new ProgressRecord(processingId, activity, "UpdateWebConfig()"));
                UpdateWebConfig();

                WriteProgress(new ProgressRecord(processingId, activity, "UpdateDBSchema()"));
                UpdateDBSchema();
            }

            // Return this (I.e., the FRConfigTool) to the pipeline this will enable the user to
            // call individual public methods such as ActivateLicense()
            WriteObject(this);
        }
        protected override void EndProcessing()
        {
            base.EndProcessing();
        }

        #endregion // Processing methods

        #region Private methods and data

        // Private Methods
        //
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
            if (prop != null)
            {
                return;
            }

            prop = (string)results[resultsKey].BaseObject;
        }
        private void AssignForerunnerSetting(ref string prop, string name)
        {
            var value = GetForerunnerSetting(name);
            if (value != null)
            {
                prop = value;
            }
        }
        private void LoadWebConfig()
        {
            // TODO
            // Make this hard coded path, conditional when run as a Package Manager Tool, I need
            // to actually get the web.config path from the DTE object
            string webConfigPath = @"C:\Users\Jon\Documents\GitHub\Release\RS\Reporting\ReportManager\ReportManagerMVC\Forerunner.SDK.ConfigTool\Web.config";
            ExeConfigurationFileMap configFileMap = new ExeConfigurationFileMap();
            configFileMap.ExeConfigFilename = webConfigPath;
            appConfig = ConfigurationManager.OpenMappedExeConfiguration(configFileMap, ConfigurationUserLevel.None);

            AssignForerunnerSetting(ref _reportServerWSUrl, "ReportServerWSUrl");
            AssignForerunnerSetting(ref _reportServerDataSource, "ReportServerDataSource");
            AssignForerunnerSetting(ref _reportServerDB, "ReportServerDB");
            AssignForerunnerSetting(ref _reportServerDBDomain, "ReportServerDBDomain");
            AssignForerunnerSetting(ref _reportServerDBUser, "ReportServerDBUser");
            AssignForerunnerSetting(ref _useIntegratedSecurityForSQL, "UseIntegratedSecurityForSQL");
            AssignForerunnerSetting(ref _isNative, "IsNative");
            AssignForerunnerSetting(ref _sharePointHost, "SharePointHost");
            AssignForerunnerSetting(ref _defaultUserDomain, "DefaultUserDomain");

            // The password is a different pattern
            string password = GetForerunnerSetting("ReportServerDBPWD");
            if (password != null)
            {
                var descripted = Forerunner.SSRS.Security.Encryption.Decrypt(password);
                ReportServerDBPWD = new SecureString();
                foreach (char ch in descripted)
                {
                    ReportServerDBPWD.AppendChar(ch);
                }
            }
        }

        // Private Data
        //
        private Configuration appConfig { get; set; }
        private bool needsActivation = false;

        #endregion  // Private methods

    }  // class GetFRConfigTool
}  // namespace Forerunner.SDK.ConfigTool
