using System;
using System.IO;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Net;
using System.Web;
using System.Runtime.Serialization;
using System.Xml.Serialization;
using System.Runtime.Serialization.Formatters.Binary;

namespace Forerunner.SSRS.Security
{
    [DataContract()]
    internal class MachineId
    {
        #region methods

        internal MachineId()
        {
            motherBoardId = GetBaseBoardId();
            hostName = GetHostName();
            biosId = GetBIOSId();
            macId = GetMacId();
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
        private Byte[] Serialize()
        {
            MemoryStream stream = new MemoryStream();
            DataContractSerializer serializer = new DataContractSerializer(typeof(MachineId));
            serializer.WriteObject(stream, this);
            return stream.GetBuffer();
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
            System.Security.Principal.WindowsIdentity identity = System.Security.Principal.WindowsIdentity.GetCurrent();
            String name = identity.Name;

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

        [DataMember()]
        internal String motherBoardId;
        [DataMember()]
        internal String hostName;
        [DataMember()]
        internal String biosId;
        [DataMember()]
        internal String macId;

        #endregion data
    }
}
