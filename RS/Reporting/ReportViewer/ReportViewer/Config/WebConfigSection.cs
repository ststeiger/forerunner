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
            return ConfigurationManager.GetSection("Forerunner") as WebConfigSection;
        }
    }
}
