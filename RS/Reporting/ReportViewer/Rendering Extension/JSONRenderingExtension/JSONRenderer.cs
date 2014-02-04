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
using Forerunner.RenderingExtensions;
using ReportManager.Util.Logging;
using ForerunnerLicense;

namespace Forerunner.RenderingExtensions
{

    public class JSONRenderer : IRenderingExtension
    {
        private IRenderingExtension RPL;
        public string LocalizedName { get { return "ForerunnerJSON"; } }
        static Type rplRendererType = null;
        private Stream RegisteredStream = null;
        private ReportJSONWriter JSON;
        private CreateAndRegisterStream RenderStreams = null;

        public JSONRenderer()
        {
            if (rplRendererType == null)
            {
                Assembly IR = Assembly.Load(new AssemblyName("Microsoft.ReportingServices.RPLRendering, Version=10.0.0.0, Culture=neutral, PublicKeyToken=89845dcd8080cc91"));
                rplRendererType = IR.GetType("Microsoft.ReportingServices.Rendering.RPLRendering.RPLRenderer");
            }

            //Create an instance of type RPLRenderer. 
            //Now, RPLRenderer inherits from IRenderingExtension which is a public interface so cast it.
            RPL = (IRenderingExtension)rplRendererType.GetConstructor(BindingFlags.Public | BindingFlags.Instance, null, Type.EmptyTypes, null).Invoke(null);
        }

        public void GetRenderingResource(CreateAndRegisterStream createAndRegisterStreamCallback, NameValueCollection deviceInfo)
        {
            RPL.GetRenderingResource(createAndRegisterStreamCallback, deviceInfo);
        }
        
        public bool Render(Microsoft.ReportingServices.OnDemandReportRendering.Report report, NameValueCollection reportServerParameters, NameValueCollection deviceInfo, NameValueCollection clientCapabilities, ref Hashtable renderProperties, CreateAndRegisterStream createAndRegisterStream)
        {
            try
            {
                Logger.Trace(LogType.Info, "JSONRenderer.Render " + report.Name);
                bool retval;
                RenderStreams = createAndRegisterStream;
                Stream outputStream = createAndRegisterStream(report.Name, "json", Encoding.UTF8, "text/json", true, StreamOper.CreateAndRegister);
                retval = RPL.Render(report, reportServerParameters, deviceInfo, clientCapabilities, ref renderProperties, new Microsoft.ReportingServices.Interfaces.CreateAndRegisterStream(IntermediateCreateAndRegisterStream));

                RegisteredStream.Position = 0;
                JSON = new ReportJSONWriter(RegisteredStream);
                byte[] UTF8JSON = Encoding.UTF8.GetBytes(JSON.RPLToJSON(int.Parse(renderProperties["TotalPages"].ToString())).ToString());
                outputStream.Write(UTF8JSON, 0, UTF8JSON.Length);
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
