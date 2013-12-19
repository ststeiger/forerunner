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
using System.Security.AccessControl;
using System.Security.Principal;
using Forerunner.Logging;

namespace ForerunnerLicense
{

    static class ClientLicense
    {
        internal static string LicenseString = null;
        private const String software = "SOFTWARE";
        private const String wow6432Node = "Wow6432Node";
        private const String forerunnerKey = "Forerunnersw";       
        private const String ProductKey = "Mobilizer";
        private const String VersionKey = "Version1";
        private const String LicenseDataKey = "LicenseData";
        private const String LicenseTimestampKey = "Timestamp";

        internal static LicenseData License = null;
        internal static string requestString = "<LicenseRequest><Action>{0}</Action><LicenseKey>{1}</LicenseKey>{2}<LicenseData>{3}</LicenseData></LicenseRequest>";
        internal static string MergerequestString = "<LicenseRequest><Action>{0}</Action><LicenseKey>{1}</LicenseKey><MergeKey>{2}</MergeKey></LicenseRequest>";
        internal static string SplitRequestString = "<LicenseRequest><Action>{0}</Action><LicenseKey>{1}</LicenseKey>{2}<LicenseData>{3}</LicenseData><NumberOfCores>{4}</NumberOfCores></LicenseRequest>";

        static RegistryKey MobV1Key = null;
        static int IsMachineSame = -1;
        internal static DateTime LastServerValidation;
        internal static DateTime LastServerValidationTry;
        internal static DateTime LastInit;
        static int LastStatus=-1;
        internal static MachineId ThisMachine = new MachineId();
        static ClientLicense()
        {
            Logger.Trace(LogType.Info, "ClientLicense Type Initializer invoked.");
            Init(false);
        }

        private static void Init(bool forceCheck)
        {
            lock (ThisMachine)
            {
                Logger.Trace(LogType.Info, "ClientLicense.Init invoked.  ForceChecked: " + forceCheck);
                TimeSpan ts = DateTime.Now - LastInit;
                if (ts.TotalMinutes > 1)
                {
                    LastInit = DateTime.Now;
                    Load(forceCheck);
                    MachineCheck(forceCheck);
                }
                Logger.Trace(LogType.Info, "ClientLicense.Init ends.");
            }
        }
        private static void MachineCheck(bool forceCheck)
        {
            if (IsMachineSame == -1 || forceCheck)
            {
                if (License != null)
                {
                    if (License.MachineData.IsSame(ThisMachine))
                        IsMachineSame = 1;
                    else
                        IsMachineSame = 0;
                }
            }
        }
        private static void Load(bool forceCheck )
        {
            Logger.Trace(LogType.Info, "ClientLicense.Load invoked.  ForceChecked: " + forceCheck);
               
            if (License != null && !forceCheck)
                return;

            
            
            if (MobV1Key == null)
            {
                Logger.Trace(LogType.Info, "ClientLicense.Load  Getting MobV1Key.");
                RegistryKey forerunnerswKey ;
                RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey(software);
          
                RegistryKey wow6432NodeKey = softwareKey.OpenSubKey(wow6432Node);
                if (wow6432NodeKey == null)
                    forerunnerswKey = softwareKey.OpenSubKey(forerunnerKey);
                else
                    forerunnerswKey = wow6432NodeKey.OpenSubKey(forerunnerKey);

                if (forerunnerswKey == null)
                {
                    if (wow6432NodeKey == null)
                    {
                        softwareKey = Registry.LocalMachine.OpenSubKey(software, true);
                        forerunnerswKey = softwareKey.CreateSubKey(forerunnerKey);
                    }
                    else
                    {
                        wow6432NodeKey = softwareKey.OpenSubKey(wow6432Node,true);
                        forerunnerswKey = wow6432NodeKey.CreateSubKey(forerunnerKey);
                    }
                }
                
                MobV1Key = forerunnerswKey.OpenSubKey(VersionKey,true);
                if (MobV1Key == null)
                {
                    Logger.Trace(LogType.Info, "ClientLicense.Load Creating the key.");
                    //Handle the beta case where forerunner key exists
                    if (wow6432NodeKey == null)
                        forerunnerswKey = softwareKey.OpenSubKey(forerunnerKey,true);
                    else
                        forerunnerswKey = wow6432NodeKey.OpenSubKey(forerunnerKey,true);

                    //  Create key and set security so everyone can read and write it                    
                    MobV1Key = forerunnerswKey.CreateSubKey(VersionKey);
                    RegistrySecurity rs = MobV1Key.GetAccessControl();
                    rs.AddAccessRule(new RegistryAccessRule(new SecurityIdentifier(WellKnownSidType.WorldSid, null), RegistryRights.FullControl, InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit, PropagationFlags.None, AccessControlType.Allow));
                    MobV1Key.SetAccessControl(rs);
                }

                Logger.Trace(LogType.Info, "ClientLicense.Load MobV1Key is " + MobV1Key.Name);
            }

            var value = MobV1Key.GetValue(LicenseDataKey);
            if (value != null)
            {
                Logger.Trace(LogType.Info, "ClientLicense.Load Verifying Key");
                string temp = MobV1Key.GetValue(LicenseDataKey).ToString();
                if (temp != LicenseString)
                {
                    LicenseString = temp;
                    Logger.Trace(LogType.Info, "ClientLicense.Load Calling LicenceUtil.Verify " + LicenseString);
                    License = new LicenseData(LicenseUtil.Verify(LicenseString, LicenseUtil.pubkey));
                }
            }
            else if (forceCheck)
            {
                License = null;
                LicenseString = null;
            }

            value = MobV1Key.GetValue(LicenseTimestampKey);
            if (value != null && !forceCheck)
            {
                try
                {
                    LastServerValidation = new DateTime(long.Parse(LicenseUtil.Verify(MobV1Key.GetValue(LicenseTimestampKey).ToString(), LicenseUtil.pubkey)), DateTimeKind.Utc);
                }
                catch
                {
                    MobV1Key.DeleteValue(LicenseTimestampKey);
                }
            }

            Logger.Trace(LogType.Info, "ClientLicense.Load ends.");
        }

