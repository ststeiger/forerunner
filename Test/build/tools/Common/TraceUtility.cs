//-----------------------------------------------------------------------
// <copyright file="TraceUtility.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common.Diagnostics
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;
    using System.Text;

    /// <summary>
    /// Trace utility.
    /// </summary>
    public static class TraceUtility
    {
        /// <summary>
        /// creates an object to trace enter and exit of a method.
        /// </summary>
        /// <param name="source">trace source to use</param>
        /// <param name="type">The type containing the method</param>
        /// <param name="methodName">name of the method.</param>
        /// <returns>an object that will trace exit when disposed.</returns>
        public static IDisposable TraceMethod(TraceSource source, Type type, string methodName)
        {
            if (source == null)
            {
                Trace.TraceError("TraceMethod Error: source is null.");
                return null;
            }

            if (type == null)
            {
                source.TraceEvent(TraceEventType.Error, -1, "TraceMethod Error: type is null.");
                return null;
            }

            if (String.IsNullOrEmpty(methodName))
            {
                source.TraceEvent(TraceEventType.Error, -1, "TraceMethod Error: methodName is null or empty.");
                return null;
            }

            string activity = String.Format(
                System.Globalization.CultureInfo.InvariantCulture,
                "{0}.{1}",
                type.Name,
                methodName);
            return new TraceActivity(source, activity);
        }

        /// <summary>
        /// Use in a throw statement to trace before throwing the exception.
        /// </summary>
        /// <remarks>
        /// the throw statement is outside this method.
        /// </remarks>
        /// <param name="source">trace source to use.</param>
        /// <param name="ex">exception to throw.</param>
        /// <param name="eventType">level to trace at.</param>
        /// <returns>the same exception to throw</returns>
        public static Exception TraceThrowException(TraceSource source, Exception ex, TraceEventType eventType)
        {
            if (source == null)
            {
                Trace.TraceError("TraceThrowException Error: source is null.");
                return ex;
            }

            if (ex == null)
            {
                source.TraceEvent(TraceEventType.Error, -1, "TraceThrowException Error: ex is null.");
                return ex;
            }

            source.TraceEvent(
                eventType,
                0,
                "Throwing Exception. {0}",
                FormatExceptionTrace(ex));

            return ex;
        }

        /// <summary>
        /// trace an exception caught before processing it.
        /// </summary>
        /// <param name="source">trace source to use.</param>
        /// <param name="ex">exception that got caught</param>
        /// <param name="eventType">the level to trace at.</param>
        [Conditional("TRACE")]
        public static void TraceCatchException(TraceSource source, Exception ex, TraceEventType eventType)
        {
            if (source == null)
            {
                Trace.TraceError("TraceCatchException Error: source is null.");
                return;
            }

            if (ex == null)
            {
                source.TraceEvent(TraceEventType.Error, -1, "TraceCatchException Error: ex is null.");
                return;
            }

            source.TraceEvent(
                eventType,
                0,
                "Caught Exception. {0}",
                FormatExceptionTrace(ex));
        }

        /// <summary>
        /// formats trace output for an exception.
        /// </summary>
        /// <param name="ex">the exception to trace</param>
        /// <returns>the trace output string.</returns>
        private static string FormatExceptionTrace(Exception ex)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat(
                System.Globalization.CultureInfo.InvariantCulture,
                "Type: {0}. Message: {1}. Source: {2}.\r\nStackTrace: {3}\r\n",
                ex.GetType(),
                ex.Message,
                ex.Source,
                ex.StackTrace);
            for (Exception inner = ex.InnerException;
                inner != null;
                inner = inner.InnerException)
            {
                sb.AppendFormat(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "Inner Exception Type: {0}. Message: {1}. Source: {2}.\r\nStackTrace: {3}\r\n",
                    inner.GetType(),
                    inner.Message,
                    inner.Source,
                    inner.StackTrace);
            }

            return sb.ToString();
        }
    }
}
