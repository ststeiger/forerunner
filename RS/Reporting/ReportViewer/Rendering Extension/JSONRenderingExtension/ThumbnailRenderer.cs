﻿using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.IO;
using System.Reflection;
using Microsoft.ReportingServices.Interfaces;
using System.Collections.Specialized;
using System.Collections;
using Microsoft.ReportingServices.OnDemandReportRendering;
using Forerunner.Logging;
using System.Diagnostics;

namespace Forerunner.RenderingExtensions
{

    public class ThumbnailRenderer : IRenderingExtension
    {
        private IRenderingExtension InnerRender = null;
        public string LocalizedName { get { return "ForerunnerThumbnail"; } }
        static Type RendererType = null;
        private Stream RegisteredStream = null;


        private IRenderingExtension GetInnerRender()
        {
            if (InnerRender == null)
                Init();
            if (InnerRender == null)
            {
                ExceptionLogGenerator.LogException("Inner Render null", "Init");
                throw new Exception("Inner Render null");
            }

            return InnerRender;

        }

        public void Init()
        {
            if (RendererType == null)
            {
                Assembly IR;
                // Use a disassembler tool like ILSpy to find The AssemblyName, type and constructor methods for other internal renderers in their respective .dlls                    
                IR = Assembly.Load(new AssemblyName("Microsoft.ReportingServices.HtmlRendering, Version=11.0.0.0, Culture=neutral, PublicKeyToken=89845dcd8080cc91"));

                //Read the PdfRenderer type from the Assembly
                if (IR != null)
                    RendererType = IR.GetType("Microsoft.ReportingServices.Rendering.HtmlRenderer.MHtmlRenderingExtension");
                else
                    Logger.Trace(LogType.Error, "ThumbnailRenderer cannot get type"); 
            }
            //Create an instance of type RPLRenderer. 
            //Now, RPLRenderer inherits from IRenderingExtension which is a public interface so cast it.
            if (RendererType != null)
                InnerRender = (IRenderingExtension)RendererType.GetConstructor(BindingFlags.Public | BindingFlags.Instance, null, Type.EmptyTypes, null).Invoke(null);
            else
                Logger.Trace(LogType.Error, "ThumbnailRenderer cannot get inner Render"); 
           
        }

        public void GetRenderingResource(CreateAndRegisterStream createAndRegisterStreamCallback, NameValueCollection deviceInfo)
        {            
            GetInnerRender().GetRenderingResource(createAndRegisterStreamCallback, deviceInfo);
        }
        
        public bool Render(Microsoft.ReportingServices.OnDemandReportRendering.Report report, NameValueCollection reportServerParameters, NameValueCollection deviceInfo, NameValueCollection clientCapabilities, ref Hashtable renderProperties, CreateAndRegisterStream createAndRegisterStream)
        {
            try
            {
                Logger.Trace(LogType.Info, "ThumbnailRenderer.Render " + report.Name);                
                bool retval;
                using (MemoryStream ms = new MemoryStream())
                {
                    retval = GetInnerRender().Render(report, reportServerParameters, deviceInfo, clientCapabilities, ref renderProperties, new Microsoft.ReportingServices.Interfaces.CreateAndRegisterStream(IntermediateCreateAndRegisterStream));

                    RegisteredStream.Position = 0;
                    string fileName = Path.GetTempPath() + Path.GetRandomFileName() + ".mht";
                    byte[] buffer = new byte[8 * 1024];
                    using (FileStream f = System.IO.File.OpenWrite(fileName))
                    {
                        int len;
                        while ((len = RegisteredStream.Read(buffer, 0, buffer.Length)) > 0)
                        {
                            f.Write(buffer, 0, len);
                        }
                        f.Close();
                    }


                    //Call external app to get image
                    System.Diagnostics.ProcessStartInfo start = new System.Diagnostics.ProcessStartInfo();
                    start.WorkingDirectory = System.Web.Hosting.HostingEnvironment.MapPath("~/") + @"bin\";
                    start.FileName = @"Forerunner.Thumbnail.exe";
                    start.WindowStyle = System.Diagnostics.ProcessWindowStyle.Hidden;
                    start.Arguments = fileName;
                    Process p = System.Diagnostics.Process.Start(start);
                    p.WaitForExit();

                    byte[] jpg = System.IO.File.ReadAllBytes(fileName + ".jpg");
                    File.Delete(fileName + ".jpg");

                    Stream outputStream = createAndRegisterStream(report.Name, "jpg", Encoding.Default, "image/JPEG", true, StreamOper.CreateAndRegister);
                    outputStream.Write(jpg, 0, jpg.Length);

                }
                return retval;
            }
            catch (Exception e)
            {
                ExceptionLogGenerator.LogException(e);
                throw e;
            }
        }

        public bool RenderStream(string streamName, Microsoft.ReportingServices.OnDemandReportRendering.Report report, NameValueCollection reportServerParameters, NameValueCollection deviceInfo, NameValueCollection clientCapabilities, ref Hashtable renderProperties, CreateAndRegisterStream createAndRegisterStream)
        {
            return GetInnerRender().RenderStream(streamName, report, reportServerParameters, deviceInfo, clientCapabilities, ref renderProperties, createAndRegisterStream);
        }

        public void SetConfiguration(string configuration)
        {
            GetInnerRender().SetConfiguration(configuration);
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