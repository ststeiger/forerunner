using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Xml;
using System.Text;
using System.IO;
using System.Security.Cryptography;
using System.Net;
using System.Management;
using Forerunner.Logging;

namespace ForerunnerLicense
{
    internal class LicenseException : ApplicationException
    {
        #region constants

        internal const String failKey = "reason";

        internal enum FailReason
        {
            Expired,
            MachineMismatch,
            NotActivated,
            InvalidKey,
            LicenseValidationError,
            InsufficientCoreLicenses,
            IncorrectVersion,
            SSRSLicenseError,
            InitializationFailure
        };
        #endregion constants

        #region methods

        internal static LicenseException Throw(LicenseException.FailReason reason,string message)
        {
            LicenseException e = new LicenseException(message);
            e.Data.Add(LicenseException.failKey, reason);
            throw e;
        }

        internal LicenseException() : base() { }
        internal LicenseException(String msg) : base(msg) { }
        internal LicenseException(String msg, Exception inner) : base(msg, inner) { }
        #endregion  // methods
    }

    internal static class LicenseUtil
    {
        private static string encryptPackage = @"<Encrypt><Key>{0}</Key><IV>{1}</IV><Value>{2}</Value></Encrypt>";
        private static string signPackage = @"<Signed><Signature>{0}</Signature><Value>{1}</Value></Signed>";
        public static string pubkey = @"<RSAKeyValue><Modulus>oqauZZXXShzB2xxb2643zxDbWyFjcW1uihkGt/dNhrwRbdRm1f43v4+8y7GMwhigVuYaVBVcwGdeDBePoKsqsQ71IE+sarxpmVibPKLfhsMF9Yvj8o6uy5BsUhViK76kpswIhjj32XXtYTIuBhlxtv1Oo0w4yDgIMXExJiSp9+1AW6hvUiL7CCJAPuuPIqd9ZCD/KPOOZecj2qxpIEOgTU9/kSO2QOJA4Soup/DPj/brWYsFtHzKP2RRzZzPFbKn7uy9TR+ws+sGpvnGIT7dCyN3K0S5Lm6c8u6Fg1ePrBg8jyhpgK7raUhkn7TKnuauU+vQdz8zFx5ZawTvZORxJQ==</Modulus><Exponent>AQAB</Exponent></RSAKeyValue>";

        internal static string Sign(string data, string key)
        {
            byte[] signedBytes;
            using (RSACryptoServiceProvider rsa = new RSACryptoServiceProvider())
            {
                rsa.PersistKeyInCsp = false;
                rsa.FromXmlString(key);

                byte[] originalData = Encoding.UTF8.GetBytes(data);
                signedBytes = rsa.SignData(originalData, CryptoConfig.MapNameToOID("SHA512"));

                return string.Format(signPackage, Convert.ToBase64String(signedBytes), Convert.ToBase64String(originalData));
            }
        }

        internal static string Verify(string data, string key)
        {
            return Verify(XmlReader.Create(new StringReader(data)), key);
        }

        internal static string Verify(XmlReader XMLReq, string key)
        {
            Logger.Trace(LogType.Info, "LicenseUtil.Verify");
            byte[] signedBytes = null;
            byte[] dataBytes = null;
            using (RSACryptoServiceProvider rsa = new RSACryptoServiceProvider())
            {
                Logger.Trace(LogType.Info, "LicenseUtil.Verify Decrypt");
                rsa.PersistKeyInCsp = false;
                rsa.FromXmlString(key);

                XMLReq.Read();
                if (XMLReq.Name != "Signed")
                    LicenseException.Throw(LicenseException.FailReason.InvalidKey, "License is Not Signed");
                XMLReq.Read();

                while (!XMLReq.EOF)
                {

                    switch (XMLReq.Name)
                    {
                        case "Signature":
                            signedBytes = Convert.FromBase64String(XMLReq.ReadElementContentAsString());
                            break;
                        case "Value":
                            dataBytes = Convert.FromBase64String(XMLReq.ReadElementContentAsString());
                            break;
                    }
                    if (XMLReq.Name == "Signed")
                        break;

                }

                if (rsa.VerifyData(dataBytes, CryptoConfig.MapNameToOID("SHA512"), signedBytes))
                {
                    Logger.Trace(LogType.Info, "LicenseUtil.Verify Ends");
                    return Encoding.UTF8.GetString(dataBytes);
                }
                else
                {
                    Logger.Trace(LogType.Error, "LicenseUtil.Verify Invalid License Signature");
                    LicenseException.Throw(LicenseException.FailReason.InvalidKey, "Invalid License Signature");
                    return null;
                }
            }
        }
        internal static string Encrypt(string data, string key)
        {
            Logger.Trace(LogType.Info, "LicenseUtil.Encrypt invoked");
            using (AesCryptoServiceProvider TDES = new AesCryptoServiceProvider())
            {

                string aeskey = RSAEncryptUsingKey(TDES.Key, key);
                string IV = RSAEncryptUsingKey(TDES.IV, key);
                byte[] bytes = Encoding.UTF8.GetBytes(data);
                string value;

                using (AesManaged aesAlg = new AesManaged())
                {
                    aesAlg.Key = TDES.Key;
                    aesAlg.IV = TDES.IV;

                    // Create the streams used for encryption. 
                    using (MemoryStream msEncrypt = new MemoryStream())
                    {
                        using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, aesAlg.CreateEncryptor(), CryptoStreamMode.Write))
                        {
                            csEncrypt.Write(bytes, 0, bytes.Length);
                        }
                        byte[] EncryptedBytes = msEncrypt.ToArray();
                        value = Convert.ToBase64String(EncryptedBytes);
                    }
                }

