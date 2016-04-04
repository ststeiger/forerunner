using System;
using System.Configuration;
using System.IO;
using System.Net;
using System.Text;
using Forerunner.SSRS.Execution;
using Forerunner.JSONWriter;
using System.Diagnostics;
using Forerunner.SSRS.JSONRender;
using System.Security.Principal;
using System.Web;
using System.Web.Security;
using System.Threading;
using Forerunner.Security;
using Forerunner.Logging;
using ForerunnerLicense;
using Forerunner.SSRS.Manager;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;
using System.Collections.Generic;
using System.Xml;
using Newtonsoft.Json;

namespace Forerunner.SSRS.Viewer
{
    public enum RenderFormat
    {
        XML,
        CSV,
        PDF,
        MHTML,
        EXCELOPENXML,
        IMAGE,
        WORDOPENXML
    }

    public class ReportViewer:IDisposable
    {
        private String ReportServerURL;
        private Credentials Credentials = new Credentials();
        private ReportExecutionService rs = new ReportExecutionService();
        private CurrentUserImpersonator impersonator = null;
        private int RSTimeOut = 100000;
        private byte[] imageResult = null;
        private AutoResetEvent waitHandle = new AutoResetEvent(false);
        static private string IsDebug = ConfigurationManager.AppSettings["Forerunner.Debug"];
        static private bool EnableImageConsolidation = ForerunnerUtil.GetAppSetting("Forerunner.ImageConsolidation",false);
        static private Dictionary<string, SSRSServer> SSRSServers = new Dictionary<string, SSRSServer>();

        private class SSRSServer
        {
            public bool ServerRendering = false;
            public bool MHTMLRendering = false;
            public string SSRSVerion = "";
            public string SSRSEdition = "";

            public int GetVersionNumber()
            {
                int retval;

                int.TryParse(SSRSVerion.Substring(0, 4), out retval);
                return retval;

            }

        }

        private SSRSServer GetServerInfo()
        {
            SSRSServer retval = null;

            lock (SSRSServers)
            {
                SSRSServers.TryGetValue(this.ReportServerURL, out retval);

                if (retval == null)
                    retval = LoadServerData();
            }
            return retval;
        }

        public void VaidateServerConnection()
        {
            if (rs.Credentials == null)
                rs.Credentials = GetCredentials();

            rs.ListRenderingExtensions();
        }

        private SSRSServer LoadServerData()
        {
            SSRSServer retval = new SSRSServer();

            if (rs.Credentials == null)
                rs.Credentials = GetCredentials();

            rs.ServerInfoHeaderValue = new ServerInfoHeader();

            foreach (Extension Ex in rs.ListRenderingExtensions())
            {
                if (Ex.Name == "ForerunnerJSON")
                    retval.ServerRendering = true;
                if (Ex.Name == "MHTML")
                    retval.MHTMLRendering = true;

            }
            retval.SSRSVerion = rs.ServerInfoHeaderValue.ReportServerVersionNumber;
            retval.SSRSEdition = rs.ServerInfoHeaderValue.ReportServerEdition;
#if DEBUG
            retval.ServerRendering = false;
            //retval.MHTMLRendering = false;
#endif


            SSRSServers.Add(this.ReportServerURL, retval);
            return retval;
        }

        public ReportViewer(String ReportServerURL, Credentials Credentials, int TimeOut = 100000)
        {
            this.ReportServerURL = ReportServerURL;
            RSTimeOut = TimeOut;
            this.Credentials = Credentials;
            SetRSURL();            
            GetServerRendering();
        }
        private void SetRSURL()
        {
            rs.Url = ReportServerURL + "/ReportExecution2005.asmx";
            rs.Timeout = RSTimeOut;
        }

        internal void SetImpersonator(CurrentUserImpersonator impersonator)
        {
            this.impersonator = impersonator;
        }

        public ReportViewer(String ReportServerURL, int TimeOut = 100000)
        {
            this.ReportServerURL = ReportServerURL;
            RSTimeOut = TimeOut;
            SetRSURL();            
        }

        private ICredentials credentials = null;

        public void SetCredentials(ICredentials credentials)
        {
            this.credentials = credentials;
        }

        private ICredentials GetCredentials()
        {
            if (credentials != null)
                return credentials;

            return FormsAuthenticationHelper.GetCredentials();
        }

        internal bool GetServerRendering()
        {
            return GetServerInfo().ServerRendering;
        }
        public byte[] GetImage(string SessionID, string ImageID, out string mimeType)
        {
            return GetImageInternal(SessionID, ImageID, out mimeType);
        }

