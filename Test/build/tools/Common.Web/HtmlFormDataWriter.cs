//-----------------------------------------------------------------------
// <copyright file="HtmlFormDataWriter.cs" company="Jon Rowlett">
//     Copyright (C) 2010 Jon Rowlett. All rights reserved.
// </copyright>
// <author>Jon Rowlett</author>
//-----------------------------------------------------------------------
namespace Common.Web
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Used to post form data to a request stream.
    /// For specific content types, used derived classes.
    /// </summary>
    public abstract class HtmlFormDataWriter : IDisposable
    {
        /// <summary>
        /// the underlying writer.
        /// </summary>
        private TextWriter requestWriter;

        /// <summary>
        /// whether or not this owns the writer.
        /// </summary>
        private bool ownsWriter;

        /// <summary>
        /// the content type that is being written.
        /// </summary>
        private string contentType;

        /// <summary>
        /// Initializes a new instance of the HtmlFormDataWriter class.
        /// </summary>
        /// <param name="requestWriter">the underlying text writer</param>
        /// <param name="ownsWriter">whether or not to close the writer on dispose</param>
        /// <param name="contentType">the content type of the form data</param>
        protected HtmlFormDataWriter(TextWriter requestWriter, bool ownsWriter, string contentType)
        {
            this.requestWriter = requestWriter;
            this.ownsWriter = ownsWriter;
            this.contentType = contentType;
        }

        /// <summary>
        /// Finalizes an instance of the HtmlFormDataWriter class.
        /// </summary>
        ~HtmlFormDataWriter()
        {
            this.Dispose(false);
        }

        /// <summary>
        /// Gets the content type of the writer.
        /// </summary>
        public virtual string ContentType
        {
            get
            {
                return this.contentType;
            }
        }

        /// <summary>
        /// Gets the underlying text writer where the text will be written.
        /// </summary>
        protected TextWriter RequestWriter
        {
            get
            {
                if (this.requestWriter == null)
                {
                    throw new ObjectDisposedException(this.ToString());
                }

                return this.requestWriter;
            }
        }

        /// <summary>
        /// writes a string input value
        /// </summary>
        /// <param name="name">name of the input</param>
        /// <param name="value">value of the input</param>
        public abstract void WriteInput(string name, string value);
        
        /// <summary>
        /// Writes the contents of a stream
        /// </summary>
        /// <param name="name">name of the input</param>
        /// <param name="value">a stream, the contents of which are the value of the input</param>
        public abstract void WriteInput(string name, Stream value);

        /// <summary>
        /// Disposes an instance of the HtmlFormDataWriter class.
        /// </summary>
        public void Dispose()
        {
            this.Dispose(true);
            GC.SuppressFinalize(this);
        }

        /// <summary>
        /// Disposes the resources owns by this instance.
        /// </summary>
        /// <param name="disposing">true if called from IDisposable</param>
        protected virtual void Dispose(bool disposing)
        {
            if (disposing && this.ownsWriter && this.requestWriter != null)
            {
                this.requestWriter.Dispose();
                this.requestWriter = null;
            }
        }
    }
}