                Logger.Trace(LogType.Info, "LicenseUtil.Encrypt ends");
                return string.Format(encryptPackage, aeskey, IV, value);
            }
        }

        internal static string Decrypt(string data,string key)
        {
               return Decrypt(XmlReader.Create(new StringReader(data)),key);
        }

        internal static string Decrypt(XmlReader XMLReq, string key)
        {
            Logger.Trace(LogType.Info, "LicenseUtil.Decrypt invoked");
            byte[] aeskey = null;
            byte[] IV = null;
            byte[] bytes = null;
            string value;
         
            XMLReq.Read();
            if (XMLReq.Name != "Encrypt")
                throw new ClientLicenseException("Invalid Data");
            XMLReq.Read();

            while (!XMLReq.EOF)
            {
                
                switch (XMLReq.Name)
                {
                    case "Key":
                        aeskey = Convert.FromBase64String(RSADecryptUsingKey(XMLReq.ReadElementContentAsString(), key));
                        break;
                    case "IV":
                        IV = Convert.FromBase64String(RSADecryptUsingKey(XMLReq.ReadElementContentAsString(), key));
                        break;
                    case "Value":
                        bytes = Convert.FromBase64String(XMLReq.ReadElementContentAsString());                        
                        break;
                }
                if (XMLReq.Name == "Encrypt")
                    break;

            }


            using (AesManaged aesAlg = new AesManaged())
            {
                aesAlg.Key = aeskey;
                aesAlg.IV = IV;

                // Create the streams used for encryption. 
                using (MemoryStream msDecrypt = new MemoryStream())
                {
                    using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, aesAlg.CreateDecryptor(), CryptoStreamMode.Write))
                    {
                        csDecrypt.Write(bytes, 0, bytes.Length);
                    }
                    byte[] DecryptedBytes = msDecrypt.ToArray();
                    value = Encoding.UTF8.GetString(DecryptedBytes);
                }
            }

            Logger.Trace(LogType.Info, "LicenseUtil.Decrypt ends");
            return value;
        }
        internal static string RSADecryptUsingKey(byte[] data,string key)
        {
            Logger.Trace(LogType.Info, "LicenseUtil.RSADecryptUsingKey invoked");
            try
            {
                using (RSACryptoServiceProvider rsa = new RSACryptoServiceProvider())
                {
                    rsa.FromXmlString(key);

                    byte[] decryptedBytes = rsa.Decrypt(data, true);
                    Logger.Trace(LogType.Info, "LicenseUtil.RSADecryptUsingKey ends");
                    return Convert.ToBase64String(decryptedBytes);
                }
            }
            catch(Exception e)
            {
                Logger.Trace(LogType.Error, "LicenseUtil.RSADecryptUsingKey errored");
                ExceptionLogGenerator.LogException(e);
                return null;
            }
        }

        internal static string RSADecryptUsingKey(string dataEncryptedBase64, string key)
        {
            return RSADecryptUsingKey(Convert.FromBase64String(dataEncryptedBase64), key);    
        }
        
        internal static string RSAEncryptUsingKey(string DataToEncrypt, string key)
        {
            return RSAEncryptUsingKey(Convert.FromBase64String(DataToEncrypt), key);
        }

        internal static string RSAEncryptUsingKey(byte[] data, string key)
        {
            Logger.Trace(LogType.Info, "LicenseUtil.RSAEncryptUsingKey invoked");
            try
            {
                using (RSACryptoServiceProvider rsa = new RSACryptoServiceProvider())
                {
                    rsa.FromXmlString(key);
                    byte[] EncryptedBytes = rsa.Encrypt(data, true);

                    Logger.Trace(LogType.Info, "LicenseUtil.RSAEncryptUsingKey ended");
                    return Convert.ToBase64String(EncryptedBytes);
                }
            }
            catch(Exception e)
            {
                Logger.Trace(LogType.Error, "LicenseUtil.RSAEncryptUsingKey errored");
                ExceptionLogGenerator.LogException(e);
                return null;
            }
        }
    }

    internal class LicenseData
    {
        public string LicenseKey = null;
        public MachineId MachineData = null;
        public DateTime LastActivation;
        public DateTime FirstActivationDate;
        public int Quantity = 0;
        public string SKU = null;
        public int IsSubscription = 0;
        public int LicenseDuration = 30;
        public int RequireValidation = 1;
        public int IsTrial = 1;

        internal LicenseData()
        { 
        }

        internal LicenseData(string License)
        {
            LoadLicenseData(License);
        }
        internal void LoadLicenseData(string License)
        {
            Logger.Trace(LogType.Info, "LicenseData.LoadLicenseData invoked");
            XmlReader XMLReq = XmlReader.Create(new StringReader(License));
            XMLReq.Read();
            if (XMLReq.Name != "License")
            {
                Logger.Trace(LogType.Error, "LicenseData.LoadLicenseData Invalid license data");
                throw new ClientLicenseException("Invalid License Data");
            }
            XMLReq.Read();

            while (!XMLReq.EOF)
            {  
                switch (XMLReq.Name)
                {
                    case "SKU":
                        SKU = XMLReq.ReadElementContentAsString();
                        break;
                    case "Quantity":
                        Quantity = XMLReq.ReadElementContentAsInt();
                        break;
                    case "MachineData":
                        MachineData = new MachineId(XMLReq);                        
                        break;
                    case "LicenseKey":
                        LicenseKey = XMLReq.ReadElementContentAsString();
                        break;
                    case "RequireValidation":
                        RequireValidation = XMLReq.ReadElementContentAsInt();
                        break;
                    case "ActivationDate":
                        FirstActivationDate = DateTime.Parse(XMLReq.ReadElementContentAsString());
                        break;
                    case "LastActivationDate":
                        LastActivation = DateTime.Parse(XMLReq.ReadElementContentAsString());
                        break;
                    case "IsSubscription":
                        IsSubscription = XMLReq.ReadElementContentAsInt();
                        break;
                    case "LicenseDuration":
                        LicenseDuration = XMLReq.ReadElementContentAsInt();
                        break;
                    case "IsTrial":
                        IsTrial = XMLReq.ReadElementContentAsInt();
                        break;
                }
                if (XMLReq.NodeType == XmlNodeType.EndElement && XMLReq.Name == "License")
                {
                    XMLReq.Read();
                    break;
                }
            }
            Logger.Trace(LogType.Info, "LicenseData.LoadLicenseData ends");
        }
    }

    internal class MachineId
    {
        internal string motherBoardId;
        internal string hostName;
        internal string biosId;
        internal string macId;
        internal string machineKey;
        internal int numberOfCores;

        private string SerializeString = "<MachineData><MachineKey>{0}</MachineKey><MotherBoardId>{1}</MotherBoardId><HostName>{2}</HostName><BiosId>{3}</BiosId><MacId>{4}</MacId></MachineData>";


        internal MachineId()
        {
            try
            {
                motherBoardId = GetBaseBoardId();
                hostName = GetHostName();
                biosId = GetBIOSId();
                macId = GetMacId();
                machineKey = Guid.NewGuid().ToString();
                numberOfCores = GetNumberOfCores();
            }
            catch(Exception e)
            {
                Logger.Trace(LogType.Error, "MachineId c'tor failed");
                ExceptionLogGenerator.LogException(e);
                throw e;
            }
        }
        internal MachineId(string MachineData)
        {
            XmlReader XMLReq = XmlReader.Create(new StringReader(MachineData));
            XMLReq.Read();
            Load(XMLReq);
        }
        internal MachineId(XmlReader XMLReq)
        {            
            Load(XMLReq);
        }

        internal void Load(XmlReader XMLReq)
        {
            //Load from XML
            Logger.Trace(LogType.Info, "MachineId.Load invoked");
            if (XMLReq.Name != "MachineData")
                throw new ClientLicenseException("Not a Machine Data");
            XMLReq.Read();
            while (!XMLReq.EOF)
            {
                if (XMLReq.NodeType != XmlNodeType.EndElement)
                {
                    switch (XMLReq.Name)
                    {
                        case "MotherBoardId":
                            motherBoardId = XMLReq.ReadElementContentAsString();
                            break;
                        case "HostName":
                            hostName = XMLReq.ReadElementContentAsString();
                            break;
                        case "BiosId":
                            biosId = XMLReq.ReadElementContentAsString();
                            break;
                        case "MacId":
                            macId = XMLReq.ReadElementContentAsString();
                            break;
                        case "MachineKey":
                            machineKey = XMLReq.ReadElementContentAsString();
                            break;
                    }
                }
                else
                {
                    XMLReq.Read();
                    break;
                }
            }
            Logger.Trace(LogType.Info, "MachineId.Load ends");
        }
        internal static MachineId CreateCurrentMachineId()
        {
            MachineId machineId = new MachineId();
            return machineId;
        }
        internal bool IsSame(MachineId machineId)
        {
            int sameCount = 0;
            if (motherBoardId.CompareTo(machineId.motherBoardId) == 0)
            {
                sameCount++;
            }
            if (hostName.CompareTo(machineId.hostName) == 0)
            {
                sameCount++;
            }
            if (biosId.CompareTo(machineId.biosId) == 0)
            {
                sameCount++;
            }
            if (macId.CompareTo(machineId.macId) == 0)
            {
                sameCount++;
            }

            return sameCount >= 2;
        }
        internal string Serialize(bool Encrypt = true)
        {
            if (Encrypt)
                return LicenseUtil.Encrypt(string.Format(SerializeString, machineKey, motherBoardId, hostName, biosId, macId),LicenseUtil.pubkey);
            else
                return string.Format(SerializeString, machineKey, motherBoardId, hostName, biosId, macId);
        }
        private static int GetNumberOfCores()
        {
            Logger.Trace(LogType.Info, "MachineId.GetNumberOfCores invoked");
            int coreCount = 0;
            foreach (var item in new System.Management.ManagementObjectSearcher("Select * from Win32_Processor").Get())
            {
                coreCount += int.Parse(item["NumberOfCores"].ToString());
            }
            Logger.Trace(LogType.Info, "MachineId.GetNumberOfCores ends");
            return coreCount;
        }
        private static String GetHostName()
        {
            return Dns.GetHostName();
        }
        private static string GetBIOSId()
        {
            return identifier("Win32_BIOS", "Manufacturer")
            + identifier("Win32_BIOS", "SMBIOSBIOSVersion")
            + identifier("Win32_BIOS", "IdentificationCode")
            + identifier("Win32_BIOS", "SerialNumber")
            + identifier("Win32_BIOS", "ReleaseDate")
            + identifier("Win32_BIOS", "Version");
        }
        private static string GetBaseBoardId()
        {
            return identifier("Win32_BaseBoard", "Model")
            + identifier("Win32_BaseBoard", "Manufacturer")
            + identifier("Win32_BaseBoard", "Name")
            + identifier("Win32_BaseBoard", "SerialNumber");
        }
        private static string GetMacId()
        {
            return identifier("Win32_NetworkAdapterConfiguration", "MACAddress", "IPEnabled");
        }
        
        private static string identifier(string wmiClass, string wmiProperty, string wmiMustBeTrue = null)
        {
            Logger.Trace(LogType.Info, "MachineId.identifier called. wmiClass: " + wmiClass + ", wmiProperty: " + wmiProperty);
            
            string result = "";
            System.Management.ManagementClass mc = new System.Management.ManagementClass(wmiClass);
            System.Management.ManagementObjectCollection moc = mc.GetInstances();
            foreach (System.Management.ManagementObject mo in moc)
            {
                if (wmiMustBeTrue == null || mo[wmiMustBeTrue].ToString() == "True")
                {
                    //Only get the first one
                    if (result == "")
                    {
                        try
                        {
                            if (mo[wmiProperty] != null)
                            {
                                result = mo[wmiProperty].ToString();
                                break;
                            }
                        }
                        catch(Exception e)
                        {
                            Logger.Trace(LogType.Error, "MachineId.identifier error");
                            ExceptionLogGenerator.LogException(e);
                            throw e;
                        }
                    }
                }
            }
            Logger.Trace(LogType.Info, "MachineId.identifier ends. wmiClass: " + wmiClass + ", wmiProperty: " + wmiProperty + ", result: " + result);
            return result;
        }
    }
}