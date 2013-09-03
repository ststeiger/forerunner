using System;
using System.IO;
using System.Net;
using System.Text;
using Forerunner.SSRS.Execution;
using Jayrock.Json;
using System.Diagnostics;
using Forerunner.SSRS.JSONRender;
using Forerunner.Thumbnail;
using System.Security.Principal;
using System.Web;
using System.Web.Security;
using Forerunner.Security;

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
        private bool checkedServerRendering = false;
        private CurrentUserImpersonator impersonator = null;

        public ReportViewer(String ReportServerURL, Credentials Credentials)
        {
            this.ReportServerURL = ReportServerURL;
            SetRSURL();
            GetServerRendering();
        }
        private void SetRSURL()
        {
            rs.Url = ReportServerURL + "/ReportExecution2005.asmx";
        }

        internal void SetImpersonator(CurrentUserImpersonator impersonator)
        {
            this.impersonator = impersonator;
        }

        public ReportViewer(String ReportServerURL)
        {
            this.ReportServerURL = ReportServerURL;
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
                {
                    this.ServerRendering = true;
                    break;
                }
            }
            //this.ServerRendering = false;
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
                result = rs.RenderStream("RPL", ImageID, "", out encoding, out mimeType);
                if (mimeType == null)
                    mimeType = JsonUtility.GetMimeTypeFromBytes(result);
                return result;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
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

        public string GetReportJson(string reportPath, string SessionID, string PageNum, string parametersList)
        {
            byte[] result = null;
            string format;
            string historyID = null;
            string encoding;
            string mimeType;
            string extension;
            Warning[] warnings = null;
            string[] streamIDs = null;
            string NewSession;
            ReportJSONWriter rw;

            rs.Credentials = GetCredentials();
            GetServerRendering();
            if (this.ServerRendering)
                format = "ForerunnerJSON";
            else
                format = "RPL";

            if (SessionID == null)
                NewSession = "";
            else
                NewSession = SessionID;

            //Device Info
            string devInfo = @"<DeviceInfo><MeasureItems>true</MeasureItems><SecondaryStreams>Server</SecondaryStreams><StreamNames>true</StreamNames><RPLVersion>10.6</RPLVersion><ImageConsolidation>false</ImageConsolidation>";
            //Page number   
            devInfo += @"<StartPage>" + PageNum + "</StartPage><EndPage>" + PageNum + "</EndPage>";
            //End Device Info
            devInfo += @"</DeviceInfo>";

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

                if (rs.GetExecutionInfo().Parameters.Length != 0 && parametersList != null)
                {
                    rs.SetExecutionParameters(JsonUtility.GetParameterValue(parametersList), "en-us");
                }

                result = rs.Render(format, devInfo, out extension, out mimeType, out encoding, out warnings, out streamIDs);
                execInfo = rs.GetExecutionInfo();
                if (result.Length != 0)
                {
                    rw = new ReportJSONWriter(new MemoryStream(result));
                    JsonWriter w = new JsonTextWriter();
                    JsonReader r;

                    //Read Report Object
                    w.WriteStartObject();
                    w.WriteMember("SessionID");
                    w.WriteString(NewSession);
                    w.WriteMember("ReportServerURL");
                    w.WriteString(ReportServerURL);
                    w.WriteMember("ReportPath");
                    w.WriteString(reportPath);
                    w.WriteMember("HasDocMap");
                    w.WriteBoolean(execInfo.HasDocumentMap);
                    w.WriteMember("ReportContainer");
                    if (this.ServerRendering)
                        r = new JsonBufferReader(JsonBuffer.From(Encoding.UTF8.GetString(result)));
                    else
                        r = new JsonBufferReader(JsonBuffer.From(rw.RPLToJSON(execInfo.NumPages)));
                    w.WriteFromReader(r);
                    w.WriteEndObject();

                    Debug.WriteLine(w.ToString());
                    return w.ToString();

                }
                else
                    return "";

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                Console.WriteLine("Current user:" + HttpContext.Current.User.Identity.Name);
                return JsonUtility.WriteExceptionJSON(e, HttpContext.Current.User.Identity.Name);
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
                return JsonUtility.WriteExceptionJSON(e);
            }
        }
        public string GetParameterJson(string ReportPath)
        {
            string historyID = null;
            string NewSession;
            ExecutionInfo execInfo = new ExecutionInfo();

            try
            {
                rs.Credentials = GetCredentials();
                execInfo = rs.LoadReport(ReportPath, historyID);
                NewSession = rs.ExecutionHeaderValue.ExecutionID;

                if (rs.GetExecutionInfo().Parameters.Length != 0)
                {
                    ReportParameter[] reportParameter = execInfo.Parameters;
                    return JsonUtility.ConvertParamemterToJSON(reportParameter, NewSession, ReportServerURL, ReportPath, execInfo.NumPages);
                }
                return "{\"Type\":\"\"}";
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                Console.WriteLine("Current user:" + HttpContext.Current.User.Identity.Name);
                return JsonUtility.WriteExceptionJSON(e, HttpContext.Current.User.Identity.Name); //return e.Message;
            }
        }

        /// <summary>
        /// Sort data by special column field and sort direction
        /// </summary>
        public string SortReport(string SessionID, string SortItem, string Direction)
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
                int newPage = rs.Sort(SortItem, SortDirection, true, out ReportItem, out NumPages);
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
                w.WriteMember("ParametersRequired");
                w.WriteBoolean(execInfo.Parameters.Length != 0 ? true : false);
                w.WriteMember("ReportPath");
                w.WriteString(execInfo.ReportPath);

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
                int delim1 = src.IndexOf(":");
                int delim = src.IndexOf(";");

                img = GetImageInternal(src.Substring(delim1 + 1, delim - delim1-1), src.Substring(delim + 1), out mimeType);
                retval = "data:" + mimeType + ";base64, " + Convert.ToBase64String(img);
            }
            return retval;

        }

        public byte[] GetThumbnail(string reportPath, string SessionID, string PageNum, double maxHeightToWidthRatio)
        {
            byte[] result = null;
            MemoryStream ms = new MemoryStream();
            string format = "HTML4.0";
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
                else
                {
                    devInfo += @"<StreamRoot>" + NewSession + ";</StreamRoot>";
                    devInfo += @"<ReplacementRoot></ReplacementRoot>";
                    devInfo += @"<ResourceStreamRoot>Res;</ResourceStreamRoot>";
                }
                devInfo += @"</DeviceInfo>";

                result = rs.Render(format, devInfo, out extension, out encoding, out mimeType, out warnings, out streamIDs);
                execInfo = rs.GetExecutionInfo();

                if (!this.ServerRendering)
                {
                    WebSiteThumbnail.GetStreamThumbnail(Encoding.UTF8.GetString(result), maxHeightToWidthRatio, getImageHandeler, impersonator).Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);
                    result = ms.ToArray();
                }

                return result;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return null;
            }
        }

        public byte[] RenderExtension(string ReportPath, string SessionID, string ParametersList, string ExportType, out string MimeType,out string FileName)
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

                string devInfo = @"<DeviceInfo><Toolbar>false</Toolbar><Section>0</Section></DeviceInfo>";
                result = rs.Render(ExportType, devInfo, out Extension, out MimeType, out encoding, out warnings, out streamIDs);
                FileName = Path.GetFileName(ReportPath).Replace(' ', '_') + "." + Extension;
                return result;
            }
            catch (Exception e)
            {
                MimeType = string.Empty;
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