        private byte[] GetImageInternal(string SessionID, string ImageID, out string mimeType)
        {
            try
            {
                rs.Credentials = GetCredentials();

                ExecutionInfo execInfo = new ExecutionInfo();
                ExecutionHeader execHeader = new ExecutionHeader();
                byte[] result = null;
                string encoding;

                rs.ExecutionHeaderValue = execHeader;
                rs.ExecutionHeaderValue.ExecutionID = SessionID;

                string format;
                GetServerRendering();
                if (GetServerInfo().ServerRendering)
                    format = "ForerunnerJSON";
                else
                    format = "RPL";
                string devInfo = "";

                result = rs.RenderStream(format, ImageID, devInfo, out encoding, out mimeType);
  
                if (mimeType == null)
                    mimeType = JsonUtility.GetMimeTypeFromBytes(result);
                return result;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                mimeType = "";
                return null;
            }
        }
 
        public byte[] NavigateTo(string NavType, string SessionID, string UniqueID)
        {
            rs.Credentials = GetCredentials();
            switch (NavType)
            {
                case "toggle":
                    return Encoding.UTF8.GetBytes(this.ToggleItem(SessionID, UniqueID));
                case "bookmark":
                    return Encoding.UTF8.GetBytes(this.NavBookmark(SessionID, UniqueID));
                case "drillthrough":
                    return Encoding.UTF8.GetBytes(this.NavigateDrillthrough(SessionID, UniqueID));
                case "documentMap":
                    return Encoding.UTF8.GetBytes(this.NavigateDocumentMap(SessionID, UniqueID));
            }
            return null;
        }

        public string pingSession(string SessionID)
        {
            if (SessionID == "DebugPlaceholderSession")
                return "";

            JSONTextWriter w = new JSONTextWriter();
            w.WriteStartObject();
            rs.Credentials = GetCredentials();

            if (SessionID != "" && SessionID != null)
            {
                try
                {
                    ExecutionHeader execHeader = new ExecutionHeader();
                    rs.ExecutionHeaderValue = execHeader;
                    rs.ExecutionHeaderValue.ExecutionID = SessionID;
                    rs.GetExecutionInfo();
                    w.WriteMember("Status");
                    w.WriteString("Success");
                    w.WriteEndObject();
                    return w.ToString();

                }
                catch (Exception e)
                {
                    ExceptionLogGenerator.LogException(e);
                    // Need to check the error, just retuen fail on all right now
                    w.WriteMember("Status");
                    w.WriteString("Fail");
                    w.WriteMember("Error");
                    w.WriteString(e.Message);
                    w.WriteEndObject();
                    return w.ToString();

                }
            }
            w.WriteMember("Status");
            w.WriteString("Fail");
            w.WriteMember("Error");
            w.WriteString("No SessionID");
            w.WriteEndObject();
            return w.ToString();
        }

        private Stream GetUTF8Bytes(string result)
        {
            int length = Encoding.UTF8.GetByteCount(result);
            MemoryStream mem = new MemoryStream(length);


            mem.Write(Encoding.UTF8.GetBytes(result), 0, length);
            return mem;
        }

        private Stream GetUTF8Bytes(StringWriter result)
        {
            MemoryStream mem = new MemoryStream();
            int bufsiz = 1024 * 1000;
            char[] c = new char[bufsiz];
            StringBuilder sb;
            byte[] b;
            sb = result.GetStringBuilder();

            int len = sb.Length;
            int offset = 0;

            while (len >= 0)
            {
                if (len >= bufsiz)
                {
                    sb.CopyTo(offset, c, 0, bufsiz);
                    b = Encoding.UTF8.GetBytes(c, 0, bufsiz);
                    mem.Write(b, 0, b.Length);
                    len -= bufsiz;
                    offset += bufsiz;
                }
                else
                {
                    sb.CopyTo(offset, c, 0, len);
                    b = Encoding.UTF8.GetBytes(c, 0, len);
                    mem.Write(b, 0, b.Length);
                    break;
                }

            }
            return mem;


        }

        private Stream GetUTF8Bytes(byte[] result, string preString, string postString)
        {
            MemoryStream mem = new MemoryStream(result.Length + 512);
            
    
            mem.Write(Encoding.UTF8.GetBytes(preString), 0, Encoding.UTF8.GetByteCount(preString));
            mem.Write(result, 0, result.Length);
            mem.Write(Encoding.UTF8.GetBytes(postString), 0, Encoding.UTF8.GetByteCount(postString));
            return mem;


        }

