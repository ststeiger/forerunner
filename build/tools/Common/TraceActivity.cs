//-----------------------------------------------------------------------
// <copyright file="TraceActivity.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common.Diagnostics
{
    using System;
    using System.Collections.Generic;
    using System.Diagnostics;

    /// <summary>
    /// A disposable object used to trace start and stop of an activity.
    /// </summary>
    /// <remarks>
    /// This is returned by TraceUtility.TraceMethod 
    /// It traces the stop message when disposed.
    /// </remarks>
    internal class TraceActivity : IDisposable
    {
        /// <summary>
        /// the trace source to trace the stop message.
        /// </summary>
        private TraceSource source;

        /// <summary>
        /// The name of the activity or method to include in the trace message.
        /// </summary>
        private string activity;

        /// <summary>
        /// Initializes a new instance of the TraceActivity class.
        /// </summary>
        /// <param name="source">the trace source to trace on.</param>
        /// <param name="activity">the activity to include with the message</param>
        public TraceActivity(TraceSource source, string activity)
        {
            if (source == null)
            {
                throw new ArgumentNullException("source");
            }

            if (String.IsNullOrEmpty(activity))
            {
                throw new ArgumentOutOfRangeException("activity");
            }

            this.source = source;
            this.activity = activity;
            this.source.TraceEvent(TraceEventType.Start, 0, "Enter: {0}", this.activity);
        }

        /// <summary>
        /// Finalizes an instance of the TraceActivity class.
        /// </summary>
        ~TraceActivity()
        {
            this.Dispose(false);
        }

        #region IDisposable Members

        /// <summary>
        /// Disposes an instance of the TraceActivity class.
        /// </summary>
        /// <remarks>
        /// This will trace the stop message for the activity.
        /// </remarks>
        public void Dispose()
        {
            this.Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Override in derived classes to add behavior when the object is disposed.
        /// </summary>
        /// <param name="disposing">true if the object is being disposed</param>
        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                this.source.TraceEvent(TraceEventType.Stop, 0, "Exit: {0}", this.activity);
            }
        }

        #endregion
    }
}
