using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Forerunner.SSRS.Management;

namespace Forerunner
{
    public class SubscriptionSchedule
    {
        public SubscriptionSchedule() { IsMobilizerSchedule = false; }
        public string Name { get; set; }
        public string ScheduleID { get; set; }
        public string MatchData { get; set; }
        public bool IsMobilizerSchedule { get; set; }
    }
}
