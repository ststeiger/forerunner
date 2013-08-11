using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Xml.Serialization;
using Microsoft.Win32;

namespace Forerunner.SSR
{
    [XmlRoot()]
    public class MachineId
    {
        private MachineId()
        {
            cpuId = GetCPUId();
            biosId = GetBIOSId();
            motherBoardId = GetBaseBoardId();
            diskId = GetDiskId();
            videoId = GetVideoId();
            macId = GetMacId();
        }

        public static MachineId CreateCurrentMachineId()
        {
            MachineId machineId = new MachineId();
            return machineId;
        }

        public bool IsSame(MachineId machineId)
        {
            // TODO

            return true;
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
        private static string GetCPUId()
        {
            //Uses first CPU identifier available in order of preference
            //Don't get all identifiers, as it is very time consuming
            string retVal = identifier("Win32_Processor", "UniqueId");
            if (retVal == "") //If no UniqueID, use ProcessorID
            {
                retVal = identifier("Win32_Processor", "ProcessorId");
                if (retVal == "") //If no ProcessorId, use Name
                {
                    retVal = identifier("Win32_Processor", "Name");
                    if (retVal == "") //If no Name, use Manufacturer
                    {
                        retVal = identifier("Win32_Processor", "Manufacturer");
                    }
                    //Add clock speed for extra security
                    retVal += identifier("Win32_Processor", "MaxClockSpeed");
                }
            }
            return retVal;
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
        //Main physical hard drive ID
        private static string GetDiskId()
        {
            return identifier("Win32_DiskDrive", "Model")
            + identifier("Win32_DiskDrive", "Manufacturer")
            + identifier("Win32_DiskDrive", "Signature")
            + identifier("Win32_DiskDrive", "TotalHeads");
        }
        //Motherboard ID
        private static string GetBaseBoardId()
        {
            return identifier("Win32_BaseBoard", "Model")
            + identifier("Win32_BaseBoard", "Manufacturer")
            + identifier("Win32_BaseBoard", "Name")
            + identifier("Win32_BaseBoard", "SerialNumber");
        }
        //Primary video controller ID
        private static string GetVideoId()
        {
            return identifier("Win32_VideoController", "DriverVersion")
            + identifier("Win32_VideoController", "Name");
        }
        //First enabled network card ID
        private static string GetMacId()
        {
            return identifier("Win32_NetworkAdapterConfiguration", "MACAddress", "IPEnabled");
        }

        [XmlElement()]
        public String cpuId;

        [XmlElement()]
        public String biosId;

        [XmlElement()]
        public String motherBoardId;

        [XmlElement()]
        public String diskId;

        [XmlElement()]
        public String videoId;

        [XmlElement()]
        public String macId;
    }

    [XmlRoot()]
    public class TimeBomb
    {
        public static String FailKey
        {
            get
            {
                return "reason";
            }
        }

        public enum FailReason
        {
            Expired,
            MachineMismatch,
            TimeBombMissing
        };

        // Time bomb grace period expressed in days
        private static int trialPeriod = 60;
        private static String forerunnerKey = "Forerunnersw";
        private static String timeBombName = "timebomb";

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
            softwareKey.DeleteSubKey(TimeBomb.forerunnerKey, true);
        }

        public static TimeBomb LoadFromRegistry()
        {
            // Load the time bomb from the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE");
            RegistryKey forerunnerswKey = softwareKey.OpenSubKey(TimeBomb.forerunnerKey);

            if (forerunnerswKey == null)
            {
                ApplicationException e = new ApplicationException("Setup error - time bomb data not found");
                e.Data.Add(TimeBomb.FailKey, FailReason.TimeBombMissing);
                throw e;
            }

            String timeBombString = (String)forerunnerswKey.GetValue(TimeBomb.timeBombName);

            if (timeBombString == null)
            {
                ApplicationException e = new ApplicationException("Setup error - time bomb data not found");
                e.Data.Add(TimeBomb.FailKey, FailReason.TimeBombMissing);
                throw e;
            }

            // Deserialize the time bomb
            StringReader reader = new StringReader(timeBombString);
            XmlSerializer serializer = new XmlSerializer(typeof(TimeBomb));
            return (TimeBomb)serializer.Deserialize(reader);
        }

        public void SaveToRegistry()
        {
            // Serialize the time bomb
            StringBuilder sb = new StringBuilder();
            StringWriter writer = new StringWriter(sb);
            XmlSerializer serializer = new XmlSerializer(typeof(TimeBomb));
            serializer.Serialize(writer, this);

            // Save the time bomb to the registry
            RegistryKey softwareKey = Registry.LocalMachine.OpenSubKey("SOFTWARE", true);
            RegistryKey forerunnerswKey = softwareKey.CreateSubKey(TimeBomb.forerunnerKey);
            forerunnerswKey.SetValue(TimeBomb.timeBombName, sb.ToString(), RegistryValueKind.String);
            writer.Close();
        }

        public bool IsValid(MachineId currentMachineId)
        {
            TimeSpan timeSpan = DateTime.Now.Subtract(start);
            if (timeSpan.Days > trialPeriod)
            {
                // Timebomb has expired, time to buy a license
                ApplicationException e = new ApplicationException("The trial period has expired");
                e.Data.Add(TimeBomb.FailKey, FailReason.Expired);
                throw e;
            }

            if (!machineId.IsSame(currentMachineId))
            {
                // The TimeBomb must be created on the same machine
                ApplicationException e = new ApplicationException("Setup error - machine id mismatch");
                e.Data.Add(TimeBomb.FailKey, FailReason.MachineMismatch);
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

    }  // class License
}
