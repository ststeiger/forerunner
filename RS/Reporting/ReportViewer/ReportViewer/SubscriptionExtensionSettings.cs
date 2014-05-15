using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Forerunner.SSRS.Management;

namespace Forerunner.SSRS.Manager
{
    public class SubscriptionExtensionSettings
    {

        private string extensionField;

        private ParameterValue[] parameterValues;

        /// <remarks/>
        public string Extension
        {
            get
            {
                return this.extensionField;
            }
            set
            {
                this.extensionField = value;
            }
        }

        /// <remarks/>
        [System.Xml.Serialization.XmlArrayItemAttribute(typeof(ParameterValue))]
        public ParameterValue[] ParameterValues
        {
            get
            {
                return this.parameterValues;
            }
            set
            {
                this.parameterValues = value;
            }
        }
    }
}
