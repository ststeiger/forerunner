using System;
using System.Net;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Linq;
using System.Text;
using System.IO;
using Forerunner.JSONWriter;
using Forerunner.SSRS.Execution;
using ForerunnerLicense;
using System.Configuration;
using Forerunner.SSRS.Viewer;
using Forerunner.SSRS.Manager;
using Forerunner.Config;
using Forerunner.Logging;
using Management = Forerunner.SSRS.Management;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Globalization;

namespace Forerunner
{
    public enum ReportServerProtocalEnum { HTTP, HTTPS };
    public class Credentials
    {
        public enum SecurityTypeEnum { Network = 0, Custom = 1, Integrated = 2 };
        public SecurityTypeEnum SecurityType = SecurityTypeEnum.Network;
        public string UserName;
        public string Domain;
        public string Password;
        public bool encrypted;

        public Credentials()
        {
            this.encrypted = true;
        }
        public Credentials(SecurityTypeEnum SecurityType = SecurityTypeEnum.Network, String UserName = "", string Domain = "", string Password = "", bool encrypted = true)
        {
            this.SecurityType = SecurityType;
            this.UserName = UserName;
            this.Password = Password;
            this.Domain = Domain;
            this.encrypted = encrypted;
        }

        public string GetDomainUser()
        {
            if (this.Domain.Length > 15)
                return this.Domain.Substring(0, 15).ToUpper() + "\\" + this.UserName;
            else
                return this.Domain.ToUpper() + "\\" + this.UserName;
        }


    }

    public static class ForerunnerUtil
    {
        static private bool IgnoreSSLErrors = ForerunnerUtil.GetAppSetting("Forerunner.IgnoreSSLErrors", false);
        static private bool CheckSSL = false;

        static public void CheckSSLConfig()
        {
            if (!CheckSSL)
            {
                CheckSSL = true;
                if (IgnoreSSLErrors)
                    ServicePointManager.ServerCertificateValidationCallback += (sender, certificate, chain, sslPolicyErrors) => true;
            }
        }

        static public bool GetAppSetting(string key, bool defaultValue)
        {
            string value = ConfigurationManager.AppSettings[key];
            return (value == null) ? defaultValue : String.Equals("true", value.ToLower());
        }

        static public int GetAppSetting(string key, int defaultValue)
        {
            string value = ConfigurationManager.AppSettings[key];
            return (value == null) ? defaultValue : int.Parse(value);
        }

        static public ReportViewer GetReportViewerInstance(string instance, string url, int ReportServerTimeout, WebConfigSection webConfigSection)
        {
            ConfigElement configElement = null;
            if (webConfigSection != null && instance != null)
            {
                Forerunner.Config.ConfigElementCollection configElementCollection = webConfigSection.InstanceCollection;
                if (configElementCollection != null)
                {
                    configElement = configElementCollection.GetElementByKey(instance);
                }
            }
            //Put application security here
            if (configElement == null)
                return new ReportViewer(url, ReportServerTimeout);
            else
                return new ReportViewer(configElement.ReportServerWSUrl, configElement.ReportServerTimeout);
        }

        private static void validateReportServerDB(String reportServerDataSource, string reportServerDB, string reportServerDBUser, string reportServerDBPWD, string reportServerDBDomain, bool useIntegratedSecuritForSQL)
        {
            Credentials dbCred;
            if (useIntegratedSecuritForSQL)
                dbCred = new Credentials(Credentials.SecurityTypeEnum.Integrated, reportServerDBUser, reportServerDBDomain == null ? "" : reportServerDBDomain, reportServerDBPWD);
            else
                dbCred = new Credentials(Credentials.SecurityTypeEnum.Custom, reportServerDBUser, reportServerDBDomain == null ? "" : reportServerDBDomain, reportServerDBPWD);

            if (Forerunner.SSRS.Manager.ReportManager.ValidateConfig(reportServerDataSource, reportServerDB, dbCred, useIntegratedSecuritForSQL))
            {
                Logger.Trace(LogType.Info, "Validation of the report server database succeeded.");
            }
            else
            {
                Logger.Trace(LogType.Error, "Validation of the report server database  failed.");
            }
        }

        public static ReportManager GetReportManagerInstance(string instance, string url, bool IsNativeRS, string DefaultUserDomain, string SharePointHostName, string ReportServerDataSource, string ReportServerDB, string ReportServerDBUser, string ReportServerDBPWD, string ReportServerDBDomain, bool useIntegratedSecurity, WebConfigSection webConfigSection)
        {
            Forerunner.Config.ConfigElement configElement = null;
            if (webConfigSection != null && instance != null)
            {
                Forerunner.Config.ConfigElementCollection configElementCollection = webConfigSection.InstanceCollection;
                if (configElementCollection != null)
                {
                    configElement = configElementCollection.GetElementByKey(instance);
                }
            }
            //Put application security here
            Credentials DBCred = null;
            if (configElement == null)
            {
                if (ReportServerDataSource != null)    
                {
                    DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, ReportServerDBUser, ReportServerDBDomain == null ? "" : ReportServerDBDomain, ReportServerDBPWD);
                }
                return new Forerunner.SSRS.Manager.ReportManager(url, null, ReportServerDataSource, ReportServerDB, DBCred, useIntegratedSecurity, IsNativeRS, DefaultUserDomain, SharePointHostName);
            }
            else
            {
                if (ReportServerDataSource != null)                    
                {
                    DBCred = new Credentials(Credentials.SecurityTypeEnum.Custom, configElement.ReportServerDBUser, configElement.ReportServerDBDomain == null ? "" : configElement.ReportServerDBDomain, configElement.ReportServerDBPWD);
                }
                return new Forerunner.SSRS.Manager.ReportManager(configElement.ReportServerWSUrl, null, configElement.ReportServerDataSource, configElement.ReportServerDB, DBCred, configElement.UseIntegratedSecurityForSQL, configElement.IsNative, DefaultUserDomain, configElement.SharePointHost);
            }
            
        }

