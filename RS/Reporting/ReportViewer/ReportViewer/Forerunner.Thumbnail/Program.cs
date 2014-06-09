using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using System.IO;
using System.Drawing;

namespace Forerunner.Thumbnail
{
    class Program
    {
        private static string FileName = null;
        private static double maxHeightToWidthRatio = 1.2;

        static void Main(string[] args)
        {

            Thread t = null;
            try
            {
                FileName = args[0];
                t = new Thread(new ThreadStart(_GetScreenShot));
                t.SetApartmentState(ApartmentState.STA);
                t.Start();
            }
            finally
            {
                if (t != null)
                {
                    t.Join();
                }
            }
            
        }


        private static void _GetScreenShot()
        {
            
            try
            {
                using (WebBrowser webBrowser = new WebBrowser())
                {
                    webBrowser.ScrollBarsEnabled = false;                    
                    webBrowser.Url = new System.Uri(FileName);
                    while (webBrowser.ReadyState != WebBrowserReadyState.Complete)
                        Application.DoEvents();
                    SetIamge(webBrowser);
                }
        
            }
            catch (Exception e)
            {
                //Logger.Trace(LogType.Error, "_GetScreenShot failed");
                //ExceptionLogGenerator.LogException(e);
            }
            finally
            {
                if (FileName != null)
                    File.Delete(FileName);
            }

        }

        private static void SetIamge(WebBrowser webBrowser)
        {

            int w = webBrowser.Document.Body.ScrollRectangle.Width;
            int h = webBrowser.Document.Body.ScrollRectangle.Height;
            if (w > 1500) w = 1500; //Set an upper bound to limit the size
            if (maxHeightToWidthRatio > 0 && h > w * maxHeightToWidthRatio)
            {
                h = (int)(w * maxHeightToWidthRatio);
            }
            if (h > 1500) h = 1500;  //Set an upper bound to limit the size

            webBrowser.ClientSize = new Size(w, h);
            webBrowser.ScrollBarsEnabled = false;
            Bitmap bmp = new Bitmap(w, h);

            webBrowser.BringToFront();
            webBrowser.DrawToBitmap(bmp, webBrowser.Bounds);
            webBrowser.Navigate("about:blank");
            webBrowser.Dispose();
            bmp.Save(FileName + ".jpg", System.Drawing.Imaging.ImageFormat.Jpeg);
        }


    }
}
