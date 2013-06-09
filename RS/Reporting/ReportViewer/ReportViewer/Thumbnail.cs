using System;
using System.Collections.Generic;
using System.Text;
using System;
using System.Drawing;
using System.Windows.Forms;
using System.Threading;
using System.IO;
using System.Reflection;

namespace Forerunner
{
    public enum ReportServerProtocalEnum { HTTP, HTTPS };
    public class Credentials
    {
        public enum SecurityTypeEnum { Network = 0, Custom = 1 };
        public SecurityTypeEnum SecurityType = SecurityTypeEnum.Network;
        public string UserName;
        public string Domain;
        public string Password;

        public Credentials() { }
        public Credentials(SecurityTypeEnum SecurityType = SecurityTypeEnum.Network, String UserName = "", string Domain = "", string Password = "")
        {
            this.SecurityType = SecurityType;
            this.UserName = UserName;
            this.Password = Password;
            this.Domain = Domain;
        }

    }
    public class WebSiteThumbnail
    {
        private string HTML = null;      
        private Bitmap bmp = null;
        private byte[] MHTML = null;
        private double maxHeightToWidthRatio = 0;
        public Bitmap Image 
        {
            get 
            { 
                return bmp; 
            } 
        }
        private ManualResetEvent mre = new ManualResetEvent(false);
        private WebBrowser webBrowser;
        private Func<string, string> callback = null;

        public static Bitmap GetStreamThumbnail(string HTML, double maxHeightToWidthRatio, Func<string, string> callback)
        {
            WebSiteThumbnail thumb = new WebSiteThumbnail(HTML, maxHeightToWidthRatio, callback);
            Bitmap b = thumb.GetScreenShot();            
            return b;
        }
        public static Bitmap GetStreamThumbnail(byte[] MHTML, double maxHeightToWidthRatio)
        {
            WebSiteThumbnail thumb = new WebSiteThumbnail(MHTML, maxHeightToWidthRatio);
            Bitmap b = thumb.GetScreenShot();            
            return b;
        }
        
        public WebSiteThumbnail(string HTML, double maxHeightToWidthRatio, Func<string, string> callback)
        {
            this.HTML = HTML;
            this.maxHeightToWidthRatio = maxHeightToWidthRatio;
            this.callback = callback;
        }

        public WebSiteThumbnail(byte[] MHTML, double maxHeightToWidthRatio)
        {
            this.MHTML = MHTML;
            this.maxHeightToWidthRatio = maxHeightToWidthRatio;
            
        }
        public Bitmap GetScreenShot()
        {

            Thread t = new Thread(new ThreadStart(_GetScreenShot));
            t.SetApartmentState(ApartmentState.STA);
            t.Start();
            mre.WaitOne();            
            //t.Abort();       
            return bmp;
        }
        
        private void _GetScreenShot()
        {
            webBrowser = new WebBrowser();
            webBrowser.ScrollBarsEnabled = false;
            string fileName = null;

            if (MHTML == null)
            {
                int length = 0;               
                webBrowser.Navigate("about:blank");
                webBrowser.Document.OpenNew(true);
                while (webBrowser.Document == null && webBrowser.Document.Body == null)
                    Application.DoEvents();
                webBrowser.Document.Write(this.HTML);
                foreach (HtmlElement he in webBrowser.Document.Images)
                {
                    string src = he.GetAttribute("src");
                    string s = callback(src);
                    he.SetAttribute("src", s);
                    length += s.Length;
                    if (length > 1024 * 10000) break;  //Limit the size
                }
                webBrowser.Document.Body.InnerHtml = webBrowser.Document.Body.InnerHtml;
                webBrowser.Update();
            }
            else
            {
                fileName = Path.GetTempPath() + Path.GetRandomFileName() + ".mht";
                System.IO.File.WriteAllBytes(fileName, MHTML);
                //webBrowser.Navigate(fileName);
                webBrowser.Url = new System.Uri(fileName);
                while ( webBrowser.ReadyState != WebBrowserReadyState.Complete )
                    Application.DoEvents();
            }
            
            SetIamge(webBrowser);
            if (fileName != null)
                File.Delete(fileName);
            if (mre != null)
                mre.Set();
        }

        private void SetIamge(WebBrowser webBrowser)
        {
            
            int w = webBrowser.Document.Body.ScrollRectangle.Width;
            int h = webBrowser.Document.Body.ScrollRectangle.Height;
            if (w > 1500) w = 1500; //Set an upper bound to limit the size
            if (maxHeightToWidthRatio > 0 && h > w * maxHeightToWidthRatio)
            {
                h = (int) (w * maxHeightToWidthRatio);
            }
            if (h > 1500) h = 1500;  //Set an upper bound to limit the size
            
            webBrowser.ClientSize = new Size(w,h );
            webBrowser.ScrollBarsEnabled = false;
            bmp = new Bitmap(w, h);
            
            webBrowser.BringToFront();
            webBrowser.DrawToBitmap(bmp, webBrowser.Bounds);
            webBrowser.Dispose();
       
        }

    }
}
