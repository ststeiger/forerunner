using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Win32;
using System.Security.Cryptography;
using System.Net;
using System.IO;
using System.Xml;
using ForerunnerLicense;

namespace ForerunnerLicense
{
    class ClientLicense
    {
        internal string LicenseString = null;
        private const String software = "SOFTWARE";
        private const String wow6432Node = "Wow6432Node";
        private const String forerunnerKey = "Forerunnersw";       
        private const String ProductKey = "Mobilizer";
        private const String VersionKey = "Version1";
        private const String LicenseDataKey = "LicenseData";

        public LicenseData License = null;
        internal static string requestString = "<LicenseRequest><Action>{0}</Action><LicenseKey>{1}</LicenseKey>{2}<LicenseData>{3}</LicenseData></LicenseRequest>";
        RegistryKey MobV1Key = null;

        public void Load()
        {
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey(software, true);
            RegistryKey wow6432NodeKey = softwareKey.OpenSubKey(wow6432Node);
            RegistryKey forerunnerswKey = wow6432NodeKey.OpenSubKey(forerunnerKey, true);
            if (forerunnerswKey == null)
                forerunnerswKey = wow6432NodeKey.CreateSubKey(forerunnerKey);
            MobV1Key = forerunnerswKey.OpenSubKey(VersionKey, true);
            if (MobV1Key == null)
                MobV1Key = forerunnerswKey.CreateSubKey(VersionKey);

            var value = MobV1Key.GetValue(LicenseDataKey);
            if (value != null)
            {
                LicenseString = MobV1Key.GetValue(LicenseDataKey).ToString();                    
                License = new LicenseData(LicenseUtil.Verify(LicenseString, LicenseUtil.pubkey));
            }

        }

        private void DeleteLicense()
        {
            if (MobV1Key != null)
                MobV1Key.DeleteValue(LicenseDataKey);
            License = null;
        }

        private void SaveLicense()
        {
            MobV1Key.SetValue(LicenseDataKey, LicenseString);
        }
        public string GetLicenseString()
        {
            if (License != null)
                return License.LicenseKey;
            else
                return "";
        }

 
        public string Activate(string LicenceKey)
        {
            MachineId mid;
            if (License == null)
                mid = new MachineId();
            else
                mid = License.MachineData;

            string request = string.Format(requestString, "Activate", LicenceKey, mid.Serialize(false), LicenseString);
            LicenseString = Post(request);
            License = new LicenseData(LicenseUtil.Verify(LicenseString, LicenseUtil.pubkey));
            SaveLicense();
            return GetLicenseString();
        }

        public void DeActivate()
        {            
            if (License == null)
                throw new Exception("No license to De-Activate");

            string request = string.Format(requestString, "DeActivate", License.LicenseKey, License.MachineData.Serialize(false), LicenseString);
            Post(request);
            DeleteLicense();
        }

        public void Validate()
        {
            if (License == null)
                throw new Exception("No license to Validate");

            string request = string.Format(requestString, "Validate", License.LicenseKey, License.MachineData.Serialize(false), LicenseString);
            License = new LicenseData(Post(request));
        }

        public string Post(string Value)
        {
            string url = "https://forerunnersw.com/register/api/License";
#if (DEBUG)
            url = "http://localhost:13149/api/License";
#endif
            WebRequest request = WebRequest.Create (url);
            request.Method = "POST";

            // Create POST data and convert it to a byte array.            
            byte[] byteArray = Encoding.UTF8.GetBytes (Value);
            
            request.ContentType = "tesx/xml";            
            request.ContentLength = byteArray.Length;
            request.Timeout = 100000;
            
            Stream dataStream = request.GetRequestStream ();            
            dataStream.Write (byteArray, 0, byteArray.Length);          
            dataStream.Close ();
            
            WebResponse response = request.GetResponse ();
            dataStream = response.GetResponseStream ();
            StreamReader reader = new StreamReader (dataStream);
            string responseFromServer = reader.ReadToEnd ();

            reader.Close ();
            dataStream.Close ();
            response.Close ();
            return ProcessResponse(responseFromServer);

        }
        private string ProcessResponse(string response)
        {

            XmlReader XMLReq = XmlReader.Create(new StringReader(response));
            int StatusCode = 0;
            string Status = null;
            string ResponseValue = null;
            
            XMLReq.Read();
            if (XMLReq.Name != "LicenseResponse")
                throw new Exception("Invalid Response from server");
            XMLReq.Read();

            while (!XMLReq.EOF)
            {                
                switch (XMLReq.Name)
                {
                    case "Status":
                        Status = XMLReq.ReadElementContentAsString();
                        break;
                    case "StatusCode":
                        StatusCode = XMLReq.ReadElementContentAsInt();
                        break;                    
                    case "Value":
                        if (XMLReq.NodeType == XmlNodeType.Text)
                            ResponseValue = XMLReq.ReadElementContentAsString();
                        else
                            ResponseValue = XMLReq.ReadInnerXml();
                        break;
                }
                if (XMLReq.NodeType == XmlNodeType.EndElement)
                    break;
            }
            if (StatusCode != 0)
                throw new Exception(ResponseValue);
            return ResponseValue;
        }
        

        
    }
}
