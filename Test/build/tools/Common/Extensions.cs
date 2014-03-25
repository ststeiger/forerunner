//-----------------------------------------------------------------------
// <copyright file="Extensions.cs" company="Jon Rowlett">
//     Copyright (C) 2012 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Extension Methods for common objects.
    /// </summary>
    public static class Extensions
    {
        /// <summary>
        /// The base of all times sent by UNIX.
        /// </summary>
        private static readonly DateTime baseTime = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        /// <summary>
        /// Converts a commonly used UNIX time value into a UTC DateTime.
        /// </summary>
        /// <param name="source">time from UNIX.</param>
        /// <returns>A DateTime representation</returns>
        public static DateTime FromUnixTime(this long value)
        {
            return baseTime.AddSeconds((double)value);
        }

        /// <summary>
        /// Converts a date time to a UNIX time offset
        /// </summary>
        /// <param name="source">a date time.</param>
        /// <returns>a value for UNIX.</returns>
        public static long ToUnixTime(this DateTime value)
        {
            TimeSpan span = value - baseTime;
            return (long)span.TotalSeconds;
        }

        /// <summary>
        /// Zeroes the contents of an array.
        /// </summary>
        /// <typeparam name="T">the type of element.</typeparam>
        /// <param name="value">the array to zero.</param>
        public static void Zero<T>(this T[] value)
        {
            if (value == null)
            {
                return;
            }

            for (int i = 0; i < value.Length; i++)
            {
                value[i] = default(T);
            }
        }
    }
}