        public void ResetExecution(String SessionID)
        {
            rs.Credentials = GetCredentials();
            rs.ExecutionHeaderValue = new ExecutionHeader();
            rs.ExecutionHeaderValue.ExecutionID = SessionID;
            rs.ResetExecution2();
        }

        public string LoadReportDefinition(string RDL)
        {
            rs.Credentials = GetCredentials();
            byte[] RDLBytes = Encoding.ASCII.GetBytes(RDL);
            Warning[] RDLWarnings;

            ExecutionInfo2 execInfo = rs.LoadReportDefinition2(RDLBytes, out RDLWarnings);

             JSONTextWriter w = new JSONTextWriter();
            w.WriteStartObject();
            w.WriteMember("SessionID");
            w.WriteString(execInfo.ExecutionID);
            if (RDLWarnings != null)
            {
                w.WriteMember("Warnings");
                w.WriteStartArray();
                foreach (Warning warn in RDLWarnings)
                {
                    w.WriteStartObject();

                    w.WriteMember("Code");
                    w.WriteString(warn.Code);
                    w.WriteMember("Severity");
                    w.WriteString(warn.Severity);
                    w.WriteMember("Message");
                    w.WriteString(warn.Message);
                    w.WriteMember("ObjectType");
                    w.WriteString(warn.ObjectType);
                    w.WriteMember("ObjectName");
                    w.WriteString(warn.ObjectName);

                    w.WriteEndObject();
                }
                w.WriteEndArray();
            }
            w.WriteEndObject();

            return w.ToString();
        }

