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
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public MinuteRecurrence MinuteRecurrence { get; set; }
        public DailyRecurrence DailyRecurrence { get; set; }
        public WeeklyRecurrence WeeklyRecurrence { get; set; }
        public MonthlyRecurrence MonthlyRecurrence { get; set; }
        public MonthlyDOWRecurrence MonthlyDOWRecurrence { get; set; }
    }
}
