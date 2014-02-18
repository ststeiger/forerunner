using System;
using System.Configuration;

namespace Forerunner.Config
{
    public class ConfigElementCollection : ConfigurationElementCollection
    {
        public ConfigElement this[int index]
        {
            get
            {
                return base.BaseGet(index) as ConfigElement;
            }
        }

        public ConfigElement GetElementByKey(string key)
        {
            return base.BaseGet(key) as ConfigElement;
        }

        protected override ConfigurationElement CreateNewElement()
        {
            return new ConfigElement();
        }

        protected override object GetElementKey(ConfigurationElement element)
        {
            return ((ConfigElement)(element)).Instance;
        }
    }
}