        public static void validateConfig(string ReportServerDataSource, string ReportServerDB, string ReportServerDBUser,string ReportServerDBPWD, string ReportServerDBDomain, bool useIntegratedSecurity, WebConfigSection webConfigSection)
        {
            if (ReportServerDataSource != null)
            {
                Logger.Trace(LogType.Info, "Validating the database connections for the report server db configured in the appSettings section.");
                ForerunnerUtil.validateReportServerDB(ReportServerDataSource, ReportServerDB, ReportServerDBUser, ReportServerDBPWD, ReportServerDBDomain, useIntegratedSecurity);
            }

            if (webConfigSection != null)
            {
                foreach (Forerunner.Config.ConfigElement configElement in webConfigSection.InstanceCollection)
                {
                    Logger.Trace(LogType.Info, "Validating the database connections for the report server db configured in the Forerunner section.  Instance: " + configElement.Instance);
                    ForerunnerUtil.validateReportServerDB(configElement.ReportServerDataSource, configElement.ReportServerDB, configElement.ReportServerDBUser, configElement.ReportServerDBPWD, configElement.ReportServerDBDomain, configElement.UseIntegratedSecurityForSQL);
                }
            }
        }
    }

    public static class JsonUtility
    {
        internal static ParameterValue[] GetParameterValue(string parameterList, ReportParameter[] originalParams)
        {
            List<ParameterValue> list = new List<ParameterValue>();

            using (JsonTextReader reader = new JsonTextReader(new StringReader(parameterList)))
            {
                JObject jsonObj = new JObject();
                jsonObj = JObject.Parse(parameterList);

                JArray parameterArray = jsonObj["ParamsList"] as JArray;

                if (parameterArray != null)
                {
                    foreach (JObject obj in parameterArray)
                    {
                        //if parameter use default then don't include this parameter
                        if (obj["UseDefault"] != null && obj["UseDefault"].ToString().ToLower() == "true")
                        {
                            continue;
                        }

                        string paramName = obj["Parameter"].ToString();
                        string paramType = "";
                        string isMultiple = "false";

                        if (obj["Type"] != null)
                            paramType= obj["Type"].ToString();
                        if (obj["IsMultiple"] != null)
                            isMultiple = obj["IsMultiple"].ToString();

                        //either parameter name or type not match will be skipped.
                        //for saved parameter only matched parameter will be passed to the reporting service.
                        //this will make sure saved parameter won't break the execution when report parameter change.
                        if (paramType !="" && originalParams.Where(m => m.Name == paramName && m.Type.ToString().ToLower() == paramType.ToLower()).Count() == 0)
                        {
                            continue;
                        }

                        if (isMultiple.ToLower() == "true")
                        {
                            if (obj["Value"] == null)
                            {
                                ParameterValue pv = new ParameterValue();
                                pv.Name = paramName;
                                pv.Value = GetDefaultValue(paramType);
                                list.Add(pv);
                            }
                            else
                            {
                                JArray multipleValues = obj["Value"] as JArray;
                                if (multipleValues != null)
                                {
                                    foreach (String value in multipleValues)
                                    {
                                        
                                        ParameterValue pv = new ParameterValue();
                                        pv.Name = paramName;
                                        pv.Value = value;
                                        list.Add(pv);
                                        
                                    }
                                }
                                else
                                {
                                    ParameterValue pv = new ParameterValue();
                                    pv.Name = paramName;
                                    pv.Value = null;
                                    list.Add(pv);
                                }
                            }
                        }
                        else
                        {
                            
                            ParameterValue pv = new ParameterValue();
                            pv.Name = obj["Parameter"].ToString();
                            pv.Value = obj["Value"].Type == Newtonsoft.Json.Linq.JTokenType.Null ? null : obj["Value"].ToString();
                            list.Add(pv);
                            
                        }
                    }
                }

                return list.ToArray();
            }
        }

        private static string GetDefaultValue(string type)
        {
            string value = string.Empty;
            switch (type)
            {
                case "Integer":
                    value = "0";
                    break;
                case "Text":
                    break;
                case "Boolean":
                    value = "false";
                    break;
                case "DateTime":
                    break;
                case "Float":
                    value = "0";
                    break;
            }
            return value;
        }

        //Convert property json string to devInfo in xml format
        internal static string GetPrintPDFDevInfo(string propertyString)
        {
            StringBuilder printProperty = new StringBuilder();

            if (propertyString == null || propertyString == "")
                return null;

            JObject jsonObj = new JObject();
            jsonObj = JObject.Parse(propertyString);

            JArray propertyList = jsonObj["PrintPropertyList"] as JArray;

            printProperty.Append("<DeviceInfo>");
            foreach (JObject obj in propertyList)
            {
                printProperty.Append("<");
                printProperty.Append(obj["key"].ToString());
                printProperty.Append(">");
                printProperty.Append(obj["value"].ToString());
                printProperty.Append("in");
                printProperty.Append("</");
                printProperty.Append(obj["key"].ToString());
                printProperty.Append(">");
            }
            printProperty.Append("</DeviceInfo>");

            return printProperty.ToString();
            
        }

        public static string WriteExceptionJSON(Exception e, String userName = null)
        {
            try
            {
                ExceptionLogGenerator.LogException(e);
                
                JSONTextWriter w = new JSONTextWriter();
                w.WriteStartObject();
                w.WriteMember("Exception");
                w.WriteStartObject();

                if (e is LicenseException)
                {
                    w.WriteMember("Type");
                    w.WriteString("LicenseException");
                    w.WriteMember("Reason");
                    w.WriteString(e.Data[LicenseException.failKey].ToString());
                    w.WriteMember("Message");
                    w.WriteString(e.Message);
                }
                else
                {

                    w.WriteMember("Type");
                    if (e.Message.Contains("ForerunnerLicense.LicenseException"))
                        w.WriteString("LicenseException");
                    else
                        w.WriteString(e.GetType().ToString());

                    w.WriteMember("TargetSite");
                    if (e.TargetSite != null)
                        w.WriteString(e.TargetSite.ToString());
                    else
                        w.WriteString("unknown");
                    w.WriteMember("Source");
                    w.WriteString(e.Source);
                    w.WriteMember("Message");

                    string[] split = { "--->" };
                    string[] Messages = e.Message.Split(split, StringSplitOptions.None);
                    string message = "";
                    string lastMess = "";
                    string curMess = "";
                    foreach (string mes in Messages)
                    {
                        int start = mes.IndexOf(":") + 1;
                        int end = mes.IndexOf("  at", start) - 1;

                        if (start <= 0)
                            curMess = mes;
                        else if (start > 0 && end > 0)
                            curMess = mes.Substring(start, end - start);
                        else
                            curMess = mes.Substring(start);

                        curMess = curMess.Trim(new char[] { ' ', '\n' });
                        if (curMess != lastMess)
                            message += curMess;
                        lastMess = curMess;
                    }
                    w.WriteString(message);
                    w.WriteMember("DetailMessage");
                    w.WriteString(e.Message);

                    w.WriteMember("StackTrace");
                    w.WriteString(e.StackTrace);

                    w.WriteMember("UserName");
                    w.WriteString(userName != null ? userName : "null");
                }
                w.WriteEndObject();
                w.WriteEndObject();

                return w.ToString();
            }
            catch
            {
                return "";
            }
        }

        public static string ConvertParamemterLayoutToJSON(ParametersGridLayoutDefinition Layout)
        {
            JSONTextWriter w = new JSONTextWriter();
            
            
            w.WriteStartObject();
            w.WriteMember("Rows");
            w.WriteNumber(Layout.NumberOfRows);
            w.WriteMember("Columns");
            w.WriteNumber(Layout.NumberOfColumns);

            w.WriteMember("Cells");
            w.WriteStartArray();
            foreach (ParametersGridCellDefinition Cell in Layout.CellDefinitions)
            {
                w.WriteStartObject();

                w.WriteMember("ParameterName");
                w.WriteString(Cell.ParameterName);

                w.WriteMember("Row");
                w.WriteNumber(Cell.RowIndex);

                w.WriteMember("Column");
                w.WriteNumber(Cell.ColumnsIndex);

                w.WriteEndObject();
            }
            w.WriteEndArray();
            
            
            w.WriteEndObject();

            return w.ToString();
        }

        public static string ConvertParamemterToJSON(ReportParameter [] parametersList, string SessionID, string ReportServerURL, string reportPath, int NumPages,string Layout = null)
        {
            JSONTextWriter w = new JSONTextWriter();
            bool DefaultExist = false;
            int DefaultValueCount = 0;
            w.WriteStartObject();
            w.WriteMember("SessionID");
            w.WriteString(SessionID);
            w.WriteMember("ReportServerURL");
            w.WriteString(ReportServerURL);
            w.WriteMember("ReportPath");
            w.WriteString(reportPath);
            w.WriteMember("NumPages");
            w.WriteNumber(NumPages);

            w.WriteMember("Type");
            w.WriteString("Parameters");
            w.WriteMember("Count");
            w.WriteString(parametersList.Length.ToString());

            if (Layout != null)
            {
                w.WriteMember("Layout");
                w.WriteJSON(Layout);
            }
            
            w.WriteMember("ParametersList");
            w.WriteStartArray();
            foreach (ReportParameter parameter in parametersList)
            {
                w.WriteStartObject();
                foreach (PropertyInfo proInfo in parameter.GetType().GetProperties(BindingFlags.Public | BindingFlags.Instance))
                {
                    if (!proInfo.PropertyType.IsArray)
                    {
                        w.WriteMember(proInfo.Name);
                        Object obj = proInfo.GetValue(parameter, null);

                        if (obj == null)
                            w.WriteNull();
                        else if (obj.GetType().ToString().Contains("Boolean"))
                            w.WriteBoolean(bool.Parse(obj.ToString()));
                        else
                            w.WriteString(proInfo.GetValue(parameter, null).ToString());
                    }
                }

                w.WriteMember("DefaultValues");
                if (parameter.DefaultValues != null)
                {
                    DefaultExist = true;
                    DefaultValueCount++;

                    w.WriteStartArray();
                    foreach (string item in parameter.DefaultValues)
                    {
                        if (item == null)
                            w.WriteNull();
                        else if (parameter.Type == ParameterTypeEnum.DateTime)
                        {
                            // On dates format to transfer format so clinet can display any culture
                            DateTime isoDate;
                            string lang = System.Web.HttpContext.Current.Request.Headers.Get("Accept-Language");
                            char[] seperator = { ',' };

                            if (lang == null)
                                lang = "";

                            string[] AcceptLang = lang.Split(seperator);
                            string defaultLang = CultureInfo.CurrentCulture.Name;
                            if (AcceptLang.Length > 0)
                                defaultLang = AcceptLang[0];

                            if (!DateTime.TryParse(item, CultureInfo.GetCultureInfoByIetfLanguageTag(defaultLang), System.Globalization.DateTimeStyles.None, out isoDate))
                                throw new Exception("Can not convert date from lang:" + defaultLang + " date: " + item);

                            string newDate = isoDate.ToString("O");
                            w.WriteString(newDate);
                        }
                        else
                            w.WriteString(item);
                    }
                    w.WriteEndArray();
                }
                else
                    w.WriteString("");

                w.WriteMember("Dependencies");
                if (parameter.Dependencies != null)
                {
                    w.WriteStartArray();
                    foreach (string item in parameter.Dependencies)
                    {
                        w.WriteString(item);
                    }
                    w.WriteEndArray();
                }
                else
                    w.WriteString("");

                w.WriteMember("ValidValues");
                if (parameter.ValidValues != null)
                {
                    w.WriteStartArray();
                    foreach (ValidValue item in parameter.ValidValues)
                    {
                        w.WriteStartObject();
                        //change key from 'Key' to 'label' to adapt jquery.ui auto complete
                        //change it back to Key/Value to keep same format with v1
                        w.WriteMember("Key");
                        w.WriteString(item.Label);
                        //change key from 'Value' to 'value' to adapt jquery.ui auto complete
                        w.WriteMember("Value");
                        if (item.Value == null)
                            w.WriteNull();
                        else
                            w.WriteString(item.Value);
                        w.WriteEndObject();
                    }
                    w.WriteEndArray();
                }
                else
                    w.WriteString("");
                w.WriteEndObject();
            }
            w.WriteEndArray();

            w.WriteMember("DefaultValueExist");
            if (DefaultExist)
                w.WriteBoolean(true);
            else
                w.WriteBoolean(false);

            w.WriteMember("DefaultValueCount");
            w.WriteNumber(DefaultValueCount);

            w.WriteEndObject();

            return w.ToString();
        }

        public static void ConvertDocumentMapToJSON(DocumentMapNode DocumentMap, JSONTextWriter w)
        {
            
            w.WriteMember("Label");
            w.WriteString(DocumentMap.Label);
            w.WriteMember("UniqueName");
            w.WriteString(DocumentMap.UniqueName);
            if (DocumentMap.Children != null)
            {
                w.WriteMember("Children");
                w.WriteStartArray();
                foreach (DocumentMapNode Child in DocumentMap.Children)
                {
                    w.WriteStartObject();
                    ConvertDocumentMapToJSON(Child,w);
                    w.WriteEndObject();
                }
                w.WriteEndArray();
            }

            
        }

        internal static string GetDocMapJSON(DocumentMapNode DocumentMap)
        {
            JSONTextWriter w = new JSONTextWriter();

            w.WriteStartObject();
            w.WriteMember("DocumentMap");
            w.WriteStartObject();
            JsonUtility.ConvertDocumentMapToJSON(DocumentMap,w);
            w.WriteEndObject();
            w.WriteEndObject();

            return w.ToString();
        }

        internal static string GetMimeTypeFromBytes(byte[] data)
        {
            string mime = "application/octet-stream"; //DEFAULT UNKNOWN MIME TYPE
            byte[] BMP = { 66, 77 };
            byte[] DOC = { 208, 207, 17, 224, 161, 177, 26, 225 };
            byte[] EXE_DLL = { 77, 90 };
            byte[] GIF = { 71, 73, 70, 56 };
            byte[] ICO = { 0, 0, 1, 0 };
            byte[] JPG = { 255, 216, 255 };
            byte[] MP3 = { 255, 251, 48 };
            byte[] OGG = { 79, 103, 103, 83, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0 };
            byte[] PDF = { 37, 80, 68, 70, 45, 49, 46 };
            byte[] PNG = { 137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82 };
            byte[] RAR = { 82, 97, 114, 33, 26, 7, 0 };
            byte[] SWF = { 70, 87, 83 };
            byte[] TIFF = { 73, 73, 42, 0 };
            byte[] TORRENT = { 100, 56, 58, 97, 110, 110, 111, 117, 110, 99, 101 };
            byte[] TTF = { 0, 1, 0, 0, 0 };
            byte[] WAV_AVI = { 82, 73, 70, 70 };
            byte[] WMV_WMA = { 48, 38, 178, 117, 142, 102, 207, 17, 166, 217, 0, 170, 0, 98, 206, 108 };
            byte[] ZIP_DOCX = { 80, 75, 3, 4 };
       

            //Get the MIME Type
            if (data.Take(2).SequenceEqual(BMP))
            {
                mime = "image/bmp";
            }
            else if (data.Take(8).SequenceEqual(DOC))
            {
                mime = "application/msword";
            }
            else if (data.Take(2).SequenceEqual(EXE_DLL))
            {
                mime = "application/x-msdownload"; //both use same mime type
            }
            else if (data.Take(4).SequenceEqual(GIF))
            {
                mime = "image/gif";
            }
            else if (data.Take(4).SequenceEqual(ICO))
            {
                mime = "image/x-icon";
            }
            else if (data.Take(3).SequenceEqual(JPG))
            {
                mime = "image/jpeg";
            }
            else if (data.Take(3).SequenceEqual(MP3))
            {
                mime = "audio/mpeg";
            }

            else if (data.Take(7).SequenceEqual(PDF))
            {
                mime = "application/pdf";
            }
            else if (data.Take(16).SequenceEqual(PNG))
            {
                mime = "image/png";
            }
            else if (data.Take(7).SequenceEqual(RAR))
            {
                mime = "application/x-rar-compressed";
            }
            else if (data.Take(3).SequenceEqual(SWF))
            {
                mime = "application/x-shockwave-flash";
            }
            else if (data.Take(4).SequenceEqual(TIFF))
            {
                mime = "image/tiff";
            }
            else if (data.Take(11).SequenceEqual(TORRENT))
            {
                mime = "application/x-bittorrent";
            }
            else if (data.Take(5).SequenceEqual(TTF))
            {
                mime = "application/x-font-ttf";
            }
     
            return mime;
        }

        internal static DataSourceCredentials[] GetDataSourceCredentialsFromString(string credentials)
        {
            List<DataSourceCredentials> list = new List<DataSourceCredentials>();
            using (JsonTextReader reader = new JsonTextReader(new StringReader(credentials)))
            {
                JObject jsonObj = new JObject();
                jsonObj = JObject.Parse(credentials);

                JArray credArray = jsonObj["CredentialList"] as JArray;

                foreach (JObject obj in credArray)
                {
                    DataSourceCredentials credential = new DataSourceCredentials();
                    credential.DataSourceName = obj["DataSourceID"].ToString();
                    credential.UserName = obj["Username"].ToString();
                    credential.Password = obj["Password"].ToString();

                    list.Add(credential);
                }
            }
            return list.ToArray();
        }

        internal static string GetDataSourceCredentialJSON(DataSourcePrompt[] prompts, string reportPath, string sessionID, string numPages = "1")
        {
            JSONTextWriter w = new JSONTextWriter();
            w.WriteStartObject();
            w.WriteMember("ReportPath");
            w.WriteString(reportPath);
            w.WriteMember("SessionID");
            w.WriteString(sessionID);
            w.WriteMember("NumPages");
            w.WriteNumber(int.Parse(numPages));
            w.WriteMember("CredentialsRequired");
            w.WriteBoolean(true);
            w.WriteMember("CredentialsList");
            w.WriteStartArray();
            foreach (DataSourcePrompt prompt in prompts)
            {
                w.WriteStartObject();
                w.WriteMember("DataSourceID");
                w.WriteString(prompt.DataSourceID);
                w.WriteMember("Name");
                w.WriteString(prompt.Name);
                w.WriteMember("Prompt");
                w.WriteString(prompt.Prompt);
                w.WriteEndObject();
            }
            w.WriteEndArray();
            w.WriteEndObject();

            return w.ToString();
        }

        public static string ConvertListToJSON(List<string> listOfStrings)
        {
            JSONTextWriter w = new JSONTextWriter();

            w.WriteStringArray(listOfStrings.ToArray());

            return w.ToString();
        }

        public static Management.SearchCondition[] getNativeSearchCondition(string searchCriteria)
        {
            List<Management.SearchCondition> list = new List<Management.SearchCondition>();

            JObject jsonObj = new JObject();
            jsonObj = JObject.Parse(searchCriteria);

            JArray criteriaArray = jsonObj["SearchCriteria"] as JArray;

            if (criteriaArray != null)
            {
                foreach (JObject obj in criteriaArray)
                {
                    Management.SearchCondition condition = new Management.SearchCondition();
                    //Default to search as contains
                    condition.Condition = Management.ConditionEnum.Contains;
                    condition.ConditionSpecified = true;
                    condition.Name = obj["Key"].ToString();
                    condition.Value = obj["Value"].ToString();

                    list.Add(condition);
                }
     
            }
            return list.ToArray();
            
        }

        public static string GetSearchFolderTags(string searchFolderContent)
        {
            JObject jsonObj = new JObject();
            jsonObj = JObject.Parse(searchFolderContent);
            //JsonString tags = jsonObj["tags"] as JsonString;
            return jsonObj["tags"].ToString();            
        }

        //convert json string to the Policy array
        public static Management.Policy[] GetPoliciesFromJson(string jsonStr)
        {
            List<Management.Policy> policies = new List<Management.Policy>();

           JObject jsonObj = new JObject();
           JArray  policyArray = JArray.Parse(jsonStr);

           foreach (JObject obj in policyArray)
            {
                Management.Policy policy = new Management.Policy();

                policy.GroupUserName = obj["GroupUserName"].ToString();

                JArray roleArray = obj["Roles"] as JArray;

                List<Management.Role> roleList = new List<Management.Role>();

                foreach (JObject jsonRole in roleArray)
                {
                    Management.Role role = new Management.Role();

                    role.Name = jsonRole["Name"].ToString();

                    roleList.Add(role);
                }

                policy.Roles = roleList.ToArray();

                policies.Add(policy);
            }
            

            return policies.ToArray();
        }

        public static string GetPoliciesJson(Management.Policy[] policy, bool isInheritParent)
        {
            JSONTextWriter w = new JSONTextWriter();

            w.WriteStartObject();
            w.WriteMember("isInheritParent");
            w.WriteBoolean(isInheritParent);

            w.WriteMember("policyArr");
            w.WriteStartArray();
            for (int i = 0; i < policy.Length; i++)
            {
                w.WriteStartObject();
                w.WriteMember("GroupUserName");
                w.WriteString(policy[i].GroupUserName);

                w.WriteMember("Roles");
                w.WriteStartArray();
                for (int j = 0; j < policy[i].Roles.Length; j++)
                {
                    w.WriteStartObject();
                    w.WriteMember("Name");
                    w.WriteString(policy[i].Roles[j].Name);
                    w.WriteMember("Description");
                    w.WriteString(policy[i].Roles[j].Description);
                    w.WriteEndObject();
                }
                w.WriteEndArray();

                w.WriteEndObject();
            }
            w.WriteEndArray();
            w.WriteEndObject();

            return w.ToString();
        }

        public static string GetPropertyJson(Management.Property [] properties)
        {
            JSONTextWriter w = new JSONTextWriter();

            w.WriteStartObject();
            for (int i = 0; i < properties.Length; i++)
            {
                //Handle forerunner hidden special
                if (properties[i].Name == "ForerunnerHidden")
                    w.WriteMember("Hidden");

                else
                    w.WriteMember(properties[i].Name);

                //Special case JSON property
                if (properties[i].Name == "ForerunnerRDLExt")
                    w.WriteJSON(properties[i].Value);
                else
                    w.WriteString(properties[i].Value);
            }
            w.WriteEndObject();

            return w.ToString();
        }

        public static Management.Property[] GetPropertiesList(string propertyJson)
        {
            List<Management.Property> propertyList = new List<Management.Property>();

            JArray policyArray = new JArray();
            policyArray = JArray.Parse(propertyJson);

            foreach (JObject obj in policyArray)
            {
                Management.Property property = new Management.Property();

                property.Name = obj["name"].ToString();
                property.Value = obj["value"].ToString();

                propertyList.Add(property);
            }
            

            return propertyList.ToArray();
        }
    }

    public static class MimeTypeMap
    {
        private static readonly IDictionary<string, string> _MimeToExtensionMap = new Dictionary<string, string>(StringComparer.InvariantCultureIgnoreCase);

        private static readonly IDictionary<string, string> _ExtensionToMimeMap = new Dictionary<string, string>(StringComparer.InvariantCultureIgnoreCase) {

        #region Big freaking list of mime types
        // Forerunner specific extensions here
        {".frdb", "json/forerunner-dashboard"},
        {".frsf", "json/forerunner-searchfolder"},
        {".rdl", "xml/forerunner-report"},
        // combination of values from Windows 7 Registry and 
        // from C:\Windows\System32\inetsrv\config\applicationHost.config
        // some added, including .7z and .dat
        {".323", "text/h323"},
        {".3g2", "video/3gpp2"},
        {".3gp", "video/3gpp"},
        {".3gp2", "video/3gpp2"},
        {".3gpp", "video/3gpp"},
        {".7z", "application/x-7z-compressed"},
        {".aa", "audio/audible"},
        {".AAC", "audio/aac"},
        {".aaf", "application/octet-stream"},
        {".aax", "audio/vnd.audible.aax"},
        {".ac3", "audio/ac3"},
        {".aca", "application/octet-stream"},
        {".accda", "application/msaccess.addin"},
        {".accdb", "application/msaccess"},
        {".accdc", "application/msaccess.cab"},
        {".accde", "application/msaccess"},
        {".accdr", "application/msaccess.runtime"},
        {".accdt", "application/msaccess"},
        {".accdw", "application/msaccess.webapplication"},
        {".accft", "application/msaccess.ftemplate"},
        {".acx", "application/internet-property-stream"},
        {".AddIn", "text/xml"},
        {".ade", "application/msaccess"},
        {".adobebridge", "application/x-bridge-url"},
        {".adp", "application/msaccess"},
        {".ADT", "audio/vnd.dlna.adts"},
        {".ADTS", "audio/aac"},
        {".afm", "application/octet-stream"},
        {".ai", "application/postscript"},
        {".aif", "audio/x-aiff"},
        {".aifc", "audio/aiff"},
        {".aiff", "audio/aiff"},
        {".air", "application/vnd.adobe.air-application-installer-package+zip"},
        {".amc", "application/x-mpeg"},
        {".application", "application/x-ms-application"},
        {".art", "image/x-jg"},
        {".asa", "application/xml"},
        {".asax", "application/xml"},
        {".ascx", "application/xml"},
        {".asd", "application/octet-stream"},
        {".asf", "video/x-ms-asf"},
        {".ashx", "application/xml"},
        {".asi", "application/octet-stream"},
        {".asm", "text/plain"},
        {".asmx", "application/xml"},
        {".aspx", "application/xml"},
        {".asr", "video/x-ms-asf"},
        {".asx", "video/x-ms-asf"},
        {".atom", "application/atom+xml"},
        {".au", "audio/basic"},
        {".avi", "video/x-msvideo"},
        {".axs", "application/olescript"},
        {".bas", "text/plain"},
        {".bcpio", "application/x-bcpio"},
        {".bin", "application/octet-stream"},
        {".bmp", "image/bmp"},
        {".c", "text/plain"},
        {".cab", "application/octet-stream"},
        {".caf", "audio/x-caf"},
        {".calx", "application/vnd.ms-office.calx"},
        {".cat", "application/vnd.ms-pki.seccat"},
        {".cc", "text/plain"},
        {".cd", "text/plain"},
        {".cdda", "audio/aiff"},
        {".cdf", "application/x-cdf"},
        {".cer", "application/x-x509-ca-cert"},
        {".chm", "application/octet-stream"},
        {".class", "application/x-java-applet"},
        {".clp", "application/x-msclip"},
        {".cmx", "image/x-cmx"},
        {".cnf", "text/plain"},
        {".cod", "image/cis-cod"},
        {".config", "application/xml"},
        {".contact", "text/x-ms-contact"},
        {".coverage", "application/xml"},
        {".cpio", "application/x-cpio"},
        {".cpp", "text/plain"},
        {".crd", "application/x-mscardfile"},
        {".crl", "application/pkix-crl"},
        {".crt", "application/x-x509-ca-cert"},
        {".cs", "text/plain"},
        {".csdproj", "text/plain"},
        {".csh", "application/x-csh"},
        {".csproj", "text/plain"},
        {".css", "text/css"},
        {".csv", "text/csv"},
        {".cur", "application/octet-stream"},
        {".cxx", "text/plain"},
        {".dat", "application/octet-stream"},
        {".datasource", "application/xml"},
        {".dbproj", "text/plain"},
        {".dcr", "application/x-director"},
        {".def", "text/plain"},
        {".deploy", "application/octet-stream"},
        {".der", "application/x-x509-ca-cert"},
        {".dgml", "application/xml"},
        {".dib", "image/bmp"},
        {".dif", "video/x-dv"},
        {".dir", "application/x-director"},
        {".disco", "text/xml"},
        {".dll", "application/x-msdownload"},
        {".dll.config", "text/xml"},
        {".dlm", "text/dlm"},
        {".doc", "application/msword"},
        {".docm", "application/vnd.ms-word.document.macroEnabled.12"},
        {".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
        {".dot", "application/msword"},
        {".dotm", "application/vnd.ms-word.template.macroEnabled.12"},
        {".dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"},
        {".dsp", "application/octet-stream"},
        {".dsw", "text/plain"},
        {".dtd", "text/xml"},
        {".dtsConfig", "text/xml"},
        {".dv", "video/x-dv"},
        {".dvi", "application/x-dvi"},
        {".dwf", "drawing/x-dwf"},
        {".dwp", "application/octet-stream"},
        {".dxr", "application/x-director"},
        {".eml", "message/rfc822"},
        {".emz", "application/octet-stream"},
        {".eot", "application/octet-stream"},
        {".eps", "application/postscript"},
        {".etl", "application/etl"},
        {".etx", "text/x-setext"},
        {".evy", "application/envoy"},
        {".exe", "application/octet-stream"},
        {".exe.config", "text/xml"},
        {".fdf", "application/vnd.fdf"},
        {".fif", "application/fractals"},
        {".filters", "Application/xml"},
        {".fla", "application/octet-stream"},
        {".flr", "x-world/x-vrml"},
        {".flv", "video/x-flv"},
        {".fsscript", "application/fsharp-script"},
        {".fsx", "application/fsharp-script"},
        {".generictest", "application/xml"},
        {".gif", "image/gif"},
        {".group", "text/x-ms-group"},
        {".gsm", "audio/x-gsm"},
        {".gtar", "application/x-gtar"},
        {".gz", "application/x-gzip"},
        {".h", "text/plain"},
        {".hdf", "application/x-hdf"},
        {".hdml", "text/x-hdml"},
        {".hhc", "application/x-oleobject"},
        {".hhk", "application/octet-stream"},
        {".hhp", "application/octet-stream"},
        {".hlp", "application/winhlp"},
        {".hpp", "text/plain"},
        {".hqx", "application/mac-binhex40"},
        {".hta", "application/hta"},
        {".htc", "text/x-component"},
        {".htm", "text/html"},
        {".html", "text/html"},
        {".htt", "text/webviewhtml"},
        {".hxa", "application/xml"},
        {".hxc", "application/xml"},
        {".hxd", "application/octet-stream"},
        {".hxe", "application/xml"},
        {".hxf", "application/xml"},
        {".hxh", "application/octet-stream"},
        {".hxi", "application/octet-stream"},
        {".hxk", "application/xml"},
        {".hxq", "application/octet-stream"},
        {".hxr", "application/octet-stream"},
        {".hxs", "application/octet-stream"},
        {".hxt", "text/html"},
        {".hxv", "application/xml"},
        {".hxw", "application/octet-stream"},
        {".hxx", "text/plain"},
        {".i", "text/plain"},
        {".ico", "image/x-icon"},
        {".ics", "application/octet-stream"},
        {".idl", "text/plain"},
        {".ief", "image/ief"},
        {".iii", "application/x-iphone"},
        {".inc", "text/plain"},
        {".inf", "application/octet-stream"},
        {".inl", "text/plain"},
        {".ins", "application/x-internet-signup"},
        {".ipa", "application/x-itunes-ipa"},
        {".ipg", "application/x-itunes-ipg"},
        {".ipproj", "text/plain"},
        {".ipsw", "application/x-itunes-ipsw"},
        {".iqy", "text/x-ms-iqy"},
        {".isp", "application/x-internet-signup"},
        {".ite", "application/x-itunes-ite"},
        {".itlp", "application/x-itunes-itlp"},
        {".itms", "application/x-itunes-itms"},
        {".itpc", "application/x-itunes-itpc"},
        {".IVF", "video/x-ivf"},
        {".jar", "application/java-archive"},
        {".java", "application/octet-stream"},
        {".jck", "application/liquidmotion"},
        {".jcz", "application/liquidmotion"},
        {".jfif", "image/pjpeg"},
        {".jnlp", "application/x-java-jnlp-file"},
        {".jpb", "application/octet-stream"},
        {".jpe", "image/jpeg"},
        {".jpeg", "image/jpeg"},
        {".jpg", "image/jpeg"},
        {".js", "application/x-javascript"},
        {".json", "application/json"},
        {".jsx", "text/jscript"},
        {".jsxbin", "text/plain"},
        {".latex", "application/x-latex"},
        {".library-ms", "application/windows-library+xml"},
        {".lit", "application/x-ms-reader"},
        {".loadtest", "application/xml"},
        {".lpk", "application/octet-stream"},
        {".lsf", "video/x-la-asf"},
        {".lst", "text/plain"},
        {".lsx", "video/x-la-asf"},
        {".lzh", "application/octet-stream"},
        {".m13", "application/x-msmediaview"},
        {".m14", "application/x-msmediaview"},
        {".m1v", "video/mpeg"},
        {".m2t", "video/vnd.dlna.mpeg-tts"},
        {".m2ts", "video/vnd.dlna.mpeg-tts"},
        {".m2v", "video/mpeg"},
        {".m3u", "audio/x-mpegurl"},
        {".m3u8", "audio/x-mpegurl"},
        {".m4a", "audio/m4a"},
        {".m4b", "audio/m4b"},
        {".m4p", "audio/m4p"},
        {".m4r", "audio/x-m4r"},
        {".m4v", "video/x-m4v"},
        {".mac", "image/x-macpaint"},
        {".mak", "text/plain"},
        {".man", "application/x-troff-man"},
        {".manifest", "application/x-ms-manifest"},
        {".map", "text/plain"},
        {".master", "application/xml"},
        {".mda", "application/msaccess"},
        {".mdb", "application/x-msaccess"},
        {".mde", "application/msaccess"},
        {".mdp", "application/octet-stream"},
        {".me", "application/x-troff-me"},
        {".mfp", "application/x-shockwave-flash"},
        {".mht", "message/rfc822"},
        {".mhtml", "message/rfc822"},
        {".mid", "audio/mid"},
        {".midi", "audio/mid"},
        {".mix", "application/octet-stream"},
        {".mk", "text/plain"},
        {".mmf", "application/x-smaf"},
        {".mno", "text/xml"},
        {".mny", "application/x-msmoney"},
        {".mod", "video/mpeg"},
        {".mov", "video/quicktime"},
        {".movie", "video/x-sgi-movie"},
        {".mp2", "video/mpeg"},
        {".mp2v", "video/mpeg"},
        {".mp3", "audio/mpeg"},
        {".mp4", "video/mp4"},
        {".mp4v", "video/mp4"},
        {".mpa", "video/mpeg"},
        {".mpe", "video/mpeg"},
        {".mpeg", "video/mpeg"},
        {".mpf", "application/vnd.ms-mediapackage"},
        {".mpg", "video/mpeg"},
        {".mpp", "application/vnd.ms-project"},
        {".mpv2", "video/mpeg"},
        {".mqv", "video/quicktime"},
        {".ms", "application/x-troff-ms"},
        {".msi", "application/octet-stream"},
        {".mso", "application/octet-stream"},
        {".mts", "video/vnd.dlna.mpeg-tts"},
        {".mtx", "application/xml"},
        {".mvb", "application/x-msmediaview"},
        {".mvc", "application/x-miva-compiled"},
        {".mxp", "application/x-mmxp"},
        {".nc", "application/x-netcdf"},
        {".nsc", "video/x-ms-asf"},
        {".nws", "message/rfc822"},
        {".ocx", "application/octet-stream"},
        {".oda", "application/oda"},
        {".odc", "text/x-ms-odc"},
        {".odh", "text/plain"},
        {".odl", "text/plain"},
        {".odp", "application/vnd.oasis.opendocument.presentation"},
        {".ods", "application/oleobject"},
        {".odt", "application/vnd.oasis.opendocument.text"},
        {".ogv", "video/ogg"},
        {".one", "application/onenote"},
        {".onea", "application/onenote"},
        {".onepkg", "application/onenote"},
        {".onetmp", "application/onenote"},
        {".onetoc", "application/onenote"},
        {".onetoc2", "application/onenote"},
        {".orderedtest", "application/xml"},
        {".osdx", "application/opensearchdescription+xml"},
        {".p10", "application/pkcs10"},
        {".p12", "application/x-pkcs12"},
        {".p7b", "application/x-pkcs7-certificates"},
        {".p7c", "application/pkcs7-mime"},
        {".p7m", "application/pkcs7-mime"},
        {".p7r", "application/x-pkcs7-certreqresp"},
        {".p7s", "application/pkcs7-signature"},
        {".pbm", "image/x-portable-bitmap"},
        {".pcast", "application/x-podcast"},
        {".pct", "image/pict"},
        {".pcx", "application/octet-stream"},
        {".pcz", "application/octet-stream"},
        {".pdf", "application/pdf"},
        {".pfb", "application/octet-stream"},
        {".pfm", "application/octet-stream"},
        {".pfx", "application/x-pkcs12"},
        {".pgm", "image/x-portable-graymap"},
        {".pic", "image/pict"},
        {".pict", "image/pict"},
        {".pkgdef", "text/plain"},
        {".pkgundef", "text/plain"},
        {".pko", "application/vnd.ms-pki.pko"},
        {".pls", "audio/scpls"},
        {".pma", "application/x-perfmon"},
        {".pmc", "application/x-perfmon"},
        {".pml", "application/x-perfmon"},
        {".pmr", "application/x-perfmon"},
        {".pmw", "application/x-perfmon"},
        {".png", "image/png"},
        {".pnm", "image/x-portable-anymap"},
        {".pnt", "image/x-macpaint"},
        {".pntg", "image/x-macpaint"},
        {".pnz", "image/png"},
        {".pot", "application/vnd.ms-powerpoint"},
        {".potm", "application/vnd.ms-powerpoint.template.macroEnabled.12"},
        {".potx", "application/vnd.openxmlformats-officedocument.presentationml.template"},
        {".ppa", "application/vnd.ms-powerpoint"},
        {".ppam", "application/vnd.ms-powerpoint.addin.macroEnabled.12"},
        {".ppm", "image/x-portable-pixmap"},
        {".pps", "application/vnd.ms-powerpoint"},
        {".ppsm", "application/vnd.ms-powerpoint.slideshow.macroEnabled.12"},
        {".ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow"},
        {".ppt", "application/vnd.ms-powerpoint"},
        {".pptm", "application/vnd.ms-powerpoint.presentation.macroEnabled.12"},
        {".pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"},
        {".prf", "application/pics-rules"},
        {".prm", "application/octet-stream"},
        {".prx", "application/octet-stream"},
        {".ps", "application/postscript"},
        {".psc1", "application/PowerShell"},
        {".psd", "application/octet-stream"},
        {".psess", "application/xml"},
        {".psm", "application/octet-stream"},
        {".psp", "application/octet-stream"},
        {".pub", "application/x-mspublisher"},
        {".pwz", "application/vnd.ms-powerpoint"},
        {".qht", "text/x-html-insertion"},
        {".qhtm", "text/x-html-insertion"},
        {".qt", "video/quicktime"},
        {".qti", "image/x-quicktime"},
        {".qtif", "image/x-quicktime"},
        {".qtl", "application/x-quicktimeplayer"},
        {".qxd", "application/octet-stream"},
        {".ra", "audio/x-pn-realaudio"},
        {".ram", "audio/x-pn-realaudio"},
        {".rar", "application/octet-stream"},
        {".ras", "image/x-cmu-raster"},
        {".rat", "application/rat-file"},
        {".rc", "text/plain"},
        {".rc2", "text/plain"},
        {".rct", "text/plain"},
        {".rdlc", "application/xml"},
        {".resx", "application/xml"},
        {".rf", "image/vnd.rn-realflash"},
        {".rgb", "image/x-rgb"},
        {".rgs", "text/plain"},
        {".rm", "application/vnd.rn-realmedia"},
        {".rmi", "audio/mid"},
        {".rmp", "application/vnd.rn-rn_music_package"},
        {".roff", "application/x-troff"},
        {".rpm", "audio/x-pn-realaudio-plugin"},
        {".rqy", "text/x-ms-rqy"},
        {".rtf", "application/rtf"},
        {".rtx", "text/richtext"},
        {".ruleset", "application/xml"},
        {".s", "text/plain"},
        {".safariextz", "application/x-safari-safariextz"},
        {".scd", "application/x-msschedule"},
        {".sct", "text/scriptlet"},
        {".sd2", "audio/x-sd2"},
        {".sdp", "application/sdp"},
        {".sea", "application/octet-stream"},
        {".searchConnector-ms", "application/windows-search-connector+xml"},
        {".setpay", "application/set-payment-initiation"},
        {".setreg", "application/set-registration-initiation"},
        {".settings", "application/xml"},
        {".sgimb", "application/x-sgimb"},
        {".sgml", "text/sgml"},
        {".sh", "application/x-sh"},
        {".shar", "application/x-shar"},
        {".shtml", "text/html"},
        {".sit", "application/x-stuffit"},
        {".sitemap", "application/xml"},
        {".skin", "application/xml"},
        {".sldm", "application/vnd.ms-powerpoint.slide.macroEnabled.12"},
        {".sldx", "application/vnd.openxmlformats-officedocument.presentationml.slide"},
        {".slk", "application/vnd.ms-excel"},
        {".sln", "text/plain"},
        {".slupkg-ms", "application/x-ms-license"},
        {".smd", "audio/x-smd"},
        {".smi", "application/octet-stream"},
        {".smx", "audio/x-smd"},
        {".smz", "audio/x-smd"},
        {".snd", "audio/basic"},
        {".snippet", "application/xml"},
        {".snp", "application/octet-stream"},
        {".sol", "text/plain"},
        {".sor", "text/plain"},
        {".spc", "application/x-pkcs7-certificates"},
        {".spl", "application/futuresplash"},
        {".src", "application/x-wais-source"},
        {".srf", "text/plain"},
        {".SSISDeploymentManifest", "text/xml"},
        {".ssm", "application/streamingmedia"},
        {".sst", "application/vnd.ms-pki.certstore"},
        {".stl", "application/vnd.ms-pki.stl"},
        {".sv4cpio", "application/x-sv4cpio"},
        {".sv4crc", "application/x-sv4crc"},
        {".svc", "application/xml"},
        {".swf", "application/x-shockwave-flash"},
        {".t", "application/x-troff"},
        {".tar", "application/x-tar"},
        {".tcl", "application/x-tcl"},
        {".testrunconfig", "application/xml"},
        {".testsettings", "application/xml"},
        {".tex", "application/x-tex"},
        {".texi", "application/x-texinfo"},
        {".texinfo", "application/x-texinfo"},
        {".tgz", "application/x-compressed"},
        {".thmx", "application/vnd.ms-officetheme"},
        {".thn", "application/octet-stream"},
        {".tif", "image/tiff"},
        {".tiff", "image/tiff"},
        {".tlh", "text/plain"},
        {".tli", "text/plain"},
        {".toc", "application/octet-stream"},
        {".tr", "application/x-troff"},
        {".trm", "application/x-msterminal"},
        {".trx", "application/xml"},
        {".ts", "video/vnd.dlna.mpeg-tts"},
        {".tsv", "text/tab-separated-values"},
        {".ttf", "application/octet-stream"},
        {".tts", "video/vnd.dlna.mpeg-tts"},
        {".txt", "text/plain"},
        {".u32", "application/octet-stream"},
        {".uls", "text/iuls"},
        {".user", "text/plain"},
        {".ustar", "application/x-ustar"},
        {".vb", "text/plain"},
        {".vbdproj", "text/plain"},
        {".vbk", "video/mpeg"},
        {".vbproj", "text/plain"},
        {".vbs", "text/vbscript"},
        {".vcf", "text/x-vcard"},
        {".vcproj", "Application/xml"},
        {".vcs", "text/plain"},
        {".vcxproj", "Application/xml"},
        {".vddproj", "text/plain"},
        {".vdp", "text/plain"},
        {".vdproj", "text/plain"},
        {".vdx", "application/vnd.ms-visio.viewer"},
        {".vml", "text/xml"},
        {".vscontent", "application/xml"},
        {".vsct", "text/xml"},
        {".vsd", "application/vnd.visio"},
        {".vsi", "application/ms-vsi"},
        {".vsix", "application/vsix"},
        {".vsixlangpack", "text/xml"},
        {".vsixmanifest", "text/xml"},
        {".vsmdi", "application/xml"},
        {".vspscc", "text/plain"},
        {".vss", "application/vnd.visio"},
        {".vsscc", "text/plain"},
        {".vssettings", "text/xml"},
        {".vssscc", "text/plain"},
        {".vst", "application/vnd.visio"},
        {".vstemplate", "text/xml"},
        {".vsto", "application/x-ms-vsto"},
        {".vsw", "application/vnd.visio"},
        {".vsx", "application/vnd.visio"},
        {".vtx", "application/vnd.visio"},
        {".wav", "audio/wav"},
        {".wave", "audio/wav"},
        {".wax", "audio/x-ms-wax"},
        {".wbk", "application/msword"},
        {".wbmp", "image/vnd.wap.wbmp"},
        {".wcm", "application/vnd.ms-works"},
        {".wdb", "application/vnd.ms-works"},
        {".wdp", "image/vnd.ms-photo"},
        {".webarchive", "application/x-safari-webarchive"},
        {".webm", "video/webm"},
        {".webtest", "application/xml"},
        {".wiq", "application/xml"},
        {".wiz", "application/msword"},
        {".wks", "application/vnd.ms-works"},
        {".WLMP", "application/wlmoviemaker"},
        {".wlpginstall", "application/x-wlpg-detect"},
        {".wlpginstall3", "application/x-wlpg3-detect"},
        {".wm", "video/x-ms-wm"},
        {".wma", "audio/x-ms-wma"},
        {".wmd", "application/x-ms-wmd"},
        {".wmf", "application/x-msmetafile"},
        {".wml", "text/vnd.wap.wml"},
        {".wmlc", "application/vnd.wap.wmlc"},
        {".wmls", "text/vnd.wap.wmlscript"},
        {".wmlsc", "application/vnd.wap.wmlscriptc"},
        {".wmp", "video/x-ms-wmp"},
        {".wmv", "video/x-ms-wmv"},
        {".wmx", "video/x-ms-wmx"},
        {".wmz", "application/x-ms-wmz"},
        {".wpl", "application/vnd.ms-wpl"},
        {".wps", "application/vnd.ms-works"},
        {".wri", "application/x-mswrite"},
        {".wrl", "x-world/x-vrml"},
        {".wrz", "x-world/x-vrml"},
        {".wsc", "text/scriptlet"},
        {".wsdl", "text/xml"},
        {".wvx", "video/x-ms-wvx"},
        {".x", "application/directx"},
        {".xaf", "x-world/x-vrml"},
        {".xaml", "application/xaml+xml"},
        {".xap", "application/x-silverlight-app"},
        {".xbap", "application/x-ms-xbap"},
        {".xbm", "image/x-xbitmap"},
        {".xdr", "text/plain"},
        {".xht", "application/xhtml+xml"},
        {".xhtml", "application/xhtml+xml"},
        {".xla", "application/vnd.ms-excel"},
        {".xlam", "application/vnd.ms-excel.addin.macroEnabled.12"},
        {".xlc", "application/vnd.ms-excel"},
        {".xld", "application/vnd.ms-excel"},
        {".xlk", "application/vnd.ms-excel"},
        {".xll", "application/vnd.ms-excel"},
        {".xlm", "application/vnd.ms-excel"},
        {".xls", "application/vnd.ms-excel"},
        {".xlsb", "application/vnd.ms-excel.sheet.binary.macroEnabled.12"},
        {".xlsm", "application/vnd.ms-excel.sheet.macroEnabled.12"},
        {".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
        {".xlt", "application/vnd.ms-excel"},
        {".xltm", "application/vnd.ms-excel.template.macroEnabled.12"},
        {".xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template"},
        {".xlw", "application/vnd.ms-excel"},
        {".xml", "text/xml"},
        {".xmta", "application/xml"},
        {".xof", "x-world/x-vrml"},
        {".XOML", "text/plain"},
        {".xpm", "image/x-xpixmap"},
        {".xps", "application/vnd.ms-xpsdocument"},
        {".xrm-ms", "text/xml"},
        {".xsc", "application/xml"},
        {".xsd", "text/xml"},
        {".xsf", "text/xml"},
        {".xsl", "text/xml"},
        {".xslt", "text/xml"},
        {".xsn", "application/octet-stream"},
        {".xss", "application/xml"},
        {".xtp", "application/octet-stream"},
        {".xwd", "image/x-xwindowdump"},
        {".z", "application/x-compress"},
        {".zip", "application/x-zip-compressed"},
        #endregion

        };

        private static void _PopulateMap()
        {
            if (_MimeToExtensionMap.Count > 0)
            {
                return;
            }

            var enumerator = _ExtensionToMimeMap.GetEnumerator();
            while (enumerator.MoveNext())
            {
                // Note that this will end up taking the last valid file extension for the
                // given mime type
                _MimeToExtensionMap[enumerator.Current.Value] = enumerator.Current.Key;
            }
        }

        /// <summary>
        /// GetMimeType
        ///     Returns back a mime type string from the given file extension
        /// </summary>
        /// <param name="extension">File extension used as the lookup key</param>
        /// <returns>A mime type string</returns>
        public static string GetMimeType(string extension)
        {
            if (extension == null)
            {
                return "text/plain";
            }

            if (!extension.StartsWith("."))
            {
                extension = "." + extension;
            }

            string mime;

            return _ExtensionToMimeMap.TryGetValue(extension, out mime) ? mime : "text/plain";
        }

        /// <summary>
        /// GetMimeType
        ///     Returns back a file extension from the given mime type
        /// </summary>
        /// <param name="mimeType">Mime type string used as the lookup key</param>
        /// <returns>A file extension including the period</returns>
        public static string GetExtension(string mimeType)
        {
            if (mimeType == null)
            {
                return "";
            }

            // Make sure the extension map is populated
            _PopulateMap();

            string extension;
            bool found = _MimeToExtensionMap.TryGetValue(mimeType, out extension);

            return extension != null ? extension : "";
        }
    }
}
