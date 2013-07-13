using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Linq;
using System.Text;
using System.IO;
using Jayrock.Json;
using Forerunner.SSRS.Execution;

namespace Forerunner
{
    public enum ReportServerProtocalEnum { HTTP, HTTPS };
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

        public string GetDomainUser()
        {
            if (this.Domain.Length > 15)
                return this.Domain.Substring(0, 15).ToUpper() + "\\" + this.UserName;
            else
                return this.Domain.ToUpper() + "\\" + this.UserName;
        }


    }
 

    public static class JsonUtility
    {
        internal static ParameterValue[] GetParameterValue(string parameterList)
        {
            List<ParameterValue> list = new List<ParameterValue>();

            using (JsonTextReader reader = new JsonTextReader(new StringReader(parameterList)))
            {
                JsonObject jsonObj = new JsonObject();
                jsonObj.Import(reader);

                JsonArray parameterArray = jsonObj["ParamsList"] as JsonArray;

                foreach (JsonObject obj in parameterArray)
                {
                    if (obj["IsMultiple"].ToString() == "True")
                    {
                        string temp = obj["Value"].ToString();
                        foreach (string str in temp.Split(','))
                        {
                            ParameterValue pv = new ParameterValue();
                            pv.Name = obj["Parameter"].ToString();
                            pv.Value = str;
                            list.Add(pv);
                        }

                    }
                    else
                    {
                        ParameterValue pv = new ParameterValue();
                        pv.Name = obj["Parameter"].ToString();
                        pv.Value = obj["Value"].ToString().ToLower() == "null" ? null : obj["Value"].ToString();
                        list.Add(pv);
                    }
                }

                return list.ToArray();
            }
        }

        public static string WriteExceptionJSON(Exception e)
        {
            JsonWriter w = new JsonTextWriter();
            w.WriteStartObject();
            w.WriteMember("Exception");
            w.WriteStartObject();
            w.WriteMember("Type");
            w.WriteString(e.GetType().ToString());
            w.WriteMember("TargetSite");
            w.WriteString(e.TargetSite.ToString());
            w.WriteMember("Source");
            w.WriteString(e.Source);
            w.WriteMember("Message");
            w.WriteString(e.Message);
            w.WriteMember("StackTrace");
            w.WriteString(e.StackTrace);
            w.WriteEndObject();
            w.WriteEndObject();

            return w.ToString();
        }

        public static string ConvertParamemterToJSON(ReportParameter[] parametersList, string SessionID, string ReportServerURL, string reportPath, int NumPages)
        {
            JsonWriter w = new JsonTextWriter();
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
                    DefaultExist = true;
                    DefaultValueCount++;

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

        public static string ConvertDocumentMapToJSON(DocumentMapNode DocumentMap)
        {
            JsonWriter w = new JsonTextWriter();
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
                    ConvertDocumentMapToJSON(Child);
                    w.WriteEndObject();
                }
                w.WriteEndArray();
            }

            return w.ToString();
        }
        internal static string GetDocMapJSON(DocumentMapNode DocumentMap)
        {
            JsonWriter w = new JsonTextWriter();

            w.WriteMember("DocumentMap");
            w.WriteStartObject();
            JsonUtility.ConvertDocumentMapToJSON(DocumentMap);
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


    }
}