        private static void DeleteLicense()
        {
            if (MobV1Key != null)
            {
                MobV1Key.DeleteValue(LicenseDataKey,false);
                MobV1Key.DeleteValue(LicenseTimestampKey, false);                
            }
            License = null;
            LicenseString = null;
        }

        private static void SaveLicense()
        {
            MobV1Key.SetValue(LicenseDataKey, LicenseString);
        }
        public static string GetLicenseString()
        {
            if (License != null)
                return "License Key:\t\t" + License.LicenseKey + "\r\n" + "SKU:\t\t\t" + License.SKU + "\r\n" + "Number of Cores:\t" + License.Quantity.ToString() + "\r\n" + "Activation Date:\t\t" + License.FirstActivationDate.ToString();
            else
                return "";
        }

        public static string Merge(string MergeKey)
        {
            ServerResponse resp;

            if (License == null)
                throw new Exception("License Required");
            string LicenseKey = License.LicenseKey;

            string request = string.Format(MergerequestString, "Merge",LicenseKey, MergeKey);
            resp = Post(request);
            if (resp.StatusCode == 0)
            {
                DeActivate();
                return Activate(LicenseKey);
            }
            else
                throw new Exception(resp.Response);
            
        }
        public static string Split(int NumCores)
        {
            ServerResponse resp;

            if (License == null)
                throw new Exception("You may only split an activated license");
            string LicenseKey = License.LicenseKey;

            string request = string.Format(SplitRequestString, "Split", License.LicenseKey, License.MachineData.Serialize(false), LicenseString, NumCores);
            resp = Post(request);
            if (resp.StatusCode == 0)
            {
                DeActivate();                
                return resp.Response;
            }
            else
                throw new Exception(resp.Response);

        }
        public static string Activate(string LicenceKey)
        {
            MachineId mid;
            ServerResponse resp;

            if (License == null)
                mid = new MachineId();
            else
                mid = License.MachineData;

            string request = string.Format(requestString, "Activate", LicenceKey, mid.Serialize(false), LicenseString);
            resp = Post(request);
            if (resp.StatusCode == 0)
            {
                LicenseString = resp.Response;
                License = new LicenseData(LicenseUtil.Verify(LicenseString, LicenseUtil.pubkey));
                SaveLicense();
                MachineCheck(true);
                return GetLicenseString();
            }
            else
                throw new Exception(resp.Response);
        }

        public static void DeActivate()
        {            
            if (License == null)
                throw new Exception("No license to De-Activate");

            string request = string.Format(requestString, "DeActivate", License.LicenseKey, License.MachineData.Serialize(false), LicenseString);
            ServerResponse resp;
            resp = Post(request);
            if (resp.StatusCode == 0)
            {
                DeleteLicense();               
            }
            else
                throw new Exception(resp.Response);
           
        }