        public Stream GetReportJson(string reportPath, string SessionID, string PageNum, string paramList, string credentials)
        {
            byte[] result = null;
            string format;
            string historyID = null;
            string encoding;
            string mimeType;
            string extension;
            Warning[] warnings = null;
            string[] streamIDs = null;
            string NewSession = "DebugPlaceholderSession";
            ReportJSONWriter rw;
            ExecutionInfo execInfo = new ExecutionInfo();
            ExecutionHeader execHeader = new ExecutionHeader();
            int numPages = 1;
            bool hasDocMap = false;
            JSONTextWriter JSON = new JSONTextWriter();

            try
            {

                //This is for debug from customer log files
                if (IsDebug == "JSON")
                {
                    
                    int bufsiz = 1024*1024;
                    byte[] fb = new byte[bufsiz];
                    int len = 0;
                    int rs = 0;
                    MemoryStream ms = new MemoryStream();
                    FileStream fs = File.Open(ConfigurationManager.AppSettings["Forerunner.JSONFile"], FileMode.Open);
                    while (len < fs.Length)
                    {
                        rs = fs.Read(fb, 0, bufsiz);
                        ms.Write(fb, 0, rs);
                        len += rs;
                    }
                    fs.Close();
                    
                    return ms;
                }
                else if (IsDebug == "RPL")
                    result = Convert.FromBase64String(File.ReadAllText(ConfigurationManager.AppSettings["Forerunner.RPLFile"]));
                else
                {

                    rs.Credentials = GetCredentials();
                    GetServerRendering();

                    //Use local to get RPL for debug, will through an error
                    if (GetServerInfo().ServerRendering && (IsDebug != "WRPL"))
                        format = "ForerunnerJSON";
                    else
                        format = "RPL";

                    if (SessionID == null)
                        NewSession = "";
                    else
                        NewSession = SessionID;

                    //Device Info

                    //Image consolidation off becasue of SSRS bug:(
                    string devInfo = @"<DeviceInfo><MeasureItems>true</MeasureItems><SecondaryStreams>Server</SecondaryStreams><StreamNames>true</StreamNames><RPLVersion>10.6</RPLVersion>";
                    //EnableImageConsolidation
                    if (EnableImageConsolidation)
                        devInfo += "<ImageConsolidation>true</ImageConsolidation>";
                    else
                        devInfo += "<ImageConsolidation>false</ImageConsolidation>";

                    //Page number   
                    devInfo += @"<StartPage>" + PageNum + "</StartPage><EndPage>" + PageNum + "</EndPage>";
                    //End Device Info
                    devInfo += @"</DeviceInfo>";

                    rs.ExecutionHeaderValue = execHeader;
                    if (NewSession != "")
                    {
                        rs.ExecutionHeaderValue.ExecutionID = SessionID;
                        execInfo = rs.GetExecutionInfo();
                    }
                    else
                    {
                        execInfo = rs.LoadReport(reportPath, historyID);
                    }

                    NewSession = rs.ExecutionHeaderValue.ExecutionID;

                    if (execInfo.CredentialsRequired)
                    {
                        if (credentials != null)
                        {
                            execInfo = rs.SetExecutionCredentials(JsonUtility.GetDataSourceCredentialsFromString(credentials));
                        }
                        else
                        {
                            JSON.Write(JsonUtility.GetDataSourceCredentialJSON(execInfo.DataSourcePrompts, reportPath, NewSession, PageNum));
                            return GetUTF8Bytes(JSON.ToString());
                        }
                    }

                    if (execInfo.Parameters.Length != 0 && paramList != null)
                    {
                        execInfo = rs.SetExecutionParameters(JsonUtility.GetParameterValue(paramList, execInfo.Parameters), null);
                    }


                    // Check for beyond last page, if beyond go to last page.
                    for (int x = 0; x < 2 ;x++)
                    {
                        result = rs.Render2(format, devInfo, Forerunner.SSRS.Execution.PageCountMode.Estimate, out extension, out mimeType, out encoding, out warnings, out streamIDs);
                        execInfo = rs.GetExecutionInfo();
                        numPages = execInfo.NumPages;                     
                        hasDocMap = execInfo.HasDocumentMap;
                        if (execInfo.NumPages != 0 && execInfo.NumPages < int.Parse(PageNum))
                        {
                            PageNum = numPages.ToString();
                            devInfo = @"<DeviceInfo><MeasureItems>true</MeasureItems><SecondaryStreams>Server</SecondaryStreams><StreamNames>true</StreamNames><RPLVersion>10.6</RPLVersion>";
                            //EnableImageConsolidation
                            if (EnableImageConsolidation)
                                devInfo += "<ImageConsolidation>true</ImageConsolidation>";
                            else
                                devInfo += "<ImageConsolidation>false</ImageConsolidation>";
                            //Page number   
                            devInfo += @"<StartPage>" + numPages + "</StartPage><EndPage>" + numPages + "</EndPage>";
                            //End Device Info
                            devInfo += @"</DeviceInfo>";
                        }
                        else
                            break;
                    }

                }
                if (result.Length != 0)
                {
                    //Write the RPL and throw
                    if (IsDebug == "WRPL")
                         ExceptionLogGenerator.LogExceptionWithRPL("Debug", new MemoryStream(result));

                    JSONTextWriter w = new JSONTextWriter();
  
                    //Read Report Object
                    w.WriteStartObject();
                    w.WriteMember("SessionID");
                    w.WriteString(NewSession);
                    w.WriteMember("ReportServerURL");
                    w.WriteString(ReportServerURL);
                    w.WriteMember("ReportPath");
                    w.WriteString(reportPath);
                    w.WriteMember("HasDocMap");
                    w.WriteBoolean(hasDocMap);
                    w.WriteMember("ReportContainer");

                    MemoryStream ms;
                    if (GetServerInfo().ServerRendering && IsDebug != "RPL")
                    {
                        ms= GetUTF8Bytes(result,w.ToString(),"}") as MemoryStream;
                    }
                    else
                    {
                        rw = new ReportJSONWriter(new MemoryStream(result));
                        JSON = rw.RPLToJSON(numPages);
                        JSON.Insert(0, w);
                        JSON.Write("}");
                        ms = GetUTF8Bytes(JSON.ToString()) as MemoryStream;
                    }

                    
                    
                    // If debug write JSON flag
                    if (IsDebug == "WJSON")
                    {
                        //File.WriteAllText("c:\\test\\BigReport.txt",JSON, Encoding.UTF8);
                        string error = string.Format("[Time: {0}]\r\n[Type: {1}]\r\n[Message: {2}]\r\n[StackTrace:\r\n{3}]\r\n[JSON: {4}]",
                            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss "),"Debug", "JSON Debug", "", Encoding.UTF8.GetString(ms.ToArray()));
                        Logger.Trace(LogType.Error, "Debug:\r\n{0}", new object[] { error });                        
                    }
                    return ms;

                }
                else
                {
                    if (execInfo.NumPages != 0 && execInfo.NumPages < int.Parse(PageNum))
                        throw new Exception("No such page");
                    else
                        LicenseException.Throw(LicenseException.FailReason.SSRSLicenseError, "License Validation Failed, please see SSRS logfile");
                }
                //this should never be called
                return GetUTF8Bytes(JSON.ToString());
            }

            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                Console.WriteLine("Current user:" + HttpContext.Current.User.Identity.Name);
                JSON.Write(JsonUtility.WriteExceptionJSON(e, HttpContext.Current.User.Identity.Name));
                return GetUTF8Bytes(JSON.ToString());
            }

        }
        public string GetDocMapJson(string SessionID)
        {
            try
            {
                rs.Credentials = GetCredentials();
                ExecutionHeader execHeader = new ExecutionHeader();
                rs.ExecutionHeaderValue = execHeader;

                rs.ExecutionHeaderValue.ExecutionID = SessionID;
                return JsonUtility.GetDocMapJSON(rs.GetDocumentMap());

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                return JsonUtility.WriteExceptionJSON(e);
            }
        }
        public string GetParameterJson(string ReportPath, string SessionID, string paramList, string credentials)
        {
            string historyID = null;
            string NewSession;
            ExecutionInfo execInfo = null;
            // BUGBUG:: This can be made more optimized if we can use an existing session id.
            // Need to add the plumbing there. - added by baotong - 2013-10-14


            try
            {
                // The Forerunner.ParamterJSONFile flag is used to debug Reort Parameter widget validation bugs.
                // First get a network response string from the api/ParameterJson end point from the customer and
                // copy it into the C:\Test\ParamterJSON.txt file. Note that after you create the file, you will
                // need to add a member like this:
                //
                //   "Debug": true, 
                //
                // See the code in the ReportViewer.js file to see how this Debug flag is used.
                //
                String ParamterJSONFile = ConfigurationManager.AppSettings["Forerunner.ParamterJSONFile"];
                if (ParamterJSONFile != null && ParamterJSONFile.Length != 0 && File.Exists(ParamterJSONFile))
                {
                    System.IO.StreamReader streamReader = new System.IO.StreamReader(ParamterJSONFile);
                    return streamReader.ReadToEnd();
                }

                rs.Credentials = GetCredentials();                
                if (SessionID != "" && SessionID != null)
                {
                    ExecutionHeader execHeader = new ExecutionHeader();
                    rs.ExecutionHeaderValue = execHeader;
                    rs.ExecutionHeaderValue.ExecutionID = SessionID;
                    execInfo = rs.GetExecutionInfo();
                }
                else
                    execInfo = rs.LoadReport(ReportPath, historyID);

                ParameterValue[] clientParameters = paramList == null ? null : JsonUtility.GetParameterValue(paramList, execInfo.Parameters);

                NewSession = rs.ExecutionHeaderValue.ExecutionID;

                if (execInfo.CredentialsRequired)
                {
                    if (credentials != null)
                    {
                        execInfo = rs.SetExecutionCredentials(JsonUtility.GetDataSourceCredentialsFromString(credentials));
                    }
                    else
                    {
                        return JsonUtility.GetDataSourceCredentialJSON(execInfo.DataSourcePrompts, ReportPath, NewSession);
                    }
                }

                if (paramList != null)
                {
                    execInfo = rs.SetExecutionParameters(clientParameters, null);
                }


                if (execInfo.Parameters.Length != 0)
                {
                    ReportParameter[] reportParameter = execInfo.Parameters;
                    return JsonUtility.ConvertParamemterToJSON(reportParameter, NewSession, ReportServerURL, ReportPath, execInfo.NumPages);
                }
                return "{\"Type\":\"\"}";
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                Console.WriteLine("Current user:" + HttpContext.Current.User.Identity.Name);
                return JsonUtility.WriteExceptionJSON(e, HttpContext.Current.User.Identity.Name); //return e.Message;
            }
        }

