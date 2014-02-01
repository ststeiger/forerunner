using System;
using System.Configuration;
using System.IO;
using System.Net;
using System.Text;
using Forerunner.SSRS.Execution;
using Jayrock.Json;
using System.Diagnostics;
using Forerunner.SSRS.JSONRender;
using System.Security.Principal;
using System.Web;
using System.Web.Security;
using Forerunner.Security;
using Forerunner.Logging;
using ForerunnerLicense;

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
        private bool ServerRendering = false;
        private bool MHTMLRendering = false;
        private bool checkedServerRendering = false;
        private CurrentUserImpersonator impersonator = null;
        private int RSTimeOut = 100000;
        static private string IsDebug = ConfigurationManager.AppSettings["Forerunner.Debug"];

        public ReportViewer(String ReportServerURL, Credentials Credentials, int TimeOut = 100000)
        {
            this.ReportServerURL = ReportServerURL;
            RSTimeOut = TimeOut;
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

        internal void SetCredentials(ICredentials credentials)
        {
            this.credentials = credentials;
        }

        private ICredentials GetCredentials()
        {
            if (credentials != null)
                return credentials;

            if (AuthenticationMode.GetAuthenticationMode() == System.Web.Configuration.AuthenticationMode.Windows)
            {
                return CredentialCache.DefaultNetworkCredentials;
            }

            // Get it from Cookies otherwise
            HttpCookie authCookie = HttpContext.Current.Request.Cookies[FormsAuthentication.FormsCookieName];
            FormsAuthenticationTicket authTicket = FormsAuthentication.Decrypt(authCookie.Value);

            return new NetworkCredential(authTicket.Name, authTicket.UserData);
        }

        internal bool GetServerRendering()
        {
            if (checkedServerRendering)
            {
                return this.ServerRendering;
            }
            if (rs.Credentials == null)
                rs.Credentials = GetCredentials();
            foreach (Extension Ex in rs.ListRenderingExtensions())
            {
                if (Ex.Name == "ForerunnerJSON")
                    this.ServerRendering = true;
                if (Ex.Name == "MHTML")
                    this.MHTMLRendering = true;
                
            }
#if DEBUG 
            this.ServerRendering = false;
            //this.MHTMLRendering = false;
#endif
            checkedServerRendering = true;

            return this.ServerRendering;
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
                if (this.ServerRendering)
                    format = "ForerunnerJSON";
                else
                    format = "RPL";
                string devInfo = "";
                //devInfo += @"<DeviceInfo><MeasureItems>true</MeasureItems><SecondaryStreams>Server</SecondaryStreams><StreamNames>true</StreamNames><RPLVersion>10.6</RPLVersion><ImageConsolidation>false</ImageConsolidation>";
                //devInfo += @"<DpiX>296</DpiX><DpiY>296</DpiY>";
                //End Device Info
                //devInfo += @"</DeviceInfo>";


                result = rs.RenderStream(format, ImageID,devInfo, out encoding, out mimeType);
  
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
            JsonWriter w = new JsonTextWriter();
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
        public Stream GetReportJson(string reportPath, string SessionID, string PageNum, string parametersList, string credentials)
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
            StringWriter JSON = new StringWriter();

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
                    if (this.ServerRendering && (IsDebug != "WRPL"))
                        format = "ForerunnerJSON";
                    else
                        format = "RPL";

                    if (SessionID == null)
                        NewSession = "";
                    else
                        NewSession = SessionID;

                    //Device Info
                    string devInfo = @"<DeviceInfo><MeasureItems>true</MeasureItems><SecondaryStreams>Server</SecondaryStreams><StreamNames>true</StreamNames><RPLVersion>10.6</RPLVersion><ImageConsolidation>true</ImageConsolidation>";
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
                            return GetUTF8Bytes(JSON);
                        }
                    }

                    if (execInfo.Parameters.Length != 0 && parametersList != null)
                    {
                        execInfo = rs.SetExecutionParameters(JsonUtility.GetParameterValue(parametersList), "en-us");
                    }

                    result = rs.Render(format, devInfo, out extension, out mimeType, out encoding, out warnings, out streamIDs);
                    execInfo = rs.GetExecutionInfo();
                    numPages = execInfo.NumPages;
                    hasDocMap = execInfo.HasDocumentMap;

                }
                if (result.Length != 0)
                {
                    //Write the RPL and throw
                    if (IsDebug == "WRPL")
                         ExceptionLogGenerator.LogExceptionWithRPL("Debug", new MemoryStream(result)); 

                    JsonWriter w = new JsonTextWriter();
  
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

                    if (this.ServerRendering)
                    {
                        JSON.Write(w.ToString());
                        JSON.Write(Encoding.UTF8.GetString(result));
                    }
                    else
                    {
                        rw = new ReportJSONWriter(new MemoryStream(result));
                        JSON = new StringWriter(rw.RPLToJSON(numPages).GetStringBuilder());
                        JSON.GetStringBuilder().Insert(0, w.ToString());
                    }

                    JSON.Write("}");
                    
                    // If debug write JSON flag
                    if (IsDebug == "WJSON")
                    {
                        //File.WriteAllText("c:\\test\\BigReport.txt",JSON, Encoding.UTF8);
                        string error = string.Format("[Time: {0}]\r\n[Type: {1}]\r\n[Message: {2}]\r\n[StackTrace:\r\n{3}]\r\n[JSON: {4}]",
                            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss "),"Debug", "JSON Debug", "", JSON);
                        Logger.Trace(LogType.Error, "Debug:\r\n{0}", new object[] { error });                        
                    }
                    return GetUTF8Bytes(JSON);

                }
                else
                {
                    LicenseException.Throw(LicenseException.FailReason.SSRSLicenseError, "License Validation Failed, please see SSRS logfile");
                }
                //this should never be called
                return GetUTF8Bytes(JSON);
            }

            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                Console.WriteLine("Current user:" + HttpContext.Current.User.Identity.Name);
                JSON.Write(JsonUtility.WriteExceptionJSON(e, HttpContext.Current.User.Identity.Name));
                return GetUTF8Bytes(JSON);
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
                rs.Credentials = GetCredentials();
                ParameterValue[] values = paramList == null ? null : JsonUtility.GetParameterValue(paramList);

                if (SessionID != "" && SessionID != null)
                {
                    ExecutionHeader execHeader = new ExecutionHeader();
                    rs.ExecutionHeaderValue = execHeader;
                    rs.ExecutionHeaderValue.ExecutionID = SessionID;
                    execInfo = rs.GetExecutionInfo();
                }
                else
                    execInfo = rs.LoadReport(ReportPath, historyID);

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
                    execInfo = rs.SetExecutionParameters(values, null);


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
                JsonWriter w = new JsonTextWriter();
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

                JsonWriter w = new JsonTextWriter();
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

                JsonWriter w = new JsonTextWriter();
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

                JsonWriter w = new JsonTextWriter();
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
                    JsonReader r = new JsonBufferReader(JsonBuffer.From(JsonUtility.GetDataSourceCredentialJSON(execInfo.DataSourcePrompts, execInfo.ReportPath, execInfo.ExecutionID, execInfo.NumPages.ToString())));
                    w.WriteFromReader(r);
                }

                if (execInfo.Parameters.Length != 0)
                {
                    w.WriteMember("Parameters");
                    JsonReader r = new JsonBufferReader(JsonBuffer.From(JsonUtility.ConvertParamemterToJSON(execInfo.Parameters, execInfo.ExecutionID, ReportServerURL, execInfo.ReportPath, execInfo.NumPages)));
                    w.WriteFromReader(r);
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

                JsonWriter w = new JsonTextWriter();
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

                JsonWriter w = new JsonTextWriter();
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
            CurrentUserImpersonator newImpersonator = null;
            try
            {
                GetServerRendering();
                if (NewSession != "")
                    rs.ExecutionHeaderValue.ExecutionID = SessionID;
                else
                    execInfo = rs.LoadReport(reportPath, historyID);

                NewSession = rs.ExecutionHeaderValue.ExecutionID;

                if (rs.GetExecutionInfo().ParametersRequired)
                    return null;

                string devInfo = @"<DeviceInfo><Toolbar>false</Toolbar>";
                devInfo += @"<Section>" + PageNum + "</Section>";

                if (this.ServerRendering)
                    format = "ForerunnerThumbnail";
                if (!this.MHTMLRendering)
                {
                   // Support for Express and Web that do not support MHTML                
                    format = "HTML4.0";

                    devInfo += @"<StreamRoot>" + NewSession + ";</StreamRoot>";
                    devInfo += @"<ReplacementRoot></ReplacementRoot>";
                    devInfo += @"<ResourceStreamRoot>Res;</ResourceStreamRoot>";
                }
                devInfo += @"</DeviceInfo>";

                result = rs.Render(format, devInfo, out extension, out encoding, out mimeType, out warnings, out streamIDs);
                execInfo = rs.GetExecutionInfo();

                if (!this.ServerRendering)
                {
                    string fileName = Path.GetTempPath() + Path.GetRandomFileName();
                    if (!this.MHTMLRendering)
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
                    start.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;
                    start.Arguments = fileName;
                    Process p = System.Diagnostics.Process.Start(start);
                    p.WaitForExit();

                    result = System.IO.File.ReadAllBytes(fileName + ".jpg");
                    File.Delete(fileName + ".jpg");
                }
                
                return result;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                ExceptionLogGenerator.LogException(e);
                return null;
            }
            finally
            {
                if (newImpersonator != null)
                {
                    newImpersonator.Dispose();
                }
            }
        }

        //Support print by producing a PDF, allow user to change page layout
        public byte[] PrintExport(string ReportPath, string SessionID, string ParametersList, string PrintPropertyString, out string MimeType, out string FileName)
        {
            return RenderExtension(ReportPath, SessionID, ParametersList, "PDF", out MimeType, out FileName, JsonUtility.GetPrintPDFDevInfo(PrintPropertyString));
        }

        public byte[] RenderExtension(string ReportPath, string SessionID, string ParametersList, string ExportType, out string MimeType,out string FileName, string devInfo=null)
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
            try
            {
                if (NewSession != "")
                    rs.ExecutionHeaderValue.ExecutionID = SessionID;
                else
                    execInfo = rs.LoadReport(ReportPath, historyID);

                NewSession = rs.ExecutionHeaderValue.ExecutionID;

                if (rs.GetExecutionInfo().Parameters.Length != 0)
                {
                    if (ParametersList != null)
                    {
                        rs.SetExecutionParameters(JsonUtility.GetParameterValue(ParametersList), "en-us");
                    }
                }

                if (devInfo == null)
                {
                    devInfo = @"<DeviceInfo><Toolbar>false</Toolbar><Section>0</Section></DeviceInfo>";
                }
                result = rs.Render(ExportType, devInfo, out Extension, out MimeType, out encoding, out warnings, out streamIDs);
                FileName = Path.GetFileName(ReportPath).Replace(' ', '_') + "." + Extension;
                return result;
            }
            catch (Exception e)
            {
                MimeType = string.Empty;
                ExceptionLogGenerator.LogException(e);
                Console.WriteLine(e.Message);
                return null;
            }
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