//-----------------------------------------------------------------------
// <copyright file="UrlEncodedHtmlFormDataWriter.cs" company="Jon Rowlett">
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
    /// Writes url encoded form data to a request stream
    /// </summary>
    public class UrlEncodedHtmlFormDataWriter : HtmlFormDataWriter
    {
        /// <summary>
        /// The content type
        /// </summary>
        private static readonly string contentType = "application/x-www-form-urlencoded";

        /// <summary>
        /// used by the writer to prepend an ampersand between parts.
        /// </summary>
        private bool prependAmpersand;

        /// <summary>
        /// Initializes a new instance of the UrlEncodedHtmlFormDataWriter class.
        /// </summary>
        /// <param name="requestStream">the request stream from WebRequest</param>
        public UrlEncodedHtmlFormDataWriter(Stream requestStream)
            : base(new StreamWriter(requestStream, Encoding.ASCII), true, contentType)
        {
        }

        /// <summary>
        /// Writes a string input to the request
        /// </summary>
        /// <param name="name">name of the string input</param>
        /// <param name="value">value of the string input</param>
        public override void WriteInput(string name, string value)
        {
            if (this.prependAmpersand)
            {
                this.RequestWriter.Write('&');
            }

            this.RequestWriter.Write(HtmlUtility.UrlEncode(name));
            this.RequestWriter.Write('=');
            this.RequestWriter.Write(HtmlUtility.UrlEncode(value));

            this.prependAmpersand = true;
        }

        /// <summary>
        /// Writes a stream to the request
        /// </summary>
        /// <param name="name">name of the input</param>
        /// <param name="value">the data to write.</param>
        public override void WriteInput(string name, System.IO.Stream value)
        {
            throw new NotImplementedException();
        }
    }
}
