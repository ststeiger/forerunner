using System;
using System.Configuration;

namespace Forerunner.Config
{
    public class ConfigElement : System.Configuration.ConfigurationElement
    {
        [ConfigurationProperty("Instance", IsRequired = true)]
        public string Instance
        {
            get
            {
                return this["Instance"] as string;
            }
        }

        [ConfigurationProperty("IsNative", IsRequired = false)]
        public bool IsNative
        {
            get
            {
                string isNativeString = this["IsNative"] as string;
                if (isNativeString == null) return true;
                return String.Compare("true", isNativeString, true) == 0;
            }
        }

        [ConfigurationProperty("SharePointHost", IsRequired = false)]
        public string SharePointHost
        {
            get
            {
                return this["SharePointHost"] as string;
            }
        }

        [ConfigurationProperty("ReportServerWSUrl", IsRequired = true)]
        public string ReportServerWSUrl
        {
            get
            {
                return this["ReportServerWSUrl"] as string;
            }
        }

        [ConfigurationProperty("ReportServerDataSource", IsRequired = false)]
        public string ReportServerDataSource
        {
            get
            {
                return this["ReportServerDataSource"] as string;
            }
        }

        [ConfigurationProperty("UseIntegratedSecurityForSQL", IsRequired = false)]
        public bool UseIntegratedSecurityForSQL
        {
            get
            {
                string value = this["UseIntegratedSecurityForSQL"] as string;
                if (value == null) return false;
                return String.Compare("true", value, true) == 0;
            }
        }

        [ConfigurationProperty("ReportServerDB", IsRequired = false)]
        public string ReportServerDB
        {
            get
            {
                return this["ReportServerDB"] as string;
            }
        }

        [ConfigurationProperty("ReportServerDBUser", IsRequired = false)]
        public string ReportServerDBUser
        {
            get
            {
                return this["ReportServerDBUser"] as string;
            }
        }

        [ConfigurationProperty("ReportServerDBPWD", IsRequired = false)]
        public string ReportServerDBPWD
        {
            get
            {
                return this["ReportServerDBPWD"] as string;
            }
        }


        [ConfigurationProperty("ReportServerDBDomain", IsRequired = false)]
        public string ReportServerDBDomain
        {
            get
            {
                return this["ReportServerDBDomain"] as string;
            }
        }

        [ConfigurationProperty("ReportServerTimeout", IsRequired = false)]
        public int ReportServerTimeout
        {
            get
            {
                int defaultValue = 100000;
                string value = this["ReportServerTimeout"] as string;
                if (value == null) return defaultValue;
                try
                {
                    return int.Parse(value);
                }
                catch
                {
                    return defaultValue;
                }
            }
        }
    }
}
