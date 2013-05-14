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


namespace Forerunner.ReportViewer
{
    public class Credentials
    {
        public enum SecurityTypeEnum { Network = 0, Custom = 1 };
        public SecurityTypeEnum SecurityType = SecurityTypeEnum.Network;
        public string UserName;
        public string Domain;
        public string Password;

        public Credentials() { }
        public Credentials(SecurityTypeEnum SecurityType = SecurityTypeEnum.Network, String UserName = "", string Domain = "", string Password = "")
        {
            this.SecurityType = SecurityType;
            this.UserName = UserName;
            this.Password = Password;
            this.Domain = Domain;
        }

    }
    
    public class ReportViewer
    {
        String ReportServerURL;
        Credentials Credentials = new Credentials();
        ReportExecutionService rs = new ReportExecutionService();
        string ReportViewerAPIPath = "/api/ReportViewer";
        public enum ReportServerProtocalEnum { HTTP, HTTPS };
        public ReportServerProtocalEnum ReportServerProtocal = ReportServerProtocalEnum.HTTP;

        public ReportViewer(String ReportServerURL, Credentials Credentials)
        {
            this.ReportServerURL = ReportServerURL;
            SetRSURL();
            SetCredentials(Credentials);
        }
        private void SetRSURL()
        {
            if (ReportServerProtocal == ReportServerProtocalEnum.HTTP)
                rs.Url = "http://" + ReportServerURL + "/ReportExecution2005.asmx";
            else
                rs.Url = "https://" + ReportServerURL + "/ReportExecution2005.asmx";
        }
        public ReportViewer(String ReportServerURL, string ReportViewerAPIPath = "/api/ReportViewer", ReportServerProtocalEnum ReportServerProtocal = ReportServerProtocalEnum.HTTP)
        {
            this.ReportServerURL = ReportServerURL;
            this.ReportViewerAPIPath = ReportViewerAPIPath;
            this.ReportServerProtocal = ReportServerProtocal;
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

        public void pingSession(string reportPath, string SessionID)
        {
            byte[] result = null;
            string format = "RPL";
            string encoding;
            string mimeType;
            string extension;
            Warning[] warnings = null;
            string[] streamIDs = null;
            string devInfo = @"<DeviceInfo></DeviceInfo>";

            if (SessionID != "" && SessionID != null)
            {
                ExecutionHeader execHeader = new ExecutionHeader();
                rs.ExecutionHeaderValue = execHeader;
                rs.ExecutionHeaderValue.ExecutionID = SessionID;

                result = rs.Render(format, devInfo, out extension, out encoding, out mimeType, out warnings, out streamIDs);
            }
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
            //Thread.Sleep(1000);

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

                if (rs.GetExecutionInfo().Parameters.Length != 0)
                {
                    if (parametersList == null)
                    {
                        ReportParameter[] reportParameter = execInfo.Parameters;
                        return ConvertParamemterToJSON(reportParameter, NewSession, ReportServerURL, reportPath, execInfo.NumPages);
                    }
                    else
                    {
                        rs.SetExecutionParameters(JsonUtility.GetParameterValue(parametersList), "en-us");
                    }
                }

                result = rs.Render(format, devInfo, out extension, out encoding, out mimeType, out warnings, out streamIDs);
                execInfo = rs.GetExecutionInfo();
                if (result.Length != 0)
                    return rw.RPLToJSON(result, NewSession, ReportServerURL, reportPath, execInfo.NumPages);
                else
                    return "";

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return e.Message;
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
        public byte[] GetThumbnail(string reportPath, string SessionID, string PageNum, string PageHeight, string PageWidth)
        {                      
            MemoryStream ms = new MemoryStream();
            byte[] result = null;
            string format = "HTML4.0";
            string historyID = null;
            string showHideToggle = null;
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
                devInfo += @"<StreamRoot>" + NewSession + ";</StreamRoot>";
                devInfo += @"<ReplacementRoot></ReplacementRoot>";
                devInfo += @"<ResourceStreamRoot>Res;</ResourceStreamRoot>"; 
                devInfo += @"</DeviceInfo>";

                result = rs.Render(format, devInfo, out extension, out encoding, out mimeType, out warnings, out streamIDs);
                execInfo = rs.GetExecutionInfo();

                WebSiteThumbnail.GetStreamThumbnail(Encoding.UTF8.GetString(result), 150, 200, getImageHandeler).Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);
                return ms.ToArray();
                          

            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return null;
            }
        }
        
        private string ConvertParamemterToJSON(ReportParameter[] parametersList, string SessionID, string ReportServerURL, string reportPath, int NumPages)
        {
            JsonWriter w = new JsonTextWriter();
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
                            w.WriteString("");
                        else
                            w.WriteString(proInfo.GetValue(parameter, null).ToString());
                    }
                }

                w.WriteMember("DefaultValues");
                if (parameter.DefaultValues != null)
                {
                    w.WriteStartArray();
                    foreach (string item in parameter.DefaultValues)
                    {
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
                        w.WriteMember("Key");
                        w.WriteString(item.Label);
                        w.WriteMember("Value");
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
         
            w.WriteEndObject();

            return w.ToString();
        }
    }



        
}