        /// <summary>
        /// Sort data by special column field and sort direction
        /// </summary>
        public string SortReport(string SessionID, string SortItem, string Direction, bool ClearExistingSort)
        {
            try
            {
                rs.Credentials = GetCredentials();
                string ReportItem = string.Empty;
                int NumPages = 0;
                ExecutionHeader execHeader = new ExecutionHeader();
                rs.ExecutionHeaderValue = execHeader;

                rs.ExecutionHeaderValue.ExecutionID = SessionID;
                SortDirectionEnum SortDirection;
                switch (Direction)
                {
                    case "Ascending":
                        SortDirection = SortDirectionEnum.Ascending;
                        break;
                    case "Descending":
                        SortDirection = SortDirectionEnum.Descending;
                        break;
                    default:
                        SortDirection = SortDirectionEnum.None;
                        break;
                }
                int newPage = rs.Sort(SortItem, SortDirection, ClearExistingSort, out ReportItem, out NumPages);
                JSONTextWriter w = new JSONTextWriter();
                w.WriteStartObject();
                w.WriteMember("NewPage");
                w.WriteNumber(newPage);
                w.WriteMember("ReportItemID");
                w.WriteString(ReportItem);
                w.WriteMember("NumPages");
                w.WriteNumber(NumPages);
                w.WriteEndObject();
                return w.ToString();

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                return JsonUtility.WriteExceptionJSON(e);
            }
        }

