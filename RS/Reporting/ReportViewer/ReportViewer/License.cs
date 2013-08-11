using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Runtime.Serialization.Formatters.Binary;
using System.Xml.Serialization;
using Microsoft.Win32;
using System.Net;
using System.Security.Cryptography;
using System.Web;

namespace Forerunner.SSR
{
    [Serializable()]
    [XmlRoot()]
    public class MachineId
    {
        #region methods

        private MachineId()
        {
            motherBoardId = GetBaseBoardId();
            hostName = GetHostName();
            biosId = GetBIOSId();
            macId = GetMacId();
        }
        public static MachineId CreateCurrentMachineId()
        {
            MachineId machineId = new MachineId();
            return machineId;
        }
        public bool IsSame(MachineId machineId)
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
        private static string identifier(string wmiClass, string wmiProperty)
        {
            string result = "";
            System.Management.ManagementClass mc = new System.Management.ManagementClass(wmiClass);
            System.Management.ManagementObjectCollection moc = mc.GetInstances();
            foreach (System.Management.ManagementObject mo in moc)
            {
                // First one only
                if (result == "")
                {
                    try
                    {
                        result = mo[wmiProperty].ToString();
                        break;
                    }
                    catch
                    {
                    }
                }
            }
            return result;
        }
        private static string identifier(string wmiClass, string wmiProperty, string wmiMustBeTrue)
        {
            string result = "";
            System.Management.ManagementClass mc = new System.Management.ManagementClass(wmiClass);
            System.Management.ManagementObjectCollection moc = mc.GetInstances();
            foreach (System.Management.ManagementObject mo in moc)
            {
                if (mo[wmiMustBeTrue].ToString() == "True")
                {
                    //Only get the first one
                    if (result == "")
                    {
                        try
                        {
                            result = mo[wmiProperty].ToString();
                            break;
                        }
                        catch
                        {
                        }
                    }
                }
            }
            return result;
        }

        #endregion  // methods

        #region data

        [XmlElement()]
        public String motherBoardId;

        [XmlElement()]
        public String hostName;

        [XmlElement()]
        public String biosId;

        [XmlElement()]
        public String macId;

        #endregion data
    }

    [Serializable()]
    [XmlRoot()]
    public class TimeBomb
    {
        #region enums and constants

        public const String failKey = "reason";
        public enum FailReason
        {
            Expired,
            MachineMismatch,
            TimeBombMissing
        };


        // Time bomb grace period expressed in days
        private const int trialPeriod = 60;
        private const String forerunnerKey = "Forerunnersw";
        private const String ssrKey = "ssr";
        private const String timeBombName = "setupdata";
        private const String machineHashName = "setupkey";

        private const String genericRegistyError = "Setup error - time bomb data not found";

        #endregion types and static constants

        #region methods

        private TimeBomb() { }
        public static TimeBomb Create(DateTime installDate)
        {
            TimeBomb timeBomb = new TimeBomb();
            timeBomb.start = installDate;
            timeBomb.machineId = MachineId.CreateCurrentMachineId();

            return timeBomb;
        }
        public static TimeBomb Create()
        {
            return TimeBomb.Create(DateTime.Now);
        }
        public static void Remove()
        {
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE", true);
            RegistryKey forerunnerKey = softwareKey.OpenSubKey(TimeBomb.forerunnerKey, true);
            if (forerunnerKey != null)
            {
                forerunnerKey.DeleteSubKey(TimeBomb.ssrKey, false);
            }
        }
        public void SaveToRegistry()
        {
            // Serialize the time bomb
            MemoryStream stream = new MemoryStream();
            BinaryFormatter serializer = new BinaryFormatter();
            serializer.Serialize(stream, this);

            // TODO Create an MD5 Hash from the unencrypted string

            // TODO Encrypt the string into a byte array

            // Save the time bomb to the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE", true);
            RegistryKey forerunnerswKey = softwareKey.CreateSubKey(TimeBomb.forerunnerKey);
            RegistryKey ssrKey = forerunnerswKey.CreateSubKey(TimeBomb.ssrKey);
            ssrKey.SetValue(TimeBomb.timeBombName, stream.GetBuffer(), RegistryValueKind.Binary);
            stream.Close();
        }
        public static TimeBomb LoadFromRegistry()
        {
            // Load the time bomb from the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE");
            RegistryKey forerunnerswKey = softwareKey.OpenSubKey(TimeBomb.forerunnerKey);
            if (forerunnerswKey == null)
            {
                LicenseException e = new LicenseException(TimeBomb.genericRegistyError);
                e.Data.Add(TimeBomb.failKey, FailReason.TimeBombMissing);
                throw e;
            }

            RegistryKey ssrKey = forerunnerswKey.OpenSubKey(TimeBomb.ssrKey);
            if (ssrKey == null)
            {
                LicenseException e = new LicenseException(TimeBomb.genericRegistyError);
                e.Data.Add(TimeBomb.failKey, FailReason.TimeBombMissing);
                throw e;
            }

            byte[] timeBombData = (byte[])ssrKey.GetValue(TimeBomb.timeBombName);

            if (timeBombData == null)
            {
                LicenseException e = new LicenseException(TimeBomb.genericRegistyError);
                e.Data.Add(TimeBomb.failKey, FailReason.TimeBombMissing);
                throw e;
            }

            // TODO Decrypt the time bomb data

            // Deserialize the time bomb
            MemoryStream stream = new MemoryStream(timeBombData);
            BinaryFormatter serializer = new BinaryFormatter();
            return (TimeBomb)serializer.Deserialize(stream);
        }
        public bool IsValid(MachineId currentMachineId)
        {
            TimeSpan timeSpan = DateTime.Now.Subtract(start);
            if (timeSpan.Days > trialPeriod)
            {
                // Timebomb has expired, time to buy a license
                LicenseException e = new LicenseException("The trial period has expired");
                e.Data.Add(TimeBomb.failKey, FailReason.Expired);
                throw e;
            }

            if (!machineId.IsSame(currentMachineId))
            {
                // The TimeBomb must be created on the same machine
                LicenseException e = new LicenseException("Setup error - machine id mismatch");
                e.Data.Add(TimeBomb.failKey, FailReason.MachineMismatch);
                throw e;
            }

            return true;
        }

        #endregion //methods

        #region data

        [XmlElement()]
        public DateTime start;         // Time Bomb Start date / time

        [XmlElement()]
        public MachineId machineId;    // Machine Id where the Time Bomb was created

        #endregion  // data
    }

    public class LicenseException : ApplicationException
    {
        #region methods
        public LicenseException() : base() {}
        public LicenseException(String msg) : base(msg) {}
        #endregion  // methods
    }

    static internal class License
    {
        #region methods

        public static void ThrowIfNotValid()
        {
            if (currentMachineId != null && timeBomb != null)
            {
                timeBomb.IsValid(currentMachineId);
            }

            timeBomb = TimeBomb.LoadFromRegistry();
            currentMachineId = MachineId.CreateCurrentMachineId();
            timeBomb.IsValid(currentMachineId);
        }
        
        #endregion

        #region data

        private static TimeBomb timeBomb = null;
        private static MachineId currentMachineId = null;
        
        #endregion

    }
}
