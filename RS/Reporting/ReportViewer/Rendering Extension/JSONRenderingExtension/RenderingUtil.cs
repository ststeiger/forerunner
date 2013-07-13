using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using Microsoft.ReportingServices.Interfaces;
using System.Collections.Specialized;
using System.Collections;
using Microsoft.ReportingServices.OnDemandReportRendering;

namespace Forerunner.RenderingExtensions
{
    internal class CreateAndRegisterStreamStream
    {
        #region Attributes and Properties

        string name;

        internal string Name
        {
            get { return name; }
            set { name = value; }
        }
        string extension;

        internal string Extension
        {
            get { return extension; }
            set { extension = value; }
        }
        Encoding encoding;

        internal Encoding Encoding
        {
            get { return encoding; }
            set { encoding = value; }
        }
        string mimeType;

        internal string MimeType
        {
            get { return mimeType; }
            set { mimeType = value; }
        }
        bool willSeek;

        internal bool WillSeek
        {
            get { return willSeek; }
            set { willSeek = value; }
        }
        StreamOper operation;

        internal StreamOper Operation
        {
            get { return operation; }
            set { operation = value; }
        }

        protected Stream stream;

        internal Stream Stream
        {
            get { return stream; }
            set { stream = value; }
        }

        #endregion

        internal CreateAndRegisterStreamStream(string name,
            string extension,
            Encoding encoding,
            string mimeType,
            bool willSeek,
            StreamOper operation,
            Stream stream)
        {
            this.name = name;
            this.encoding = encoding;
            this.extension = extension;
            this.mimeType = mimeType;
            this.operation = operation;
            this.willSeek = willSeek;

            this.stream = stream;
        }

        internal virtual void CloseStream()
        {
            stream.Close();
        }
    }

}
