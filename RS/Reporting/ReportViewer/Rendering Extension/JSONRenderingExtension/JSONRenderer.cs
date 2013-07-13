using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;
using Jayrock.Json;
using Microsoft.ReportingServices.Interfaces;
using System.Collections.Specialized;
using System.Collections;
using Microsoft.ReportingServices.OnDemandReportRendering;
using Forerunner.SSRS.JSONRender;

namespace Forerunner.RenderingExtensions
{

    public class JSONRenderer : IRenderingExtension
    {
        private IRenderingExtension RPL;
        public string LocalizedName { get { return "ForerunnerJSON"; } }
        static Type rplRendererType = null;
        private Stream RegisteredStream = null;
        private ReportJSONWriter JSON;

        public JSONRenderer()
        {
            if (rplRendererType == null)
            {
                // Use a disassembler tool like ILSpy to find The AssemblyName, type and constructor methods for other internal renderers in their respective .dlls
                Assembly IR = Assembly.Load(new AssemblyName("Microsoft.ReportingServices.RPLRendering, Version=10.0.0.0, Culture=neutral, PublicKeyToken=89845dcd8080cc91"));

                //Read the PdfRenderer type from the Assembly
                rplRendererType = IR.GetType("Microsoft.ReportingServices.Rendering.RPLRendering.RPLRenderer");
            }

            //Create an instance of type RPLRenderer. 
            //Now, RPLRenderer inherits from IRenderingExtension which is a public interface so cast it.
            RPL = (IRenderingExtension)rplRendererType.GetConstructor(BindingFlags.Public | BindingFlags.Instance, null, Type.EmptyTypes, null).Invoke(null);

        }

        //[StrongNameIdentityPermissionAttribute(SecurityAction.LinkDemand, PublicKey = "0024000004800000940000000602000000240000525341310004000001000100272736ad6e5f9586bac2d531eabc3acc666c2f8ec879fa94f8f7b0327d2ff2ed523448f83c3d5c5dd2dfc7bc99c5286b2c125117bf5cbe242b9d41750732b2bdffe649c6efb8e5526d526fdd130095ecdb7bf210809c6cdad8824faa9ac0310ac3cba2aa0523567b2dfa7fe250b30facbd62d4ec99b94ac47c7d3b28f1f6e4c8")]
        public void GetRenderingResource(CreateAndRegisterStream createAndRegisterStreamCallback, NameValueCollection deviceInfo)
        {
            RPL.GetRenderingResource(createAndRegisterStreamCallback, deviceInfo);
        }
        
        //[StrongNameIdentityPermissionAttribute(SecurityAction.LinkDemand, PublicKey = "0024000004800000940000000602000000240000525341310004000001000100272736ad6e5f9586bac2d531eabc3acc666c2f8ec879fa94f8f7b0327d2ff2ed523448f83c3d5c5dd2dfc7bc99c5286b2c125117bf5cbe242b9d41750732b2bdffe649c6efb8e5526d526fdd130095ecdb7bf210809c6cdad8824faa9ac0310ac3cba2aa0523567b2dfa7fe250b30facbd62d4ec99b94ac47c7d3b28f1f6e4c8")]
        public bool Render(Microsoft.ReportingServices.OnDemandReportRendering.Report report, NameValueCollection reportServerParameters, NameValueCollection deviceInfo, NameValueCollection clientCapabilities, ref Hashtable renderProperties, CreateAndRegisterStream createAndRegisterStream)
        {
            bool retval;
            Stream outputStream = createAndRegisterStream(report.Name, "json", Encoding.UTF8, "text/json", true, StreamOper.CreateAndRegister);
            retval = RPL.Render(report, reportServerParameters, deviceInfo, clientCapabilities, ref renderProperties, new Microsoft.ReportingServices.Interfaces.CreateAndRegisterStream(IntermediateCreateAndRegisterStream));

            RegisteredStream.Position = 0;
            JSON = new ReportJSONWriter(RegisteredStream);
            byte[] UTF8JSON = Encoding.UTF8.GetBytes(JSON.RPLToJSON(int.Parse(renderProperties["TotalPages"].ToString())));
            outputStream.Write(UTF8JSON ,0,UTF8JSON.Length);
            return retval;
        }

        //[StrongNameIdentityPermissionAttribute(SecurityAction.LinkDemand, PublicKey = "0024000004800000940000000602000000240000525341310004000001000100272736ad6e5f9586bac2d531eabc3acc666c2f8ec879fa94f8f7b0327d2ff2ed523448f83c3d5c5dd2dfc7bc99c5286b2c125117bf5cbe242b9d41750732b2bdffe649c6efb8e5526d526fdd130095ecdb7bf210809c6cdad8824faa9ac0310ac3cba2aa0523567b2dfa7fe250b30facbd62d4ec99b94ac47c7d3b28f1f6e4c8")]
        public bool RenderStream(string streamName, Microsoft.ReportingServices.OnDemandReportRendering.Report report, NameValueCollection reportServerParameters, NameValueCollection deviceInfo, NameValueCollection clientCapabilities, ref Hashtable renderProperties, CreateAndRegisterStream createAndRegisterStream)
        {
            return RPL.RenderStream(streamName, report, reportServerParameters, deviceInfo, clientCapabilities, ref renderProperties, createAndRegisterStream);
        }
        //[StrongNameIdentityPermissionAttribute(SecurityAction.LinkDemand, PublicKey = "0024000004800000940000000602000000240000525341310004000001000100272736ad6e5f9586bac2d531eabc3acc666c2f8ec879fa94f8f7b0327d2ff2ed523448f83c3d5c5dd2dfc7bc99c5286b2c125117bf5cbe242b9d41750732b2bdffe649c6efb8e5526d526fdd130095ecdb7bf210809c6cdad8824faa9ac0310ac3cba2aa0523567b2dfa7fe250b30facbd62d4ec99b94ac47c7d3b28f1f6e4c8")]
        public void SetConfiguration(string configuration)
        {
            RPL.SetConfiguration(configuration);
        }

        Stream IntermediateCreateAndRegisterStream(
            string name,
            string extension,
            Encoding encoding,
            string mimeType,
            bool willSeek,
            StreamOper operation)
        {
            // Create and return a new MemoryStream,
            // which will contain the results of the PDF renderer.
            CreateAndRegisterStreamStream crss = new CreateAndRegisterStreamStream(name, extension, encoding, mimeType, willSeek, operation, new MemoryStream());


            if (operation == StreamOper.CreateAndRegister && this.RegisteredStream == null)
                //Create the main stream. Contents of this stream are returned later
                this.RegisteredStream = crss.Stream;

            return crss.Stream;
        }   
    }

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
