using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Reflection;
using Microsoft.ReportingServices.Interfaces;
using System.Collections.Specialized;
using System.Collections;
using Microsoft.ReportingServices.OnDemandReportRendering;
using Forerunner.Thumbnail;

namespace Forerunner.RenderingExtensions
{

    public class ThumbnailRenderer : IRenderingExtension
    {
        private IRenderingExtension InnerRender;
        public string LocalizedName { get { return "ForerunnerThumbnail"; } }
        static Type RendererType = null;
        private Stream RegisteredStream = null;


        public ThumbnailRenderer()
        {
            if (RendererType == null)
            {
                // Use a disassembler tool like ILSpy to find The AssemblyName, type and constructor methods for other internal renderers in their respective .dlls
                Assembly IR = Assembly.Load(new AssemblyName("Microsoft.ReportingServices.HtmlRendering, Version=10.0.0.0, Culture=neutral, PublicKeyToken=89845dcd8080cc91"));

                //Read the PdfRenderer type from the Assembly
                RendererType = IR.GetType("Microsoft.ReportingServices.Rendering.HtmlRenderer.MHtmlRenderingExtension");
            }

            //Create an instance of type RPLRenderer. 
            //Now, RPLRenderer inherits from IRenderingExtension which is a public interface so cast it.
            InnerRender = (IRenderingExtension)RendererType.GetConstructor(BindingFlags.Public | BindingFlags.Instance, null, Type.EmptyTypes, null).Invoke(null);

        }

        public void GetRenderingResource(CreateAndRegisterStream createAndRegisterStreamCallback, NameValueCollection deviceInfo)
        {
            InnerRender.GetRenderingResource(createAndRegisterStreamCallback, deviceInfo);
        }
        
        public bool Render(Microsoft.ReportingServices.OnDemandReportRendering.Report report, NameValueCollection reportServerParameters, NameValueCollection deviceInfo, NameValueCollection clientCapabilities, ref Hashtable renderProperties, CreateAndRegisterStream createAndRegisterStream)
        {
            bool retval;
            MemoryStream ms = new MemoryStream(); 

            Stream outputStream = createAndRegisterStream(report.Name, "jpg", Encoding.Default, "image/JPEG", true, StreamOper.CreateAndRegister);
            retval = InnerRender.Render(report, reportServerParameters, deviceInfo, clientCapabilities, ref renderProperties, new Microsoft.ReportingServices.Interfaces.CreateAndRegisterStream(IntermediateCreateAndRegisterStream));

            RegisteredStream.Position = 0;
            WebSiteThumbnail.GetStreamThumbnail(RegisteredStream, 1.2).Save(ms, System.Drawing.Imaging.ImageFormat.Jpeg);

            byte[] buffer = new byte[8 * 1024];
            int len;
            ms.Position = 0;
            while ((len = ms.Read(buffer, 0, buffer.Length)) > 0)
            {
                outputStream.Write(buffer, 0, len);
            }
            return retval;
        }

        public bool RenderStream(string streamName, Microsoft.ReportingServices.OnDemandReportRendering.Report report, NameValueCollection reportServerParameters, NameValueCollection deviceInfo, NameValueCollection clientCapabilities, ref Hashtable renderProperties, CreateAndRegisterStream createAndRegisterStream)
        {
            return InnerRender.RenderStream(streamName, report, reportServerParameters, deviceInfo, clientCapabilities, ref renderProperties, createAndRegisterStream);
        }

        public void SetConfiguration(string configuration)
        {
            InnerRender.SetConfiguration(configuration);
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
}