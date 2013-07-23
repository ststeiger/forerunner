//-----------------------------------------------------------------------
// <copyright file="Tracing.cs" company="Jon Rowlett">
//     Copyright (C) 2013 Jon Rowlett. All rights reserved.
// </copyright>
//-----------------------------------------------------------------------
#define TRACE
namespace Forerunner.Tools.SharepointUploader
{
    using System;
    using System.Diagnostics;
    using System.Linq;

    /// <summary>
    /// Tracing settings.
    /// </summary>
    internal static class Tracing
    {
        /// <summary>
        /// The trace source.
        /// </summary>
        public static readonly TraceSource Source = new TraceSource("SharepointUploader");
    }
}
