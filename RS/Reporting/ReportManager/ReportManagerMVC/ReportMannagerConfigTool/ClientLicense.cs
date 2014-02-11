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
        private const String VersionKey = "Version2";
        private const String LicenseDataKey = "LicenseData";
        private const String LicenseTimestampKey = "Timestamp";

        private static LicenseData license = null;
        internal static LicenseData GetLicense()
        {
            if (license == null)
            {
                Init(false);
            }
            return license;
        }
        internal static string requestString = "<LicenseRequest><Action>{0}</Action><LicenseKey>{1}</LicenseKey>{2}<LicenseData>{3}</LicenseData></LicenseRequest>";
        internal static string MergerequestString = "<LicenseRequest><Action>{0}</Action><LicenseKey>{1}</LicenseKey><MergeKey>{2}</MergeKey></LicenseRequest>";
        internal static string SplitRequestString = "<LicenseRequest><Action>{0}</Action><LicenseKey>{1}</LicenseKey>{2}<LicenseData>{3}</LicenseData><NumberOfCores>{4}</NumberOfCores></LicenseRequest>";

        static RegistryKey MobV1Key = null;
        static int IsMachineSame = -1;
        internal static DateTime LastServerValidation;
        internal static DateTime LastServerValidationTry;
        internal static DateTime LastInit;
        static int LastStatus = -1;
        internal static MachineId ThisMachine = null;
        internal static int MachineIdRetryCount = 0;
        internal static Object MachineIdLock = new Object();
        static ClientLicense()
        {
            Logger.Trace(LogType.Info, "ClientLicense Type Initializer invoked.");
        }

        private static void Init(bool forceCheck)
        {
            lock (MachineIdLock)
            {
                if (ThisMachine == null && MachineIdRetryCount < 100)
                {
                    try
                    {
                        ThisMachine = new MachineId();
                    }
                    catch (Exception /*e*/)
                    {
                        MachineIdRetryCount++;
                        ThisMachine = null;
                    }
                }
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
                LicenseData License = GetLicense();
                if (License != null && ThisMachine != null)
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
               
            if (license != null && !forceCheck)
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
                    license = new LicenseData(LicenseUtil.Verify(LicenseString, LicenseUtil.pubkey));
                }
            }
            else 
            {
                Logger.Trace(LogType.Info, "ClientLicense.Load Failed to load License Data from reg");
                if (forceCheck)
                {
                    license = null;
                    LicenseString = null;
                }
            }
            

            value = MobV1Key.GetValue(LicenseTimestampKey);
            if (value != null && (!forceCheck || LastServerValidation == DateTime.MinValue) )
            {
                Logger.Trace(LogType.Info, "ClientLicense get Last Server Validation time");
                try
                {
                    LastServerValidation = new DateTime(long.Parse(LicenseUtil.Verify(MobV1Key.GetValue(LicenseTimestampKey).ToString(), LicenseUtil.pubkey)), DateTimeKind.Utc);
                }
                catch
                {
                    Logger.Trace(LogType.Info, "ClientLicense failed to load or parse LastServerValidation");
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
            license = null;
            LicenseString = null;
        }

        private static void SaveLicense()
        {
            MobV1Key.SetValue(LicenseDataKey, LicenseString);
        }
        public static string GetLicenseString()
        {
            LicenseData License = GetLicense();
            if (License != null)
                return "License Key:\t\t" + License.LicenseKey + "\r\n" + "SKU:\t\t\t" + License.SKU + "\r\n" + "Number of Cores:\t" + License.Quantity.ToString() + "\r\n" + "Activation Date:\t\t" + License.FirstActivationDate.ToString();
            else
                return "";
        }

        public static string Merge(string MergeKey)
        {
            ServerResponse resp;

            LicenseData License = GetLicense();
            if (License == null)
                LicenseException.Throw(LicenseException.FailReason.Other, "License Required");
            string LicenseKey = License.LicenseKey;

            string request = string.Format(MergerequestString, "Merge",LicenseKey, MergeKey);
            resp = Post(request);
            if (resp.StatusCode == 0)
            {
                DeActivate();
                return Activate(LicenseKey);
            }
            else
            {
                LicenseException.Throw(LicenseException.FailReason.Other, resp.Response);
                return null;
            }
            
        }
        public static string Split(int NumCores)
        {
            ServerResponse resp;

            LicenseData License = GetLicense();
            if (License == null)
                LicenseException.Throw(LicenseException.FailReason.Other, "You may only split an activated license");
            string LicenseKey = License.LicenseKey;

            string request = string.Format(SplitRequestString, "Split", License.LicenseKey, License.MachineData.Serialize(false), LicenseString, NumCores);
            resp = Post(request);
            if (resp.StatusCode == 0)
            {
                DeActivate();
                return resp.Response;
            }
            else
            {
                LicenseException.Throw(LicenseException.FailReason.Other, resp.Response);
                return null;
            }

        }
        public static string Activate(string LicenceKey)
        {
            MachineId mid;
            ServerResponse resp;

            LicenseData License = GetLicense();
            if (License == null)
                mid = new MachineId();
            else
                mid = License.MachineData;

            string request = string.Format(requestString, "Activate", LicenceKey, mid.Serialize(false), LicenseString);
            resp = Post(request);
            if (resp.StatusCode == 0)
            {
                LicenseString = resp.Response;
                license = new LicenseData(LicenseUtil.Verify(LicenseString, LicenseUtil.pubkey));
                SaveLicense();
                MachineCheck(true);
                return GetLicenseString();
            }
            else
            {
                LicenseException.Throw(LicenseException.FailReason.Other, resp.Response);
                return null;
            }
        }

        public static void DeActivate()
        {
            LicenseData License = GetLicense();
            if (License == null)
                LicenseException.Throw(LicenseException.FailReason.Other, "No license to De-Activate");

            string request = string.Format(requestString, "DeActivate", License.LicenseKey, License.MachineData.Serialize(false), LicenseString);
            ServerResponse resp;
            resp = Post(request);
            if (resp.StatusCode == 0)
            {
                DeleteLicense();
            }
            else
            {
                LicenseException.Throw(LicenseException.FailReason.Other, resp.Response);
            }
           
        }

        public static void Validate()
        {
            ServerResponse resp = new ServerResponse();
            Init(true);

            LicenseData License = GetLicense();
            if (License == null)
                LicenseException.Throw(LicenseException.FailReason.NotActivated, "No License Detected");

            //Check Machine Key
            if (IsMachineSame != 1 && ThisMachine != null)
                LicenseException.Throw(LicenseException.FailReason.MachineMismatch, "License not Valid for this Machine");

            if (ThisMachine != null && ThisMachine.numberOfCores > License.Quantity)
                LicenseException.Throw(LicenseException.FailReason.InsufficientCoreLicenses, "Insufficient Core Licenses for this Machine");

            //Check Version, curretnly all other SKUs allow for version upgrade, if version upgrade occurs before subscription end.  This is checked at Activation.
            if ( License.SKU.Substring(0,5) == "Mob10" )
                LicenseException.Throw(LicenseException.FailReason.IncorrectVersion, "License is invalid for this version of the software");

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
                            Logger.Trace(LogType.Info, "Could not communicate with license Service");
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
                        lock (MachineIdLock)
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
                LicenseException.Throw(LicenseException.FailReason.Other, "Invalid Response from server");
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
