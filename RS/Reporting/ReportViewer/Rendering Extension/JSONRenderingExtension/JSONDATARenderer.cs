using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text;
using Forerunner.JSONWriter;
using Microsoft.ReportingServices.Interfaces;
using System.Collections.Specialized;
using System.Collections;
using Microsoft.ReportingServices.OnDemandReportRendering;
using Forerunner.SSRS.JSONRender;
using Forerunner.RenderingExtensions;
using Forerunner.Logging;
using ForerunnerLicense;
using System.Xml;
using Newtonsoft.Json;

namespace Forerunner.RenderingExtensions
{

    public class JSONDATARenderer : IRenderingExtension
    {
        private IRenderingExtension Renderer = null;
        public string LocalizedName { get { return "ForerunnerJSONDATA"; } }
        static Type RendererType = null;
        private Stream RegisteredStream = null;
        private CreateAndRegisterStream RenderStreams = null;

        private void Init()
        {
            if (RendererType == null)
            {
                Assembly IR;
                IR = Assembly.Load(new AssemblyName("Microsoft.ReportingServices.DataRendering, Version=10.0.0.0, Culture=neutral, PublicKeyToken=89845dcd8080cc91"));

                if (IR != null)
                    RendererType = IR.GetType("Microsoft.ReportingServices.Rendering.DataRenderer.XmlDataReport");
                else
                    Logger.Trace(LogType.Error, "JSONDATARenderer cannot get type");

            }

            //Create an instance of type RPLRenderer. 
            //Now, RPLRenderer inherits from IRenderingExtension which is a public interface so cast it.
            if (RendererType != null)
                Renderer = (IRenderingExtension)RendererType.GetConstructor(BindingFlags.Public | BindingFlags.Instance, null, Type.EmptyTypes, null).Invoke(null);
            else
                Logger.Trace(LogType.Error, "JSONDATARenderer cannot get inner Render");

        }
        private IRenderingExtension GetRenderer()
        {
            if (Renderer == null)
                Init();
            if (Renderer == null)
            {
                ExceptionLogGenerator.LogException("Inner Render null", "Init");
                throw new Exception("Inner Render null");
            }
            return Renderer;

        }
        public void GetRenderingResource(CreateAndRegisterStream createAndRegisterStreamCallback, NameValueCollection deviceInfo)
        {
            GetRenderer().GetRenderingResource(createAndRegisterStreamCallback, deviceInfo);
        }

        public bool Render(Microsoft.ReportingServices.OnDemandReportRendering.Report report, NameValueCollection reportServerParameters, NameValueCollection deviceInfo, NameValueCollection clientCapabilities, ref Hashtable renderProperties, CreateAndRegisterStream createAndRegisterStream)
        {

            try
            {
                Logger.Trace(LogType.Info, "JSONDATARenderer.Render " + report.Name);
                bool retval;
                RenderStreams = createAndRegisterStream;

                Stream outputStream = createAndRegisterStream(report.Name, "json", Encoding.UTF8, "text/json", true, StreamOper.CreateAndRegister);

                deviceInfo["OmitSchema"] = "true";
                retval = GetRenderer().Render(report, reportServerParameters, deviceInfo, clientCapabilities, ref renderProperties, new Microsoft.ReportingServices.Interfaces.CreateAndRegisterStream(IntermediateCreateAndRegisterStream));             

                if (RegisteredStream.Length != 0)
                {

                    RegisteredStream.Position = 0;
                    
                    XmlDocument doc = new XmlDocument();                    
                    doc.Load(RegisteredStream);
                    doc.DocumentElement.Attributes.RemoveNamedItem("xmlns");

                    StringBuilder json = new StringBuilder(JsonConvert.SerializeXmlNode(doc, Newtonsoft.Json.Formatting.None, false));

                    //Remove the @ for attributes
                    json.Replace(",\"@", ",\"").Replace("{\"@", "{\"");
                    //Remove the XML header, it is always 44 chars
                    json.Remove(1, 44);

                    byte[] result = Encoding.UTF8.GetBytes(json.ToString());                    
                    
                    outputStream.Write(result, 0, result.Length);

                    
                }
                return retval;
            }
            catch (LicenseException e)
            {
                ExceptionLogGenerator.LogException(e);
                return false;
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                throw e;
            }
        }

        public bool RenderStream(string streamName, Microsoft.ReportingServices.OnDemandReportRendering.Report report, NameValueCollection reportServerParameters, NameValueCollection deviceInfo, NameValueCollection clientCapabilities, ref Hashtable renderProperties, CreateAndRegisterStream createAndRegisterStream)
        {
            return GetRenderer().RenderStream(streamName, report, reportServerParameters, deviceInfo, clientCapabilities, ref renderProperties, createAndRegisterStream);
        }
        //[StrongNameIdentityPermissionAttribute(SecurityAction.LinkDemand, PublicKey = "0024000004800000940000000602000000240000525341310004000001000100272736ad6e5f9586bac2d531eabc3acc666c2f8ec879fa94f8f7b0327d2ff2ed523448f83c3d5c5dd2dfc7bc99c5286b2c125117bf5cbe242b9d41750732b2bdffe649c6efb8e5526d526fdd130095ecdb7bf210809c6cdad8824faa9ac0310ac3cba2aa0523567b2dfa7fe250b30facbd62d4ec99b94ac47c7d3b28f1f6e4c8")]
        public void SetConfiguration(string configuration)
        {
            GetRenderer().SetConfiguration(configuration);
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

            if (operation == StreamOper.CreateAndRegister && this.RegisteredStream == null)
            {
                //Create the main stream. Contents of this stream are returned later
                CreateAndRegisterStreamStream crss = new CreateAndRegisterStreamStream(name, extension, encoding, mimeType, willSeek, operation, new MemoryStream());
                this.RegisteredStream = crss.Stream;
                return crss.Stream;
            }

            return RenderStreams(name, extension, encoding, mimeType, willSeek, operation);

        }
    }



}