        //Toggles the show/hide item in a report.
        public string ToggleItem(string SessionID, string ToggleID)
        {
            try
            {
                rs.Credentials = GetCredentials();
                bool result;
                ExecutionHeader execHeader = new ExecutionHeader();
                rs.ExecutionHeaderValue = execHeader;

                rs.ExecutionHeaderValue.ExecutionID = SessionID;

                result = rs.ToggleItem(ToggleID);

                JSONTextWriter w = new JSONTextWriter();
                w.WriteStartObject();
                w.WriteMember("Result");
                w.WriteBoolean(result);
                w.WriteMember("ToggleID");
                w.WriteString(ToggleID);
                w.WriteEndObject();             
                return w.ToString();

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                return JsonUtility.WriteExceptionJSON(e);
            }
        }

        //Navigates to a specific bookmark in the report.
        public string NavBookmark(string SessionID, string BookmarkID)
        {
            try
            {
                rs.Credentials = GetCredentials();
                ExecutionHeader execHeader = new ExecutionHeader();
                rs.ExecutionHeaderValue = execHeader;

                rs.ExecutionHeaderValue.ExecutionID = SessionID;
                string UniqueName = string.Empty;
                int NewPage = rs.NavigateBookmark(BookmarkID, out UniqueName);

                JSONTextWriter w = new JSONTextWriter();
                w.WriteStartObject();
                w.WriteMember("NewPage");
                w.WriteNumber(NewPage);
                w.WriteMember("UniqueName");
                w.WriteString(UniqueName);
                w.WriteEndObject();
                return w.ToString();

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                return JsonUtility.WriteExceptionJSON(e);
            }
        }


        //Navigates to a Drillthough report
        public string NavigateDrillthrough(string SessionID, string DrillthroughID)
        {
            try
            {
                rs.Credentials = GetCredentials();
                ExecutionHeader execHeader = new ExecutionHeader();
                rs.ExecutionHeaderValue = execHeader;

                rs.ExecutionHeaderValue.ExecutionID = SessionID;

                ExecutionInfo execInfo = rs.LoadDrillthroughTarget(DrillthroughID);

                JSONTextWriter w = new JSONTextWriter();
                w.WriteStartObject();
                w.WriteMember("SessionID");
                w.WriteString(execInfo.ExecutionID);
                w.WriteMember("CredentialsRequired");
                w.WriteBoolean(execInfo.CredentialsRequired);
                w.WriteMember("ParametersRequired");
                w.WriteBoolean(execInfo.Parameters.Length != 0 ? true : false);
                w.WriteMember("ReportPath");
                w.WriteString(execInfo.ReportPath);

                if (execInfo.CredentialsRequired)
                {
                    w.WriteMember("Credentials");
                    w.Write(JsonUtility.GetDataSourceCredentialJSON(execInfo.DataSourcePrompts, execInfo.ReportPath, execInfo.ExecutionID, execInfo.NumPages.ToString()));
                }

                if (execInfo.Parameters.Length != 0)
                {
                    w.WriteMember("Parameters");
                    w.Write(JsonUtility.ConvertParamemterToJSON(execInfo.Parameters, execInfo.ExecutionID, ReportServerURL, execInfo.ReportPath, execInfo.NumPages));
                }

                w.WriteEndObject();
                return w.ToString();

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                return JsonUtility.WriteExceptionJSON(e);
            }
        }

        //Navigates to a documant map node
        public string NavigateDocumentMap(string SessionID, string DocMapID)
        {
            try
            {
                rs.Credentials = GetCredentials();
                ExecutionHeader execHeader = new ExecutionHeader();
                rs.ExecutionHeaderValue = execHeader;

                rs.ExecutionHeaderValue.ExecutionID = SessionID;
                int NewPage = rs.NavigateDocumentMap(DocMapID);

                JSONTextWriter w = new JSONTextWriter();
                w.WriteStartObject();
                w.WriteMember("NewPage");
                w.WriteNumber(NewPage);
                w.WriteEndObject();
                return w.ToString();

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                return JsonUtility.WriteExceptionJSON(e);
            }
        }

