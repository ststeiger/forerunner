using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Reflection;
using System.Linq;
using System.Text;
using System.IO;
using Jayrock.Json;
using Forerunner.RSExec;

namespace Forerunner
{
    class RPLDateTime
    {
        public int Type;
        public Int64 MiliSec;

    }

    internal class RPLReader
    {
        Stream RPL;

        public RPLReader(Stream RPL)
        {
            this.RPL = RPL;
        }

        public long position 
        { 
            get { return RPL.Position; }
            set { RPL.Position = value; }
        }
        public byte[] GetByteArray(int size)
        {
            byte[] val = new byte[size];
            RPL.Read(val, 0, size);
            return val;
        }
        public int ReadInt32()
        {
            int retval = BitConverter.ToInt32(GetByteArray(4), 0);
            return retval;
        }
        public Int64 ReadInt64()
        {
            Int64 retval = BitConverter.ToInt64(GetByteArray(8), 0);
            return retval;
        }
        public RPLDateTime ReadDateTime()
        {
            RPLDateTime retval = new RPLDateTime();
            Int64 dt = ReadInt64();
            byte b = (byte)dt;

            retval.Type = b >> 2;
            retval.MiliSec = dt << 2;
            return retval;
        }
        public short ReadInt16()
        {
            short retval = BitConverter.ToInt16(GetByteArray(2), 0);
            return retval;
        }
        public float ReadSingle()
        {
            float retval = BitConverter.ToSingle(GetByteArray(4), 0);
            return retval;
        }
        public double ReadFloat()
        {
            double retval = BitConverter.ToDouble(GetByteArray(8), 0);
            return retval;
        }
        public char ReadChar()
        {
            char retval = Encoding.Unicode.GetChars(GetByteArray(2), 0, 2)[1];
            return retval;
        }
        public byte ReadByte()
        {
            byte retval = GetByteArray(1)[0];
            return retval;
        }
        public byte InspectByte()
        {
            byte retval = GetByteArray(1)[0];
            this.position--;            
            return retval;
        }
        public decimal ReadDecimal()
        {
            int[] bits = new int[4];
            bits[0] = ReadInt32();
            bits[2] = ReadInt32();
            bits[3] = ReadInt32();
            bits[4] = ReadInt32();

            decimal retval = new decimal(bits);
            return retval;
        }
        public Boolean ReadBoolean()
        {
            Boolean retval;

            if (ReadByte() == 1)
                retval = true;
            else
                retval = false;
            return retval;
        }
        public string ReadString()
        {
            int length;
            string retval;

            length = GetLength(0);
            retval = Encoding.Unicode.GetString(GetByteArray(length), 0, length);
            return retval;

        }
        public int GetLength(int Depth)
        {
            int Len;
            int retval;

            Len = ReadByte();
            if (Len > 127)
            {
                retval = Len - 128;
                retval += GetLength(Depth + 1) * (Depth + 1) * 128;
            }
            else
                retval = Len;

            return retval;

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
    }
}
