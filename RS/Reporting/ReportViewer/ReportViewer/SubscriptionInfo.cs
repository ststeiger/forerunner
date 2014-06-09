using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Forerunner.SSRS.Management;

namespace Forerunner.SSRS.Manager
{
    public class SubscriptionInfo
    {
        public SubscriptionInfo()
        {
        }

        public SubscriptionInfo(string subscriptionID, string report, SubscriptionExtensionSettings extensionSettings, string description, string eventType, SubscriptionSchedule subscriptionSchedule, ParameterValue[] parameters)
        {
            SubscriptionID = subscriptionID;
            Report = report;
            ExtensionSettings = extensionSettings;
            Description = description;
            EventType = eventType;
            SubscriptionSchedule = subscriptionSchedule;
            Parameters = parameters;
        }
        public string SubscriptionID { get; set; }
        public string Report { get; set; }
        public SubscriptionExtensionSettings ExtensionSettings { get; set; }
        public string Description { get; set; }
        public string EventType { get; set; }
        public SubscriptionSchedule SubscriptionSchedule { get; set; }
        public ParameterValue[] Parameters { get; set; }
    }
}
