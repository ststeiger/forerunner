#define TRACE
//-----------------------------------------------------------------------
// <copyright file="Tracing.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common.Internal
{
    using System;
    using System.Diagnostics;

    /// <summary>
    /// Internal Tracing configuration
    /// </summary>
    internal static class Tracing
    {
        /// <summary>
        /// TraceSource used by this assembly.
        /// </summary>
        private static TraceSource source = new TraceSource("Common.Internal");

        /// <summary>
        /// Gets the TraceSource used by this assembly.
        /// </summary>
        public static TraceSource Source
        {
            get
            {
                return source;
            }
        }
    }
}