        public static void Validate()
        {
            ServerResponse resp = new ServerResponse();
            Init(true);

            if (License == null)
                LicenseException.Throw(LicenseException.FailReason.NotActivated, "No License Detected");

            //Check Machine Key
            if (IsMachineSame != 1)
                LicenseException.Throw(LicenseException.FailReason.MachineMismatch, "License not Valid for this Machine");
            
            if (ThisMachine.numberOfCores > License.Quantity)
                LicenseException.Throw(LicenseException.FailReason.InsufficientCoreLicenses, "Insufficient Core Licenses for this Machine");

            if (License.RequireValidation == 1)
            {                
                TimeSpan LastTry = DateTime.Now - LastServerValidationTry;
                
                TimeSpan LastSucess = DateTime.Now.ToUniversalTime() - LastServerValidation;
                if (LastSucess.TotalDays > 1)
                {
                    resp.StatusCode = LastStatus;
                    if (LastTry.TotalMinutes > 5)
                    {
                        try
                        {
                            LastServerValidationTry = DateTime.Now;
                            string request = string.Format(requestString, "Validate", License.LicenseKey, License.MachineData.Serialize(false), LicenseString);
                            resp = Post(request);
                            LastStatus = resp.StatusCode;
                        }
                        catch
                        {
                            //This is a network error give us 14 days to fix
                            if (LastSucess.TotalDays > 14)
                                LicenseException.Throw(LicenseException.FailReason.LicenseValidationError, "Cannot Validate License with Server");
                            return;
                        }
                    }

                    if (resp.StatusCode != 0)
                    {
                        if (resp.StatusCode == 200)
                            LicenseException.Throw(LicenseException.FailReason.Expired, "Subscritpion Expired");
                        else if (resp.StatusCode == 105)
                            LicenseException.Throw(LicenseException.FailReason.InvalidKey, "Invalid License Key");
                        //This is a server error handle like network error give us 14 days to fix
                        else
                        {
                            if (LastSucess.TotalDays > 14)
                                LicenseException.Throw(LicenseException.FailReason.LicenseValidationError, "Cannot Validate License with Server");
                        }

                    }
                    else
                    {
                        // This needs to be thread safe.
                        lock (ThisMachine)
                        {
                            LastServerValidation = new DateTime(long.Parse(LicenseUtil.Verify(resp.Response, LicenseUtil.pubkey)), DateTimeKind.Utc);
                            MobV1Key.SetValue(LicenseTimestampKey, resp.Response);
                        }
                    }
                }

            }
           


        }

        public static ServerResponse Post(string Value)
        {
           string url = "https://forerunnersw.com/register/api/License";

           //string url = "http://localhost:13149/api/License";

            WebRequest request = WebRequest.Create (url);
            request.Method = "POST";

            // Create POST data and convert it to a byte array.            
            byte[] byteArray = Encoding.UTF8.GetBytes (Value);
            
            request.ContentType = "text/xml";            
            request.ContentLength = byteArray.Length;
            request.Timeout = 100000;

            string responseFromServer = "";
            using (Stream dataStream = request.GetRequestStream())
            {
                dataStream.Write(byteArray, 0, byteArray.Length);
                dataStream.Close();

                using (WebResponse response = request.GetResponse())
                {
                    using (Stream dataStream2 = response.GetResponseStream())
                    {
                        StreamReader reader = new StreamReader(dataStream2);
                        responseFromServer = reader.ReadToEnd();
                    }
                }
            }
            return ProcessResponse(responseFromServer);

        }
        private static ServerResponse ProcessResponse(string response)
        {

            XmlReader XMLReq = XmlReader.Create(new StringReader(response));
            ServerResponse Resp = new ServerResponse();

            XMLReq.Read();
            if (XMLReq.Name != "LicenseResponse")
                throw new Exception("Invalid Response from server");
            XMLReq.Read();


            while (!XMLReq.EOF)
            {                
                switch (XMLReq.Name)
                {
                    case "Status":
                        Resp.Status = XMLReq.ReadElementContentAsString();
                        break;
                    case "StatusCode":
                        Resp.StatusCode = XMLReq.ReadElementContentAsInt();
                        break;                    
                    case "Value":
                        if (XMLReq.NodeType == XmlNodeType.Text)
                            Resp.Response = XMLReq.ReadElementContentAsString();
                        else
                            Resp.Response = XMLReq.ReadInnerXml();
                        break;
                }
                if (XMLReq.NodeType == XmlNodeType.EndElement)
                    break;
            }
            return Resp;
        }
        

        
    }

    class ServerResponse
    {
        public int StatusCode = -1;
        public string Status = null;
        public string Response = null;


    }


}
