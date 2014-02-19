using System;
using System.Configuration;

namespace Forerunner.Config
{
    public class WebConfigSection : ConfigurationSection
    {

        public WebConfigSection()
        {
        }

        [ConfigurationProperty("InstanceCollection")]
        public ConfigElementCollection InstanceCollection
        {
            get
            {
                return this["InstanceCollection"] as ConfigElementCollection;
            }
        }

        public static WebConfigSection GetConfigSection()
        {
            try
            {
                return ConfigurationManager.GetSection("Forerunner") as WebConfigSection;
            }
            catch (Exception e)
            {
                // Log parsing error and return null
                Forerunner.Logging.ExceptionLogGenerator.LogException(e);
                return null;
            }
        }
    }
}