        public string FindString(string SessionID, int StartPage, int EndPage, string FindString)
        {
            try
            {
                rs.Credentials = GetCredentials();
                ExecutionHeader execHeader = new ExecutionHeader();
                rs.ExecutionHeaderValue = execHeader;

                rs.ExecutionHeaderValue.ExecutionID = SessionID;
                int NewPage = rs.FindString(StartPage, EndPage, FindString);

                JSONTextWriter w = new JSONTextWriter();
                w.WriteStartObject();
                w.WriteMember("NewPage");
                w.WriteNumber(NewPage);
                w.WriteEndObject();
                return w.ToString();

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                return JsonUtility.WriteExceptionJSON(e);
            }
        }

        private string getImageHandeler(string src)
        {
            byte[] img = null;
            string retval;            
            string mimeType;

            // THis is a hack to ignore toggle images until we implement.
            if (src.Substring(0, 10) == "about:Res;")
                retval = "";
            else
            {
                int delim = src.IndexOf(";");

                //img = GetImageInternal(src.Substring(delim1 + 1, delim - delim1-1), src.Substring(delim + 1), out mimeType);
                img = GetImageInternal(src.Substring(0, delim), src.Substring(delim + 1), out mimeType);
                retval = "data:" + mimeType + ";base64, " + Convert.ToBase64String(img);
            }
            return retval;

        }

        public byte[] GetMHTfromHTML(byte[] HTML)
        {
            string sHTML = Encoding.UTF8.GetString(HTML);
            StringBuilder MHT = new StringBuilder(1024*1000);
            int LastIndex = 0;
            int NewIndex = 0;
            int EndQuote = 0;

            while (NewIndex >= 0)
            {
                NewIndex = sHTML.IndexOf("SRC=\"",LastIndex);
                if (NewIndex >=0)
                {
                    NewIndex +=5;
                    EndQuote = sHTML.IndexOf("\"",NewIndex);
                    MHT.Append(sHTML.Substring(LastIndex, NewIndex - LastIndex));
                    MHT.Append(getImageHandeler(sHTML.Substring(NewIndex, EndQuote-NewIndex)));
                    MHT.Append("\"");
                    LastIndex = EndQuote + 1;
                    //Dont get too big
                    if (MHT.Length > 1024 * 20000)
                        break;
                }
               
            }
            MHT.Append(sHTML.Substring(LastIndex));
            return Encoding.UTF8.GetBytes(MHT.ToString());
        }

        private void GenerateImage(Object context)
        {
            try
            {
                byte[] result = (byte[])context;
                string fileName = Path.GetTempPath() + Path.GetRandomFileName();
                if (!GetServerInfo().MHTMLRendering)
                {
                    result = GetMHTfromHTML(result);
                    fileName += ".htm";
                }
                else
                    fileName += ".mht";
                System.IO.File.WriteAllBytes(fileName, result);

                //Call external app to get image
                System.Diagnostics.ProcessStartInfo start = new System.Diagnostics.ProcessStartInfo();
                start.WorkingDirectory = System.Web.Hosting.HostingEnvironment.MapPath("~/") + @"bin\";
                start.FileName = @"Forerunner.Thumbnail.exe";
                String exePath = Path.Combine(start.WorkingDirectory, start.FileName);
                if (!File.Exists(exePath))
                {
                    Exception e = new System.IO.FileNotFoundException(exePath);
                    throw (e);
                }
                start.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;
                start.Arguments = fileName;
                Process p = System.Diagnostics.Process.Start(start);
                p.WaitForExit();

                result = System.IO.File.ReadAllBytes(fileName + ".jpg");
                File.Delete(fileName + ".jpg");
                this.imageResult = result;
            }
            finally
            {
                waitHandle.Set();
            }
        }

                    

