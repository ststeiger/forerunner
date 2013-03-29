using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace TestSAMLUtils
{
    internal static class DateTimeUtil
    {
        // Methods
        public static DateTime Add(DateTime time, TimeSpan timespan)
        {
            if ((timespan >= TimeSpan.Zero) && ((DateTime.MaxValue - time) <= timespan))
            {
                return GetMaxValue(time.Kind);
            }
            if ((timespan <= TimeSpan.Zero) && ((DateTime.MinValue - time) >= timespan))
            {
                return GetMinValue(time.Kind);
            }
            return (time + timespan);
        }

        public static DateTime AddNonNegative(DateTime time, TimeSpan timespan)
        {
            if (timespan <= TimeSpan.Zero)
            {
                throw DiagnosticUtility.ExceptionUtility.ThrowHelperError(new InvalidOperationException(SR.GetString("ID2082", new object[0])));
            }
            return Add(time, timespan);
        }

        public static DateTime GetMaxValue(DateTimeKind kind)
        {
            return new DateTime(DateTime.MaxValue.Ticks, kind);
        }

        public static DateTime GetMinValue(DateTimeKind kind)
        {
            return new DateTime(DateTime.MinValue.Ticks, kind);
        }

        public static DateTime ToUniversalTime(DateTime value)
        {
            if (value.Kind == DateTimeKind.Utc)
            {
                return value;
            }
            return value.ToUniversalTime();
        }

        public static DateTime? ToUniversalTime(DateTime? value)
        {
            if (value.HasValue && (value.Value.Kind != DateTimeKind.Utc))
            {
                return new DateTime?(ToUniversalTime(value.Value));
            }
            return value;
        }
    }
}
