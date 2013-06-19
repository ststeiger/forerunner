using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.IO;
using System.Web.Services;
using Forerunner.RSExec;
using System.Diagnostics;
using System.Net;
using Jayrock.Json;
using System.Threading;
using System.Reflection;
using Forerunner;


namespace Forerunner.Viewer
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

    public class ReportViewer
    {
        String ReportServerURL;
        Credentials Credentials = new Credentials();
        ReportExecutionService rs = new ReportExecutionService();
        string ReportViewerAPIPath = "/api/ReportViewer";

        public ReportViewer(String ReportServerURL, Credentials Credentials)
        {
            this.ReportServerURL = ReportServerURL;
            SetRSURL();
            SetCredentials(Credentials);
        }
        private void SetRSURL()
        {
            rs.Url = ReportServerURL + "/ReportExecution2005.asmx";
        }
        public ReportViewer(String ReportServerURL, string ReportViewerAPIPath = "/api/ReportViewer")
        {
            this.ReportServerURL = ReportServerURL;
            this.ReportViewerAPIPath = ReportViewerAPIPath;
            SetRSURL();
        }

        public void SetCredentials(Credentials Credentials)
        {
            this.Credentials = Credentials;
            //Security
            if (this.Credentials.SecurityType == Credentials.SecurityTypeEnum.Network)
                rs.Credentials = System.Net.CredentialCache.DefaultCredentials;
            else
                rs.Credentials = new NetworkCredential(this.Credentials.UserName, this.Credentials.Password, this.Credentials.Domain);
        }

        public byte[] GetImage(string SessionID, string ImageID, out string mimeType)
        {
            ExecutionInfo execInfo = new ExecutionInfo();
            ExecutionHeader execHeader = new ExecutionHeader();
            byte[] result = null;
            string encoding;

            rs.ExecutionHeaderValue = execHeader;
            rs.ExecutionHeaderValue.ExecutionID = SessionID;

            try
            {
                result = rs.RenderStream("RPL", ImageID, "", out encoding, out mimeType);
                return result;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                mimeType = "";
                return null;
            }

        }
        public string GetReportScript()
        {
            string script = "";

            script += "<script src='/Scripts/jquery-1.7.1.min.js'></script>";
            script += "<script src='/Scripts/Models/FRReport.js'></script>";
            return script;
        }
        public string GetReportInitScript(string reportPath)
        {
            string script = "";
            string UID = Guid.NewGuid().ToString("N");

            script += "<div id='" + UID + "'></div>";
            script += "<script>InitReport('" + ReportServerURL + "','" + ReportViewerAPIPath + "','" + reportPath + "',true, 1,'" + UID + "')</script>";
            return script;
        }

        public byte[] NavigateTo(string NavType, string SessionID, string UniqueID)
        {
            
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
                catch (Exception e) {
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
            string format = "RPL";
            string historyID = null;
            string showHideToggle = null;
            string encoding;
            string mimeType;
            string extension;
            Warning[] warnings = null;
            ParameterValue[] reportHistoryParameters = null;
            string[] streamIDs = null;
            string NewSession;
            ReportJSONWriter rw = new ReportJSONWriter();


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

            //Delay just for testing
            //Thread.Sleep(2000);

            DataSourceCredentials[] credentials = null;
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
               
                if (parametersList != null)
                {
                    rs.SetExecutionParameters(JsonUtility.GetParameterValue(parametersList), "en-us");
                }
                
                result = rs.Render(format, devInfo, out extension, out mimeType, out encoding, out warnings, out streamIDs);
                execInfo = rs.GetExecutionInfo();
                if (result.Length != 0)
                    return rw.RPLToJSON(result, NewSession, ReportServerURL, reportPath, execInfo.NumPages, rs.GetDocumentMap());
                else
                    return "";

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return JsonUtility.WriteExceptionJSON(e);//return e.Message;
            }
        }

        public string GetParameterJson(string ReportPath)
        {
            string historyID = null;
            string NewSession;
            ReportJSONWriter rw = new ReportJSONWriter();
            ExecutionInfo execInfo = new ExecutionInfo();

            try
            {
                execInfo = rs.LoadReport(ReportPath, historyID);
                NewSession = rs.ExecutionHeaderValue.ExecutionID;
                
                if (rs.GetExecutionInfo().Parameters.Length != 0)
                {
                    ReportParameter[] reportParameter = execInfo.Parameters;
                    return rw.ConvertParamemterToJSON(reportParameter, NewSession, ReportServerURL, ReportPath, execInfo.NumPages);
                }
                return "{\"Type\":\"\"}";
            }
            catch (Exception e)
            {                
                Console.WriteLine(e.Message);
                return JsonUtility.WriteExceptionJSON(e); //return e.Message;
            }
        }

        /// <summary>
        /// Sort data by special column field and sort direction
        /// </summary>
        public string SortReport(string SessionID, string SortItem, string Direction)
        {
            try
            {
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
                return JsonUtility.WriteExceptionJSON(e); //return e.Message;
            }
        }

        //Toggles the show/hide item in a report.
        public string ToggleItem(string SessionID, string ToggleID)
        {
            try
            {
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
                return JsonUtility.WriteExceptionJSON(e); //return e.Message;
            }
        }

        //Navigates to a specific bookmark in the report.
        public string NavBookmark(string SessionID, string BookmarkID)
        {
            try
            {
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
                return JsonUtility.WriteExceptionJSON(e); //return e.Message;
            }
        }


        //Navigates to a Drillthough report
        public string NavigateDrillthrough(string SessionID, string DrillthroughID)
        {
            try
            {
                ExecutionHeader execHeader = new ExecutionHeader();
                rs.ExecutionHeaderValue = execHeader;

                rs.ExecutionHeaderValue.ExecutionID = SessionID;
                
               ExecutionInfo execInfo = rs.LoadDrillthroughTarget(DrillthroughID);

                JsonWriter w = new JsonTextWriter();
                w.WriteStartObject();
                w.WriteMember("SessionID");
                w.WriteString(execInfo.ExecutionID);
                w.WriteMember("ParametersRequired");
                w.WriteBoolean(execInfo.ParametersRequired);
                
                if (execInfo.Parameters.Length != 0)
                {
                    w.WriteMember("Parameters");
                    ReportJSONWriter rw = new ReportJSONWriter();
                    JsonReader r = new JsonBufferReader(JsonBuffer.From(rw.ConvertParamemterToJSON(execInfo.Parameters, execInfo.ExecutionID, ReportServerURL, execInfo.ReportPath, execInfo.NumPages)));
                    w.WriteFromReader(r);
                }
                w.WriteEndObject();
                return w.ToString();

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return JsonUtility.WriteExceptionJSON(e);  //return e.Message;
            }
        }

        //Navigates to a documant map node
        public string NavigateDocumentMap(string SessionID, string DocMapID)
        {
            try
            {
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
                return JsonUtility.WriteExceptionJSON(e); // return e.Message;
            }
        }

        public string FindString(string SessionID, int StartPage, int EndPage, string FindString)
        {
            try
            {
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
                return JsonUtility.WriteExceptionJSON(e); // return e.Message;
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

                img = GetImage(src.Substring(delim1 + 1, delim - delim1-1), src.Substring(delim + 1), out mimeType);

                retval = "data:" + mimeType + ";base64, " + Convert.ToBase64String(img);
            }
            return retval;

        }
        public byte[] GetThumbnail(string reportPath, string SessionID, string PageNum, double maxHeightToWidthRatio)
        {
            byte[] result = null;                       
            //TODO: Need to add code to detect if MHTML is supported, not supported in Web and Express.  If not supported use the commented out code.          
            MemoryStream ms = new MemoryStream();           
            //string format = "HTML4.0";
            string format = "MHTML";
            string historyID = null;
            string encoding;
            string mimeType;
            string extension;
            Warning[] warnings = null;
            ParameterValue[] reportHistoryParameters = null;
            string[] streamIDs = null;
            string NewSession;
           
            if (SessionID == null)
                NewSession = "";
           
            else
                NewSession = SessionID;

            

            DataSourceCredentials[] credentials = null;
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

                //Device Info
                string devInfo = @"<DeviceInfo><Toolbar>false</Toolbar>";
                devInfo += @"<Section>" + PageNum + "</Section>";
                //devInfo += @"<StreamRoot>" + NewSession + ";</StreamRoot>";
                //devInfo += @"<ReplacementRoot></ReplacementRoot>";
                //devInfo += @"<ResourceStreamRoot>Res;</ResourceStreamRoot>"; 
                devInfo += @"</DeviceInfo>";

                result = rs.Render(format, devInfo, out extension, out encoding, out mimeType, out warnings, out streamIDs);
                execInfo = rs.GetExecutionInfo();

                //WebSiteThumbnail.GetStreamThumbnail(Encoding.UTF8.GetString(result), getImageHandeler).Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);
                WebSiteThumbnail.GetStreamThumbnail(result, maxHeightToWidthRatio).Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);
                result = ms.ToArray();
                
                return result; 
                          

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return null;
            }
        }

        public byte[] GetRenderExtension(string ReportPath, string SessionID, string parametersList, RenderFormat Type, out string MimeType)
        {
            string historyID = null;
            string encoding;
            string extension;
            Warning[] warnings = null;
            string[] streamIDs = null;

            string NewSession = SessionID == null ? "" : SessionID;

            ExecutionInfo execInfo = new ExecutionInfo();
            ExecutionHeader execHeader = new ExecutionHeader();

            rs.ExecutionHeaderValue = execHeader;
            try
            {
                if (NewSession != "")
                    rs.ExecutionHeaderValue.ExecutionID = SessionID;
                else
                    execInfo = rs.LoadReport(ReportPath, historyID);

                NewSession = rs.ExecutionHeaderValue.ExecutionID;

                if (rs.GetExecutionInfo().ParametersRequired)
                {
                    if (parametersList != null)
                    {
                        rs.SetExecutionParameters(JsonUtility.GetParameterValue(parametersList), "en-us");
                    }
                }

                string devInfo = @"<DeviceInfo><Toolbar>false</Toolbar><Section>0</Section></DeviceInfo>";

                return rs.Render(Type.ToString(), devInfo, out extension, out MimeType, out encoding, out warnings, out streamIDs);
            }
            catch (Exception e)
            {
                MimeType = string.Empty;
                Console.WriteLine(e.Message);
                return null;
            }
        }
    }
}