        public byte[] GetThumbnail(string reportPath, string SessionID, string PageNum, double maxHeightToWidthRatio)
        {
            byte[] result = null;
            MemoryStream ms = new MemoryStream();
            string format = "MHTML";
            string historyID = null;
            string encoding;
            string mimeType;
            string extension;
            Warning[] warnings = null;
            string[] streamIDs = null;
            string NewSession;


            if (SessionID == null)
                NewSession = "";
            else
                NewSession = SessionID;

            rs.Credentials = GetCredentials();
            ExecutionInfo execInfo = new ExecutionInfo();
            ExecutionHeader execHeader = new ExecutionHeader();

            rs.ExecutionHeaderValue = execHeader;
            try
            {
                if (NewSession != "")
                    rs.ExecutionHeaderValue.ExecutionID = SessionID;
                else
                    execInfo = rs.LoadReport(reportPath, historyID);

                NewSession = rs.ExecutionHeaderValue.ExecutionID;

                if (rs.GetExecutionInfo().ParametersRequired)
                    return null;

                string devInfo = @"<DeviceInfo><Toolbar>false</Toolbar>";
                devInfo += @"<Section>" + PageNum + "</Section>";

                if (!GetServerInfo().MHTMLRendering)
                {
                   // Support for Express and Web that do not support MHTML                
                    format = "HTML4.0";

                    devInfo += @"<StreamRoot>" + NewSession + ";</StreamRoot>";
                    devInfo += @"<ReplacementRoot></ReplacementRoot>";
                    devInfo += @"<ResourceStreamRoot>Res;</ResourceStreamRoot>";
                }
                devInfo += @"</DeviceInfo>";

                result = rs.Render2(format, devInfo, Forerunner.SSRS.Execution.PageCountMode.Estimate, out extension, out encoding, out mimeType, out warnings, out streamIDs);
                execInfo = rs.GetExecutionInfo();

                ThreadPool.QueueUserWorkItem(this.GenerateImage, result);
                waitHandle.WaitOne();
                return imageResult;

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                throw e;                
            }
            finally
            {
            }
        }

        //Support print by producing a PDF, allow user to change page layout
        public byte[] PrintExport(string ReportPath, string SessionID, string PrintPropertyString, out string MimeType, out string FileName)
        {
            byte[] pdf = RenderExtension(ReportPath, SessionID, "PDF", out MimeType, out FileName, JsonUtility.GetPrintPDFDevInfo(PrintPropertyString));
            PdfDocument doc = PdfReader.Open(new MemoryStream(pdf));

            doc.AddAutoPrint();

            MemoryStream memDoc = new MemoryStream();

            doc.Save(memDoc);

            return memDoc.ToArray();
        }

        public byte[] RenderExtension(string ReportPath, string SessionID, string ExportType, out string MimeType,out string FileName, string devInfo=null)
        {
            string historyID = null;
            string encoding;
            Warning[] warnings = null;
            string[] streamIDs = null;
            string Extension = null;
            byte[] result = null;
            string NewSession = SessionID == null ? "" : SessionID;

            ExecutionInfo execInfo = new ExecutionInfo();
            ExecutionHeader execHeader = new ExecutionHeader();
            rs.Credentials = GetCredentials();
            FileName = "";
            rs.ExecutionHeaderValue = execHeader;
         
            if (NewSession != "")
                rs.ExecutionHeaderValue.ExecutionID = SessionID;
            else
                execInfo = rs.LoadReport(ReportPath, historyID);

            NewSession = rs.ExecutionHeaderValue.ExecutionID;
            
            if (ExportType == "EXCELOPENXML" && GetServerInfo().GetVersionNumber() < 2011)
                ExportType = "EXCEL";

            if (ExportType == "WORDOPENXML" && GetServerInfo().GetVersionNumber() < 2011)
                ExportType = "WORD";

            bool isJSONData = false;
            if (ExportType == "JSONDATA")
            {
                ExportType = "XML";
                isJSONData = true;
                devInfo = @"<DeviceInfo><OmitSchema>true</OmitSchema></DeviceInfo>";
            }


            if (devInfo == null)
            {
                devInfo = @"<DeviceInfo><Toolbar>false</Toolbar><Section>0</Section></DeviceInfo>";
            }
            result = rs.Render(ExportType, devInfo, out Extension, out MimeType, out encoding, out warnings, out streamIDs);
            FileName = Path.GetFileName(ReportPath).Replace(' ', '_') + "." + Extension;

            if (isJSONData)
            {
                XmlDocument doc = new XmlDocument();
                string xml = System.Text.Encoding.UTF8.GetString(result);
                doc.Load(new MemoryStream(result));
                doc.DocumentElement.Attributes.RemoveNamedItem("xmlns");

                StringBuilder json = new StringBuilder(JsonConvert.SerializeXmlNode(doc,Newtonsoft.Json.Formatting.None,false));

                //Remove the @ for attributes
                json.Replace(",\"@", ",\"").Replace("{\"@", "{\"");
                //Remove the XML header, it is always 44 chars
                json.Remove(1, 44);

                result = Encoding.UTF8.GetBytes(json.ToString());
                Extension = "json";
            }
            FileName = Path.GetFileName(ReportPath).Replace(' ', '_') + "." + Extension;
            return result;
       
      
        }

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                rs.Dispose();
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}