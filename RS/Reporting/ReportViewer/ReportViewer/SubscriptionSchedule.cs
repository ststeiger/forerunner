using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Forerunner.SSRS.Management;

namespace Forerunner
{
    public class SubscriptionSchedule
    {
        public SubscriptionSchedule() { }
        public ScheduleReference ScheduleReference { get; set; }
        public ScheduleDefinition ScheduleDefinition { get; set; }
    }
}
