//-----------------------------------------------------------------------
// <copyright file="MultiPartHtmlFormDataWriter.cs" company="Jon Rowlett">
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
    /// Posts Multipart form data to request stream
    /// </summary>
    public class MultiPartHtmlFormDataWriter : HtmlFormDataWriter
    {
        /// <summary>
        /// The concent type used for the request.
        /// </summary>
        private static readonly string contentType = "multipart/form-data";

        /// <summary>
        /// Content Dispositino header format
        /// </summary>
        private static readonly string contentDisposition = "Content-Disposition: form-data; name=\"{0}\"";

        /// <summary>
        /// the boundary between parts.
        /// </summary>
        private string boundary;

        /// <summary>
        /// Initializes a new instance of the MultiPartHtmlFormDataWriter class.
        /// </summary>
        /// <param name="requestStream">the request stream to write to.</param>
        public MultiPartHtmlFormDataWriter(Stream requestStream)
            : this(requestStream, true)
        {
        }

        /// <summary>
        /// Initializes a new instance of the MultiPartHtmlFormDataWriter class.
        /// </summary>
        /// <param name="requestStream">the request stream</param>
        /// <param name="ownsStream">true if it owns the stream</param>
        public MultiPartHtmlFormDataWriter(Stream requestStream, bool ownsStream)
            : base(new StreamWriter(requestStream, Encoding.ASCII), ownsStream, contentType)
        {
            this.boundary = CreateBoundary();
        }

        /// <summary>
        /// Gets the content type used for the request
        /// </summary>
        public override string ContentType
        {
            get
            {
                return String.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "{0}; boundary={1}",
                    base.ContentType,
                    this.boundary);
            }
        }

        /// <summary>
        /// Writes binary data to the post request
        /// </summary>
        /// <param name="name">name of the input</param>
        /// <param name="value">value of the input</param>
        public override void WriteInput(string name, Stream value)
        {
            this.WriteFile(name, value, String.Empty);
        }

        /// <summary>
        /// Writes string text data to the post request
        /// </summary>
        /// <param name="name">name of the input</param>
        /// <param name="value">value of the input</param>
        public override void WriteInput(string name, string value)
        {
            this.RequestWriter.Write("--");
            this.RequestWriter.WriteLine(this.boundary);
            this.RequestWriter.WriteLine(
                String.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    contentDisposition,
                    name));
            this.RequestWriter.WriteLine();
            this.RequestWriter.WriteLine(value);
        }

        /// <summary>
        /// Writes file data to the stream
        /// </summary>
        /// <param name="name">name of the input element for the file</param>
        /// <param name="fileData">the file data</param>
        /// <param name="fileName">the name of the file</param>
        public void WriteFile(string name, Stream fileData, string fileName)
        {
            this.WriteFile(name, fileData, fileName, "application/octet-stream");
        }

        /// <summary>
        /// Writes file contents using a specific content type
        /// </summary>
        /// <param name="name">name of the input</param>
        /// <param name="fileData">the file data</param>
        /// <param name="fileName">the file name</param>
        /// <param name="contentType">the content type</param>
        public void WriteFile(string name, Stream fileData, string fileName, string contentType)
        {
            this.RequestWriter.Write("--");
            this.RequestWriter.WriteLine(this.boundary);
            this.RequestWriter.Write(
                String.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    contentDisposition,
                    HtmlUtility.UrlEncode(name)));
            this.RequestWriter.WriteLine(
                String.Format(
                    System.Globalization.CultureInfo.InvariantCulture,
                    "; filename=\"{0}\"",
                    fileName));
            this.RequestWriter.WriteLine(String.Format(System.Globalization.CultureInfo.InvariantCulture, "Content-Type: {0}", contentType));
            this.RequestWriter.WriteLine();
            if (fileData != null)
            {
                StreamWriter writer = (StreamWriter)this.RequestWriter;
                writer.Flush();
                CopyStream(fileData, writer.BaseStream);
            }

            this.RequestWriter.WriteLine();
        }

        /// <summary>
        /// Disposes an instance of the MultiPartHtmlFormDataWriter
        /// </summary>
        /// <param name="disposing">true if called from Dispose</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                this.RequestWriter.Write("--");
                this.RequestWriter.Write(this.boundary);
                this.RequestWriter.WriteLine("--");
                this.RequestWriter.Flush();
            }

            base.Dispose(disposing);
        }

        /// <summary>
        /// Creates the boundary text.
        /// </summary>
        /// <returns>the boundary string</returns>
        private static string CreateBoundary()
        {
            Random rand = new Random();
            return string.Format(
                System.Globalization.CultureInfo.InvariantCulture,
                "--------{0}",
                rand.Next(Int32.MaxValue));
        }

        /// <summary>
        /// Copies the contents from one stream to another.
        /// </summary>
        /// <param name="source">source stream</param>
        /// <param name="destination">destination stream</param>
        private static void CopyStream(Stream source, Stream destination)
        {
            byte[] buffer = new byte[0x1000];
            int copyCount = source.Read(buffer, 0, buffer.Length);
            while (copyCount > 0)
            {
                destination.Write(buffer, 0, copyCount);
                copyCount = source.Read(buffer, 0, buffer.Length);
            }
        }
    }
}
